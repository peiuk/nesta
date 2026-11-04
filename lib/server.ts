import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {ensureSchema} from './ensure-schema';
import {readAdminOperations} from './admin-operations';
import {directoryQuery} from './directory-query';
import {listDonorPhotos,readDonorPhoto,uploadDonorPhotos,deleteDonorPhoto} from './donor-photos';
import {emailSignInAvailable} from './auth-options';
import {readClientHighlights} from './client-highlights';
import {isAddon,isTier,packageSpec,parseMilestones,planDraft,publicPlan,type Milestone} from './case-plans';
import {moveFaq,visibleFaq,type FaqEntry} from './faq';
import {buildDefaultFaqSyncStatements} from './faq-sync';
import {submitEggRequest,decideEggRequest,withdrawEggRequest,listEggRequests,type SelectionStore} from './egg-requests';
import {canReadReport,canManageCase,canReviewReport,canPublishReport,canUseDirectory,canPostQuestion,validMutation,validDate,validateUpload,accountChangeEffects} from './policy';
import {readAudit} from './audit-log';
import {alertRecipients,profileSubmittedAlert,questionAlert} from './alerts';
import {assertPartnerKind,canBindPartner,normalizePartnerId} from './partners';
import {DOCUMENT_KINDS,assertDocumentKind,assertDocumentStatus,normalizeStatusDate,projectDocument,sortDocuments,documentSeedRows,type DocumentRow} from './documents';
import {normalizeEmail,emailProfileId,generateOtpCode,hashSecret,verifySecret,parseSessionCookie,sessionCookieValue,clearSessionCookie,OTP_TTL_MS,SESSION_TTL_MS,OTP_MAX_ATTEMPTS,OTP_RESEND_MS} from './email-auth';
import {sendMail,MailError} from './mail';
export type Profile={id:string;email:string;name:string;role:string;status:string;language:string;jurisdiction:string;interest:string;registered_at:string|null;created_at:string};
export type AuthContext={profile:Profile;sign_in:'chatgpt'|'email'};
export type Row=Record<string,any>;
export class AppError extends Error{constructor(public status:number,public code:string){super(code)}}
export function fail(status:number,code:string):never{throw new AppError(status,code)}
export const db=()=>env.DB;
export const one=async<T=Row>(sql:string,...params:any[])=>db().prepare(sql).bind(...params).first<T>();
export const all=async<T=Row>(sql:string,...params:any[])=>{const r=await db().prepare(sql).bind(...params).all<T>();return r.results};
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export const statement=(sql:string,...p:any[])=>db().prepare(sql).bind(...p);
const selectionStore:SelectionStore={first:one,all,batch:async items=>(await db().batch(items.map(s=>statement(s.sql,...s.params)))).map(r=>({changes:r.meta.changes||0}))};
const photoStorage={put:(key:string,bytes:Uint8Array,mime:string)=>env.FILES.put(key,bytes,{httpMetadata:{contentType:mime}}),delete:(key:string)=>env.FILES.delete(key)};
export function auditStatement(actor:Profile,action:string,target:string,reason:string){return statement('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)',id(),actor.id,action,target,reason,now())}
function documentInserts(caseId:string,ts:string){
 return documentSeedRows(caseId,ts).map(r=>statement('INSERT OR IGNORE INTO case_documents (case_id,kind,status,status_date,notes,updated_at,updated_by) VALUES (?,?,?,?,?,?,?)',r.case_id,r.kind,r.status,r.status_date,r.notes,r.updated_at,r.updated_by));
}
async function caseDocumentsPayload(caseId:string,includeInternal:boolean){
 let rows=await all<DocumentRow>('SELECT kind,status,status_date,notes,updated_at FROM case_documents WHERE case_id=?',caseId);
 if(rows.length<DOCUMENT_KINDS.length){
  await db().batch(documentInserts(caseId,now()));
  rows=await all<DocumentRow>('SELECT kind,status,status_date,notes,updated_at FROM case_documents WHERE case_id=?',caseId);
 }
 return sortDocuments(rows).map(r=>projectDocument(r,includeInternal));
}
function isOwnerEmail(email:string){return (env.ADMIN_EMAIL||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean).includes(email)}
function adminEmails(){return (env.ADMIN_EMAIL||'').split(',')}
async function notify(emails:string[],mail:{subject:string;text:string}){for(const to of emails){try{await sendMail(env,{to,...mail})}catch(error){console.error('[firstleaf-alert]',error instanceof Error?error.message:error)}}}
function cookieSecure(request:Request){return new URL(request.url).protocol==='https:'}
function pepper(){const s=env.SESSION_SECRET;if(!s)fail(503,'SERVICE_UNAVAILABLE');return s}
async function ensureOwner(profile:Profile,email:string){
 if(!isOwnerEmail(email))return profile;
 if(profile.role==='admin'&&profile.status==='approved')return profile;
 await statement("UPDATE profiles SET role='admin',status='approved',email=? WHERE id=?",email,profile.id).run();
 return await one<Profile>('SELECT * FROM profiles WHERE id=?',profile.id)||profile;
}
export async function authenticate(request:Request):Promise<AuthContext>{
 await ensureSchema();
 const identity=await getChatGPTUser();
 if(identity){
  const email=normalizeEmail(identity.email)||identity.email.trim().toLowerCase();
  let profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',identity.userId);
  if(!profile)profile=await one<Profile>('SELECT * FROM profiles WHERE email=?',email);
  if(!profile){
   const role=isOwnerEmail(email)?'admin':'client';const status=isOwnerEmail(email)?'approved':'pending';
   await statement('INSERT INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)',identity.userId,email,identity.displayName,role,status,now()).run();
   profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',identity.userId);
  }else{
   profile=await ensureOwner(profile,email);
   if(profile.email!==email)await statement('UPDATE profiles SET email=? WHERE id=?',email,profile.id).run();
  }
  if(!profile)fail(503,'SERVICE_UNAVAILABLE');
  return {profile,sign_in:'chatgpt'};
 }
 let secret:string;try{secret=pepper()}catch{fail(401,'SIGN_IN_REQUIRED')}
 const parsed=parseSessionCookie(request.headers.get('cookie'));if(!parsed)fail(401,'SIGN_IN_REQUIRED');
 const row=await one<{id:string;user_id:string;token_hash:string;salt:string;expires_at:string}>('SELECT * FROM auth_sessions WHERE id=?',parsed.sessionId);
 if(!row||Date.parse(row.expires_at)<=Date.now()||!(await verifySecret(parsed.token,secret,row.salt,row.token_hash))){
  if(row)await statement('DELETE FROM auth_sessions WHERE id=?',row.id).run();
  fail(401,'SIGN_IN_REQUIRED');
 }
 const profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',row.user_id);if(!profile)fail(401,'SIGN_IN_REQUIRED');
 return {profile:await ensureOwner(profile,profile.email),sign_in:'email'};
}
export async function actor(request:Request){return(await authenticate(request)).profile}
export function active(a:Profile){if(a.status!=='approved')fail(403,a.status==='suspended'?'ACCOUNT_SUSPENDED':'APPROVAL_REQUIRED')}
export function admin(a:Profile){active(a);if(a.role!=='admin')fail(403,'FORBIDDEN')}
export async function member(a:Profile,caseId:string){active(a);const m=await one('SELECT role FROM case_members WHERE case_id=? AND user_id=?',caseId,a.id);if(!m)fail(404,'NOT_FOUND');return m.role as string}
export async function manager(a:Profile,caseId:string){const m=await member(a,caseId);if(!canManageCase(a,m))fail(403,'FORBIDDEN');return m}
export function text(value:unknown,max=250,required=true){if(typeof value!=='string')fail(400,'INVALID_INPUT');const s=value.trim();if((required&&!s)||s.length>max||s.includes('\u0000'))fail(400,'INVALID_INPUT');return s}
export function choice(value:unknown,choices:string[]){const s=text(value);if(!choices.includes(s))fail(400,'INVALID_INPUT');return s}
export function date(value:unknown){const s=text(value,10);if(!validDate(s))fail(400,'INVALID_DATE');return s}
export function number(value:unknown,min:number,max:number){const n=Number(value);if(!Number.isInteger(n)||n<min||n>max)fail(400,'INVALID_INPUT');return n}
export function mutateRequest(request:Request){const expected=env.SITE_ORIGIN||new URL(request.url).origin;if(!validMutation(request.headers.get('origin'),expected,request.headers.get('x-firstleaf'),request.headers.get('sec-fetch-site')))fail(403,'INVALID_ORIGIN')}
export async function json(request:Request){const len=Number(request.headers.get('content-length')||0);if(len>32768)fail(413,'TOO_LARGE');const raw=await request.text();if(raw.length>32768)fail(413,'TOO_LARGE');try{const v=JSON.parse(raw);if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'INVALID_INPUT');return v as Row}catch{fail(400,'INVALID_INPUT')}}
export const response=(data:unknown,status=200,extra?:HeadersInit)=>{const headers=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});if(extra)new Headers(extra).forEach((v,k)=>headers.append(k,v));return Response.json(data,{status,headers})};
export const stages=['assessment','treatment','transfer','pregnancy','birth','paperwork','paused','loss','closed'];

async function sendOtpEmail(to:string,code:string){
 try{
  await sendMail(env,{to,subject:'Nesta login code',text:`Your Nesta login code is ${code}. It expires in 10 minutes. Private pilot — test data only.`});
 }catch(e){
  if(e instanceof MailError)fail(e.status,e.code);
  throw e;
 }
}

export async function handleAuth(path:string[],request:Request){
 if(request.method==='GET'&&path.length===1&&path[0]==='options')return response({email_enabled:emailSignInAvailable(env)});
 await ensureSchema();
 if(request.method!=='POST')fail(404,'NOT_FOUND');
 mutateRequest(request);
 const secure=cookieSecure(request);
 if(path[0]==='logout'){
  const parsed=parseSessionCookie(request.headers.get('cookie'));
  if(parsed)await statement('DELETE FROM auth_sessions WHERE id=?',parsed.sessionId).run();
  return response({ok:true},200,{'Set-Cookie':clearSessionCookie(secure)});
 }
 if(path[0]==='email'&&path[1]==='request'){
  if(!emailSignInAvailable(env))fail(503,'SERVICE_UNAVAILABLE');
  const body=await json(request);const email=normalizeEmail(String(body.email||''));if(!email)fail(400,'INVALID_EMAIL');
  const existing=await one<{created_at:string}>('SELECT created_at FROM email_otps WHERE email=?',email);
  if(existing&&Date.now()-Date.parse(existing.created_at)<OTP_RESEND_MS)fail(429,'TOO_MANY_REQUESTS');
  const secret=pepper();const code=generateOtpCode();const {salt,hash}=await hashSecret(code,secret);
  const ip=(request.headers.get('cf-connecting-ip')||request.headers.get('x-forwarded-for')||'').slice(0,80);
  await statement('INSERT INTO email_otps (email,code_hash,salt,expires_at,attempts,created_at,request_ip) VALUES (?,?,?,?,0,?,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,salt=excluded.salt,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at,request_ip=excluded.request_ip',email,hash,salt,new Date(Date.now()+OTP_TTL_MS).toISOString(),now(),ip).run();
  await sendOtpEmail(email,code);
  await statement('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)',id(),'system','auth.email.request',email,'OTP issued',now()).run();
  return response({ok:true});
 }
 if(path[0]==='email'&&path[1]==='verify'){
  const body=await json(request);const email=normalizeEmail(String(body.email||''));if(!email)fail(400,'INVALID_EMAIL');
  const code=text(body.code,6);if(!/^\d{6}$/.test(code))fail(400,'OTP_INVALID');
  const row=await one<{code_hash:string;salt:string;expires_at:string;attempts:number}>('SELECT * FROM email_otps WHERE email=?',email);
  if(!row)fail(400,'OTP_INVALID');
  if(Date.parse(row.expires_at)<=Date.now()||row.attempts>=OTP_MAX_ATTEMPTS){await statement('DELETE FROM email_otps WHERE email=?',email).run();fail(400,'OTP_EXPIRED')}
  const secret=pepper();
  if(!(await verifySecret(code,secret,row.salt,row.code_hash))){
   await statement('UPDATE email_otps SET attempts=attempts+1 WHERE email=?',email).run();
   fail(400,'OTP_INVALID');
  }
  await statement('DELETE FROM email_otps WHERE email=?',email).run();
  let profile=await one<Profile>('SELECT * FROM profiles WHERE email=?',email);
  if(!profile){
   const profileId=await emailProfileId(email);const role=isOwnerEmail(email)?'admin':'client';const status=isOwnerEmail(email)?'approved':'pending';
   const local=email.split('@')[0].slice(0,80)||'client';
   await statement('INSERT INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)',profileId,email,local,role,status,now()).run();
   profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',profileId);
  }else profile=await ensureOwner(profile,email);
  if(!profile)fail(503,'SERVICE_UNAVAILABLE');
  const sessionId=id();const token=hexToken();const hashed=await hashSecret(token,secret);
  await statement('INSERT INTO auth_sessions (id,user_id,token_hash,salt,expires_at,created_at) VALUES (?,?,?,?,?,?)',sessionId,profile.id,hashed.hash,hashed.salt,new Date(Date.now()+SESSION_TTL_MS).toISOString(),now()).run();
  await statement('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)',id(),profile.id,'auth.email.verify',profile.id,'Email OTP verified',now()).run();
  return response({ok:true},200,{'Set-Cookie':sessionCookieValue(sessionId,token,secure)});
 }
 fail(404,'NOT_FOUND');
}

function hexToken(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function plansWithReceipts(rows:Row[]){
 if(!rows.length)return rows;
 const ids=rows.map(row=>String(row.case_id));
 const payments=await all(`SELECT id,case_id,amount,currency,paid_on,voucher,note FROM case_payments WHERE case_id IN (${ids.map(()=>'?').join(',')}) ORDER BY paid_on,created_at`,...ids);
 const grouped=new Map<string,Row[]>();
 for(const payment of payments){const key=String(payment.case_id);grouped.set(key,[...(grouped.get(key)||[]),payment])}
 return rows.map(row=>({...row,receipts:grouped.get(String(row.case_id))||[]}));
}

function asFaq(row:Row):FaqEntry{
 return {id:String(row.id),question_zh:String(row.question_zh),question_en:String(row.question_en),answer_zh:String(row.answer_zh),answer_en:String(row.answer_en),position:Number(row.position),hidden:Number(row.hidden)===1};
}
function faqFields(b:Row){
 return {question_zh:text(b.question_zh,180),question_en:text(b.question_en,180),answer_zh:text(b.answer_zh,2000),answer_en:text(b.answer_en,2000),hidden:choice(String(b.hidden??'0'),['0','1'])==='1'?1:0};
}
export async function listPublicFaq(){
 await ensureSchema();
 const rows=(await all('SELECT id,question_zh,question_en,answer_zh,answer_en,position,hidden FROM faq_entries ORDER BY position,id')).map(asFaq);
 return visibleFaq(rows).map(({id,question_zh,question_en,answer_zh,answer_en})=>({id,question_zh,question_en,answer_zh,answer_en}));
}
export async function readPublicFaq(){
 return response({faq:await listPublicFaq()});
}

export async function read(path:string[],auth:AuthContext,request:Request){
 const a=auth.profile;
 if(path[0]==='me')return response({profile:a,sign_in:auth.sign_in});
 active(a);
 if(path[0]==='donors'&&path.length===3&&path[2]==='photos')return response({photos:await listDonorPhotos(selectionStore,a,path[1])});
 if(path[0]==='donor-photos'&&path.length===2){
  const photo=await readDonorPhoto(selectionStore,a,path[1]);
  const object=await env.FILES.get(photo.object_key);if(!object)fail(404,'NOT_FOUND');
  return new Response(object.body,{headers:{'Content-Type':photo.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }
 if(path[0]==='egg-requests'&&path.length===1)return response({requests:await listEggRequests(selectionStore,a)});
 if(path.length===1&&path[0]==='admin-operations'){admin(a);return response(await readAdminOperations(a,{one,all}))}
 if(path[0]==='overview'){
  const casesRaw=await all('SELECT c.*,m.role AS membership_role FROM cases c JOIN case_members m ON m.case_id=c.id WHERE m.user_id=? ORDER BY c.updated_at DESC LIMIT 200',a.id);
  // Portal overview: never expose partner FK ids.
  const cases=casesRaw.map(c=>{const{ivf_partner_id,postpartum_partner_id,...safe}=c;return safe});
  const grants=await all('SELECT scope,expires_at,revoked_at FROM directory_grants WHERE user_id=?',a.id);
  return response({cases,grants,...(a.role==='client'?await readClientHighlights(a,{all,one}):{})});
 }
 if(path[0]==='people'){admin(a);return response({people:await all("SELECT p.*,(SELECT COUNT(*) FROM case_members m WHERE m.user_id=p.id) AS membership_count,(SELECT COUNT(*) FROM directory_grants g WHERE g.user_id=p.id AND g.revoked_at IS NULL) AS active_grant_count FROM profiles p ORDER BY p.created_at DESC LIMIT 300")})}
 if(path[0]==='audit'){admin(a);const sp=new URL(request.url).searchParams;return response({audit:await readAudit({all},{action:sp.get('action')||'',actor:sp.get('actor')||'',target:sp.get('target')||'',from:sp.get('from')||'',to:sp.get('to')||''})})}
 if(path[0]==='grants'){admin(a);return response({grants:await all('SELECT g.*,p.name,p.email FROM directory_grants g JOIN profiles p ON p.id=g.user_id ORDER BY p.name')})}
 if(path[0]==='site-faq'&&path.length===1){admin(a);const rows=(await all('SELECT id,question_zh,question_en,answer_zh,answer_en,position,hidden,updated_at FROM faq_entries ORDER BY position,id')).map(row=>({...asFaq(row),updated_at:row.updated_at}));return response({faq:rows})}
 if(path[0]==='partners'&&path.length===1){
  admin(a);
  const sp=new URL(request.url).searchParams,clauses:string[]=[],params:any[]=[];
  const kindRaw=sp.get('kind');if(kindRaw){let kind:string;try{kind=assertPartnerKind(kindRaw)}catch{fail(400,'PARTNER_KIND_INVALID')}clauses.push('kind=?');params.push(kind)}
  const statusRaw=sp.get('status')||'all';if(statusRaw!=='all'){clauses.push('status=?');params.push(choice(statusRaw,['active','inactive']))}
  const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
  return response({partners:await all(`SELECT * FROM partners ${where} ORDER BY name LIMIT 300`,...params)});
 }
 if(path[0]==='directory'){
  const kind=choice(new URL(request.url).searchParams.get('kind')||'egg',['egg','sperm']);
  if(a.role!=='admin'){const grant=await one('SELECT * FROM directory_grants WHERE user_id=? AND scope=?',a.id,kind);if(!canUseDirectory(a,grant as any,kind))fail(403,'DIRECTORY_LOCKED')}
  const donors=await all(directoryQuery(a.role==='admin'),a.id,kind);
  return response({donors});
 }
 if(path[0]==='cases'&&path.length===1){admin(a);return response({cases:await all('SELECT c.*,m.role AS membership_role FROM cases c LEFT JOIN case_members m ON m.case_id=c.id AND m.user_id=? ORDER BY updated_at DESC LIMIT 200',a.id)})}
 if(path[0]==='cases'&&path.length===2){
  const caseId=path[1];active(a);const membership=await one('SELECT role FROM case_members WHERE case_id=? AND user_id=?',caseId,a.id);const role=(membership?.role as string|undefined)??null;if(!role&&a.role!=='admin')fail(404,'NOT_FOUND');const c=await one('SELECT * FROM cases WHERE id=?',caseId);if(!c)fail(404,'NOT_FOUND');
  const reportRows=await all('SELECT r.*,EXISTS(SELECT 1 FROM report_recipients rr WHERE rr.report_id=r.id AND rr.user_id=?) AS is_recipient FROM reports r WHERE r.case_id=? ORDER BY r.report_date DESC,r.created_at DESC',a.id,caseId);
  const reports=reportRows.filter(r=>canReadReport(a,role,r as any,!!r.is_recipient)).map(r=>{const {object_key,translation_key,sha256,...safe}=r;return {...safe,has_translation:!!translation_key,can_review:canReviewReport(a,role,r as any),can_publish:canPublishReport(a,role,r as any)}});
  const members=await all(`SELECT p.id,p.name,m.role,p.status ${role==='client'?'':',p.email'} FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? ${role==='client'?"AND (m.user_id=? OR m.role='coordinator')":''}`,caseId,...(role==='client'?[a.id]:[]));
  const questions=await all(`SELECT q.*,p.name AS author_name FROM questions q JOIN profiles p ON p.id=q.author_id WHERE q.case_id=? ${role==='client'?'AND q.author_id=?':''} ORDER BY q.created_at DESC LIMIT 100`,caseId,...(role==='client'?[a.id]:[]));
  const events=await all('SELECT e.*,p.name AS author_name FROM events e JOIN profiles p ON p.id=e.created_by WHERE e.case_id=? ORDER BY e.event_date DESC,e.created_at DESC LIMIT 200',caseId);
  const manage=canManageCase(a,role);
  const casePayload=a.role==='admin'?c:(()=>{const{ivf_partner_id,postpartum_partner_id,...safe}=c;return safe})();
  const payload:Row={case:casePayload,membership:role,can_manage:manage,members,reports,reports_withheld:a.role==='admin'&&!role&&reportRows.length>0,events,questions,documents:await caseDocumentsPayload(caseId,manage)};
  if(a.role==='admin'){
   const partnerSummary=async(pid:unknown)=>{if(!pid)return null;const p=await one('SELECT id,name,status FROM partners WHERE id=?',pid);return p?{id:p.id,name:p.name,status:p.status}:null};
   payload.partners={ivf:await partnerSummary(c.ivf_partner_id),postpartum:await partnerSummary(c.postpartum_partner_id)};
  }
  return response(payload);
 }
 if(path[0]==='plans'){
  // Client: plans for cases they belong to. Staff: only via case detail.
  if(a.role!=='client')fail(403,'FORBIDDEN');
  const rows=await all(`SELECT p.*,c.code AS case_code,c.title AS case_title FROM case_plans p JOIN cases c ON c.id=p.case_id JOIN case_members m ON m.case_id=p.case_id WHERE m.user_id=? ORDER BY p.updated_at DESC LIMIT 50`,a.id);
  return response({plans:(await plansWithReceipts(rows)).map(publicPlan)});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='plan'){
  active(a);const membership=await one('SELECT role FROM case_members WHERE case_id=? AND user_id=?',path[1],a.id);if(!membership&&a.role!=='admin')fail(404,'NOT_FOUND');
  const row=await one(`SELECT p.*,c.code AS case_code,c.title AS case_title FROM case_plans p JOIN cases c ON c.id=p.case_id WHERE p.case_id=?`,path[1]);
  const [plan]=row?await plansWithReceipts([row]):[null];
  return response({plan:publicPlan(plan)});
 }
 if(path[0]==='files'&&path.length===3){
  const r=await one('SELECT * FROM reports WHERE id=?',path[1]);if(!r)fail(404,'NOT_FOUND');const role=await member(a,r.case_id);const recipient=await one('SELECT 1 FROM report_recipients WHERE report_id=? AND user_id=?',r.id,a.id);if(!canReadReport(a,role,r as any,!!recipient))fail(404,'NOT_FOUND');
  const variant=choice(path[2],['original','translation']);const key=variant==='original'?r.object_key:r.translation_key;if(!key)fail(404,'NOT_FOUND');const object=await env.FILES.get(key);if(!object)fail(404,'NOT_FOUND');await auditStatement(a,'file.download',r.id,variant).run();const name=variant==='original'?r.file_name:r.translation_name;
  const mime=String(variant==='original'?r.mime:r.translation_mime);const inline=new URL(request.url).searchParams.get('view')==='1'&&['application/pdf','image/jpeg','image/png'].includes(mime);
  const headers:Record<string,string>={'Content-Type':mime,'Content-Disposition':`${inline?'inline':'attachment'}; filename="document"; filename*=UTF-8''${encodeURIComponent(name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'};
  if(!inline)headers['Content-Security-Policy']="default-src 'none'; sandbox";
  return new Response(object.body,{headers});
 }
 fail(404,'NOT_FOUND');
}

export async function write(path:string[],a:Profile,request:Request){
 mutateRequest(request);
 if(path[0]==='donors'&&path.length===3&&path[2]==='photos'){
  admin(a);const limit=21*1024*1024;
  if(Number(request.headers.get('content-length'))>limit)fail(413,'PHOTO_BATCH_TOO_LARGE');
  const reader=request.body?.getReader();if(!reader)fail(400,'PHOTO_REQUIRED');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();fail(413,'PHOTO_BATCH_TOO_LARGE')}chunks.push(value)}}finally{reader.releaseLock()}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}chunks.length=0;
  let form:FormData;try{form=await new Response(bytes,{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData()}catch{fail(400,'INVALID_INPUT')}
  const files=form.getAll('photos');if(!files.length)fail(400,'PHOTO_REQUIRED');if(files.length>10)fail(409,'PHOTO_LIMIT');
  const photos=[];let total=0;
  for(const file of files){if(typeof file==='string'||file.size>5*1024*1024)fail(400,'INVALID_PHOTO');total+=file.size;if(total>20*1024*1024)fail(413,'PHOTO_BATCH_TOO_LARGE');photos.push({mime:file.type,bytes:new Uint8Array(await file.arrayBuffer())})}
  return response(await uploadDonorPhotos(selectionStore,photoStorage,a,path[1],photos));
 }
 if(path[0]==='donor-photos'&&path.length===3&&path[2]==='delete')return response(await deleteDonorPhoto(selectionStore,photoStorage,a,path[1]));
 if(path[0]==='egg-requests'){
  active(a);const body=await json(request);
  if(path.length===1)return response(await submitEggRequest(selectionStore,a,text(body.donor_id),text(body.note||'',1000,false)));
  if(path.length===3&&path[2]==='withdraw')return response(await withdrawEggRequest(selectionStore,a,path[1]));
  if(path.length===3&&path[2]==='decision')return response(await decideEggRequest(selectionStore,a,path[1],choice(body.status,['approved','rejected']) as 'approved'|'rejected',text(body.reply,1000)));
  fail(404,'NOT_FOUND');
 }
 if(path[0]==='profile'){
  if(a.status==='suspended')fail(403,'ACCOUNT_SUSPENDED');const body=await json(request);if(body.accepted!==true)fail(400,'CONSENT_REQUIRED');const name=text(body.name,80),language=choice(body.language,['zh','en']),jurisdiction=text(body.jurisdiction,100),interest=text(body.interest,1000);
  const firstSubmit=a.role==='client'&&!a.registered_at;
  await db().batch([statement('UPDATE profiles SET name=?,language=?,jurisdiction=?,interest=?,registered_at=COALESCE(registered_at,?) WHERE id=?',name,language,jurisdiction,interest,now(),a.id),auditStatement(a,'profile.register',a.id,'Private pilot notice v1 acknowledged')]);
  if(firstSubmit)await notify(alertRecipients([],adminEmails()),profileSubmittedAlert(name));
  return response({ok:true});
 }
 active(a);
 if(path[0]==='people'&&path.length===2){
  admin(a);const b=await json(request),target=await one<Profile>('SELECT * FROM profiles WHERE id=?',path[1]);if(!target)fail(404,'NOT_FOUND');if(target.role==='admin'||target.id===a.id)fail(403,'OWNER_PROTECTED');const status=choice(b.status,['pending','approved','suspended']),role=choice(b.role,['client','coordinator','reviewer']),reason=text(b.reason,500);
  // Role changes drop previous case permissions; a fresh assignment is required.
  const effects=accountChangeEffects(target,{role,status});const stmts=[statement('UPDATE profiles SET status=?,role=? WHERE id=?',status,role,target.id)];if(effects.dropMemberships)stmts.push(statement('DELETE FROM case_members WHERE user_id=?',target.id));if(effects.revokeGrants)stmts.push(statement('UPDATE directory_grants SET revoked_at=? WHERE user_id=?',now(),target.id));stmts.push(auditStatement(a,'profile.update',target.id,`${role}/${status}: ${reason}`));await db().batch(stmts);return response({ok:true});
 }
 if(path[0]==='grants'){
  admin(a);const b=await json(request),userId=text(b.user_id),scope=choice(b.scope,['egg','sperm']),reason=text(b.reason,500);const person=await one<Profile>('SELECT * FROM profiles WHERE id=?',userId);if(!person)fail(404,'NOT_FOUND');if(b.revoke===true){await db().batch([statement('UPDATE directory_grants SET revoked_at=? WHERE user_id=? AND scope=?',now(),userId,scope),auditStatement(a,'directory.revoke',userId,`${scope}: ${reason}`)]);return response({ok:true})}if(person.status!=='approved')fail(400,'APPROVAL_REQUIRED');const expires=date(b.expires_at)+'T23:59:59.999Z';if(Date.parse(expires)<=Date.now()||Date.parse(expires)>Date.now()+366*86400000)fail(400,'INVALID_DATE');
  await db().batch([statement('INSERT INTO directory_grants (user_id,scope,expires_at,revoked_at,reason,granted_by) VALUES (?,?,?,NULL,?,?) ON CONFLICT(user_id,scope) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL,reason=excluded.reason,granted_by=excluded.granted_by',userId,scope,expires,reason,a.id),auditStatement(a,'directory.grant',userId,`${scope} / ${expires}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='site-faq'&&path.length===2&&path[1]==='sync-default'){
  admin(a);await ensureSchema();const ts=now();const existing=await all<{id:string;position:number}>('SELECT id,position FROM faq_entries');const {statements,summary}=buildDefaultFaqSyncStatements({ts,actorId:a.id,existing:existing.map(row=>({id:String(row.id),position:Number(row.position)}))});
  await db().batch([...statements.map(row=>statement(row.sql,...row.params)),auditStatement(a,'faq.sync_default','site-faq',`updated=${summary.updated},inserted=${summary.inserted}`)]);
  return response({ok:true,...summary});
 }
 if(path[0]==='site-faq'&&path.length===1){
  admin(a);const b=await json(request);const fields=faqFields(b);const max=await one<{position:number}>('SELECT COALESCE(MAX(position),0) AS position FROM faq_entries');const faqId=id(),ts=now(),position=Number(max?.position||0)+1;
  await db().batch([statement('INSERT INTO faq_entries (id,question_zh,question_en,answer_zh,answer_en,position,hidden,updated_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?)',faqId,fields.question_zh,fields.question_en,fields.answer_zh,fields.answer_en,position,fields.hidden,ts,a.id),auditStatement(a,'faq.create',faqId,fields.question_zh)]);
  return response({ok:true});
 }
 if(path[0]==='site-faq'&&path.length===3&&path[2]==='move'){
  admin(a);const b=await json(request);const direction=choice(b.direction,['up','down']);const current=await all<{id:string;position:number}>('SELECT id,position FROM faq_entries');const next=moveFaq(current.map(row=>({id:String(row.id),position:Number(row.position)})),path[1],direction==='up'?'up':'down');if(!next)return response({ok:true});const ts=now();
  await db().batch([statement('UPDATE faq_entries SET position=?,updated_at=?,updated_by=? WHERE id=?',next[0].position,ts,a.id,next[0].id),statement('UPDATE faq_entries SET position=?,updated_at=?,updated_by=? WHERE id=?',next[1].position,ts,a.id,next[1].id),auditStatement(a,'faq.move',path[1],direction)]);
  return response({ok:true});
 }
 if(path[0]==='site-faq'&&path.length===2){
  admin(a);const b=await json(request);const existing=await one('SELECT id FROM faq_entries WHERE id=?',path[1]);if(!existing)fail(404,'NOT_FOUND');const fields=faqFields(b);const ts=now();
  await db().batch([statement('UPDATE faq_entries SET question_zh=?,question_en=?,answer_zh=?,answer_en=?,hidden=?,updated_at=?,updated_by=? WHERE id=?',fields.question_zh,fields.question_en,fields.answer_zh,fields.answer_en,fields.hidden,ts,a.id,path[1]),auditStatement(a,'faq.update',path[1],fields.question_zh)]);
  return response({ok:true});
 }
 if(path[0]==='partners'&&path.length===1){
  admin(a);const b=await json(request);let kind:string;try{kind=assertPartnerKind(text(b.kind))}catch{fail(400,'PARTNER_KIND_INVALID')}
  const partnerId=id(),name=text(b.name,150),contact=text(b.contact_name||'',80,false),phone=text(b.phone||'',40,false),email=text(b.email||'',120,false),notes=text(b.notes||'',1500,false),ts=now();
  await db().batch([statement('INSERT INTO partners (id,kind,name,contact_name,phone,email,notes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',partnerId,kind,name,contact,phone,email,notes,'active',ts,ts),auditStatement(a,'partner.create',partnerId,name)]);return response({id:partnerId});
 }
 if(path[0]==='partners'&&path.length===2){
  admin(a);const b=await json(request);const partner=await one('SELECT * FROM partners WHERE id=?',path[1]);if(!partner)fail(404,'NOT_FOUND');
  const name=b.name!==undefined?text(b.name,150):partner.name;
  const contact=b.contact_name!==undefined?text(b.contact_name||'',80,false):partner.contact_name;
  const phone=b.phone!==undefined?text(b.phone||'',40,false):partner.phone;
  const email=b.email!==undefined?text(b.email||'',120,false):partner.email;
  const notes=b.notes!==undefined?text(b.notes||'',1500,false):partner.notes;
  const status=b.status!==undefined?choice(b.status,['active','inactive']):partner.status;
  const reason=text(b.reason,500),ts=now();
  await db().batch([statement('UPDATE partners SET name=?,contact_name=?,phone=?,email=?,notes=?,status=?,updated_at=? WHERE id=?',name,contact,phone,email,notes,status,ts,path[1]),auditStatement(a,'partner.update',path[1],reason)]);return response({ok:true});
 }
 if(path[0]==='donors'&&path.length===1){
  admin(a);const b=await json(request),donorId=id(),code=text(b.code,40),kind=choice(b.kind,['egg','sperm']),age=number(b.age,18,65),height=b.height?number(b.height,100,230):null,group=text(b.blood_group||'',20,false),source=text(b.source,150),zh=text(b.summary_zh,1500),en=text(b.summary_en,1500),verified=date(b.verified_at),consent=text(b.consent_ref,250);const exists=await one('SELECT id FROM donors WHERE code=?',code);if(exists)fail(409,'DUPLICATE_CODE');
  await db().batch([statement('INSERT INTO donors (id,code,kind,age,height,blood_group,source,summary_zh,summary_en,verified_at,consent_ref,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',donorId,code,kind,age,height,group,source,zh,en,verified,consent,now()),auditStatement(a,'donor.create',donorId,consent)]);return response({id:donorId});
 }
 if(path[0]==='donors'&&path.length===2){
  admin(a);const b=await json(request);const donor=await one('SELECT * FROM donors WHERE id=?',path[1]);if(!donor)fail(404,'NOT_FOUND');
  if(b.status!==undefined&&b.summary_zh===undefined&&b.summary_en===undefined&&b.source===undefined){
   const status=choice(b.status,['available','matching','unavailable','archived']);
   const reason=text(b.reason,500);
   const statusReason=(status==='unavailable'||status==='archived')?reason:null;
   await db().batch([statement('UPDATE donors SET status=?,status_reason=? WHERE id=?',status,statusReason,path[1]),auditStatement(a,'donor.status',path[1],reason)]);return response({ok:true});
  }
  const age=number(b.age,18,65),height=b.height===''||b.height==null?null:number(b.height,100,230),group=text(b.blood_group||'',20,false),source=text(b.source,150),zh=text(b.summary_zh,1500),en=text(b.summary_en,1500),verified=date(b.verified_at),consent=text(b.consent_ref,250),reason=text(b.reason||'Donor record updated',500,false)||'Donor record updated';
  await db().batch([statement('UPDATE donors SET age=?,height=?,blood_group=?,source=?,summary_zh=?,summary_en=?,verified_at=?,consent_ref=? WHERE id=?',age,height,group,source,zh,en,verified,consent,path[1]),auditStatement(a,'donor.update',path[1],reason)]);return response({ok:true});
 }
 if(path[0]==='favorites'){
  const b=await json(request),d=await one('SELECT * FROM donors WHERE id=?',text(b.donor_id));if(!d||d.status==='archived')fail(404,'NOT_FOUND');if(a.role!=='admin'){const grant=await one('SELECT * FROM directory_grants WHERE user_id=? AND scope=?',a.id,d.kind);if(!canUseDirectory(a,grant as any,d.kind))fail(403,'DIRECTORY_LOCKED')}
  if(b.favorite===true)await statement('INSERT OR IGNORE INTO favorites (user_id,donor_id) VALUES (?,?)',a.id,d.id).run();else await statement('DELETE FROM favorites WHERE user_id=? AND donor_id=?',a.id,d.id).run();return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===1){
  admin(a);const b=await json(request),caseId=id(),title=text(b.title,120),customerId=text(b.customer_id),reason=text(b.reason,500);const customer=await one<Profile>('SELECT * FROM profiles WHERE id=?',customerId);if(!customer||customer.role!=='client'||customer.status!=='approved')fail(400,'APPROVAL_REQUIRED');const code=`FL-${new Date().getUTCFullYear()}-${caseId.slice(0,8).toUpperCase()}`,created=now();
  await db().batch([statement('INSERT INTO cases (id,code,title,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?)',caseId,code,title,a.id,created,created),statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?)',caseId,customerId,'client',created),statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?)',caseId,a.id,'coordinator',created),...documentInserts(caseId,created),auditStatement(a,'case.create',caseId,reason)]);return response({id:caseId});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='members'){
  admin(a);const b=await json(request),caseId=path[1],userId=text(b.user_id),reason=text(b.reason,500);if(!await one('SELECT id FROM cases WHERE id=?',caseId))fail(404,'NOT_FOUND');if(b.remove===true){await db().batch([statement('DELETE FROM case_members WHERE case_id=? AND user_id=?',caseId,userId),statement('DELETE FROM report_recipients WHERE user_id=? AND report_id IN (SELECT id FROM reports WHERE case_id=?)',userId,caseId),auditStatement(a,'member.remove',caseId,`${userId}: ${reason}`)]);return response({ok:true})}const target=await one<Profile>('SELECT * FROM profiles WHERE id=?',userId);if(!target||target.status!=='approved')fail(400,'APPROVAL_REQUIRED');const role=target.role==='admin'?'coordinator':choice(target.role,['client','coordinator','reviewer']);await db().batch([statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?) ON CONFLICT(case_id,user_id) DO UPDATE SET role=excluded.role',caseId,userId,role,now()),auditStatement(a,'member.assign',caseId,`${userId}/${role}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='partners'){
  admin(a);const b=await json(request),caseId=path[1];
  const current=await one<{ivf_partner_id:string|null;postpartum_partner_id:string|null}>('SELECT ivf_partner_id,postpartum_partner_id FROM cases WHERE id=?',caseId);
  if(!current)fail(404,'NOT_FOUND');
  const reason=text(b.reason,500),sets:string[]=[],params:any[]=[];
  let finalIvf=current.ivf_partner_id,finalPostpartum=current.postpartum_partner_id;
  for(const slot of ['ivf','postpartum'] as const){
   const key=`${slot}_partner_id`;if(!(key in b))continue;
   const pid=normalizePartnerId(b[key]);
   const currentId=slot==='ivf'?current.ivf_partner_id:current.postpartum_partner_id;
   if(pid&&pid!==currentId){const partner=await one<{id:string;kind:string;status:string}>('SELECT id,kind,status FROM partners WHERE id=?',pid);if(!partner)fail(404,'NOT_FOUND');const check=canBindPartner(partner,slot);if(!check.ok)fail(400,check.code)}
   sets.push(`${key}=?`);params.push(pid);
   if(slot==='ivf')finalIvf=pid;else finalPostpartum=pid;
  }
  if(!sets.length)fail(400,'INVALID_INPUT');
  const ts=now();sets.push('updated_at=?');params.push(ts,caseId);
  const auditDetail=`ivf=${finalIvf??'null'}, postpartum=${finalPostpartum??'null'}: ${reason}`;
  await db().batch([statement(`UPDATE cases SET ${sets.join(',')} WHERE id=?`,...params),auditStatement(a,'case.partners',caseId,auditDetail)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='documents'){
  await manager(a,path[1]);
  const b=await json(request);
  let kind:string;try{kind=assertDocumentKind(text(b.kind))}catch{fail(400,'DOCUMENT_KIND_INVALID')}
  let status:string;try{status=assertDocumentStatus(text(b.status))}catch{fail(400,'DOCUMENT_STATUS_INVALID')}
  let statusDate:string|null;try{statusDate=normalizeStatusDate(b.status_date)}catch{fail(400,'INVALID_DATE')}
  const notes=text(b.notes||'',1500,false),reason=text(b.reason,500),ts=now();
  const existing=await one('SELECT kind FROM case_documents WHERE case_id=? AND kind=?',path[1],kind);if(!existing)fail(404,'NOT_FOUND');
  await db().batch([statement('UPDATE case_documents SET status=?,status_date=?,notes=?,updated_at=?,updated_by=? WHERE case_id=? AND kind=?',status,statusDate,notes,ts,a.id,path[1],kind),auditStatement(a,'document.update',path[1],`${kind}/${status}/${statusDate??'null'}: ${reason}`)]);
  return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='plan'){
  await manager(a,path[1]);
  const b=await json(request);
  if(!isTier(b.tier))fail(400,'INVALID_TIER');
  const tier=b.tier;
  const total=b.total_usd==null?packageSpec(tier).total:number(b.total_usd,1000,2000000);
  const pgsIncluded=b.pgs_included==null?undefined:number(b.pgs_included,0,50);
  const pgsExtra=b.pgs_extra_usd==null?500:number(b.pgs_extra_usd,0,5000);
  for(const k of ['egg_status','sperm_status','twin_status','csection_status','nicu_status']){if(b[k]!=null&&!isAddon(b[k]))fail(400,'INVALID_ADDON')}
  const egg=isAddon(b.egg_status)?b.egg_status:'none';
  const sperm=isAddon(b.sperm_status)?b.sperm_status:'none';
  const twin=isAddon(b.twin_status)?b.twin_status:'none';
  const csection=isAddon(b.csection_status)?b.csection_status:'none';
  const nicu=isAddon(b.nicu_status)?b.nicu_status:'none';
  const note=text(b.note||'',500,false);
  const reason=text(b.reason,500);
  const existing=await one<{milestones_json:string}>('SELECT milestones_json FROM case_plans WHERE case_id=?',path[1]);
  let previous:Milestone[]=[];
  if(existing){try{previous=parseMilestones(existing.milestones_json)}catch{previous=[]}}
  let draft;try{draft=planDraft({tier,total,previous,pgsIncluded,pgsExtra})}catch(error){if(error instanceof Error&&error.message==='PAID_EXCEEDS_TOTAL')fail(400,'PAID_EXCEEDS_TOTAL');throw error}
  const jsonMs=JSON.stringify(draft.milestones);
  const ts=now();
  await db().batch([
   statement(`INSERT INTO case_plans (case_id,tier,total_usd,pgs_included,pgs_extra_usd,egg_status,sperm_status,twin_status,csection_status,nicu_status,milestones_json,note,updated_at,updated_by,currency,package_version,pgs_scope) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(case_id) DO UPDATE SET tier=excluded.tier,total_usd=excluded.total_usd,pgs_included=excluded.pgs_included,pgs_extra_usd=excluded.pgs_extra_usd,egg_status=excluded.egg_status,sperm_status=excluded.sperm_status,twin_status=excluded.twin_status,csection_status=excluded.csection_status,nicu_status=excluded.nicu_status,milestones_json=excluded.milestones_json,note=excluded.note,updated_at=excluded.updated_at,updated_by=excluded.updated_by,currency=excluded.currency,package_version=excluded.package_version,pgs_scope=excluded.pgs_scope`,
    path[1],tier,total,draft.pgs_included,draft.pgs_extra,egg,sperm,twin,csection,nicu,jsonMs,note,ts,a.id,draft.currency,draft.package_version,draft.pgs_scope),
   statement('UPDATE cases SET updated_at=? WHERE id=?',ts,path[1]),
   auditStatement(a,'case.plan',path[1],`${tier}/${draft.currency} ${total}: ${reason}`)
  ]);
  return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='payments'){
  await manager(a,path[1]);
  const b=await json(request);
  const amount=number(b.amount,1,2000000);
  const currency=choice(b.currency,['CNY','USD']);
  const paidOn=date(b.paid_on);
  const voucher=text(b.voucher,120);
  const paymentNote=text(b.note||'',300,false);
  const reason=text(b.reason,500);
  const ts=now();
  await db().batch([
   statement('INSERT INTO case_payments (id,case_id,amount,currency,paid_on,voucher,note,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?)',id(),path[1],amount,currency,paidOn,voucher,paymentNote,ts,a.id),
   auditStatement(a,'case.payment',path[1],`${currency} ${amount} ${paidOn}: ${reason}`)
  ]);
  return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='stage'){
  await manager(a,path[1]);const b=await json(request),stage=choice(b.stage,stages),cycle=number(b.cycle,1,99),reason=text(b.reason,500);await db().batch([statement('UPDATE cases SET stage=?,cycle=?,updated_at=? WHERE id=?',stage,cycle,now(),path[1]),auditStatement(a,'case.stage',path[1],`${stage}/cycle ${cycle}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='events'){
  await manager(a,path[1]);const b=await json(request),eventId=id(),title=text(b.title,150),note=text(b.note||'',1500,false),kind=choice(b.kind,['milestone','appointment']),day=date(b.event_date),cycle=number(b.cycle,1,99);await db().batch([statement('INSERT INTO events (id,case_id,cycle,kind,title,note,event_date,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',eventId,path[1],cycle,kind,title,note,day,a.id,now()),statement('UPDATE cases SET updated_at=? WHERE id=?',now(),path[1]),auditStatement(a,'event.create',eventId,kind)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='questions'){
  const role=await member(a,path[1]);if(!canPostQuestion(a,role))fail(403,'FORBIDDEN');const b=await json(request);const recent=await one('SELECT COUNT(*) AS count FROM questions WHERE author_id=? AND created_at>?',a.id,new Date(Date.now()-3600000).toISOString());if(Number(recent?.count)>=20)fail(429,'TOO_MANY_REQUESTS');await statement('INSERT INTO questions (id,case_id,author_id,body,created_at) VALUES (?,?,?,?,?)',id(),path[1],a.id,text(b.body,2000),now()).run();
  const caseRow=await one<{code:string}>('SELECT code FROM cases WHERE id=?',path[1]);const coordinators=await all<{email:string}>("SELECT p.email FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? AND m.role='coordinator' AND p.status='approved'",path[1]);
  await notify(alertRecipients(coordinators.map(row=>String(row.email)),adminEmails()),questionAlert(String(caseRow?.code||path[1])));
  return response({ok:true});
 }
 if(path[0]==='questions'&&path.length===2){const q=await one('SELECT * FROM questions WHERE id=?',path[1]);if(!q)fail(404,'NOT_FOUND');await manager(a,q.case_id);const b=await json(request);await db().batch([statement('UPDATE questions SET reply=?,replied_by=?,replied_at=? WHERE id=?',text(b.reply,2000),a.id,now(),q.id),auditStatement(a,'question.reply',q.id,'Reply saved in client portal')]);return response({ok:true})}
 if(path[0]==='cases'&&path.length===3&&path[2]==='reports')return uploadReport(path[1],a,request);
 if(path[0]==='reports'&&path.length===3){
  const r=await one('SELECT * FROM reports WHERE id=?',path[1]);if(!r)fail(404,'NOT_FOUND');const role=await member(a,r.case_id);const b=await json(request);const reason=text(b.reason,1000);
  if(path[2]==='review'){
   if(!canReviewReport(a,role,r as any))fail(403,'INDEPENDENT_REVIEW_REQUIRED');const decision=choice(b.decision,['reviewed','rejected']);const results=await db().batch([statement("UPDATE reports SET status=?,reviewed_by=?,review_note=? WHERE id=? AND status='draft' AND uploaded_by<>?",decision,a.id,reason,r.id,a.id),auditStatement(a,'report.review',r.id,`${decision}: ${reason}`)]);if(!results[0].meta.changes)fail(409,'STALE_RECORD');return response({ok:true});
  }
  if(path[2]==='publish'){
   if(!canPublishReport(a,role,r as any))fail(403,'REVIEW_REQUIRED');const reviewer=await one("SELECT p.id FROM profiles p JOIN case_members m ON m.user_id=p.id WHERE p.id=? AND p.role='reviewer' AND p.status='approved' AND m.case_id=? AND m.role='reviewer'",r.reviewed_by,r.case_id);if(!reviewer)fail(403,'INDEPENDENT_REVIEW_REQUIRED');const recipients=await one("SELECT COUNT(*) AS count FROM report_recipients rr JOIN case_members m ON m.user_id=rr.user_id AND m.case_id=? JOIN profiles p ON p.id=rr.user_id WHERE rr.report_id=? AND m.role='client' AND p.status='approved' AND p.role='client'",r.case_id,r.id);if(!recipients?.count)fail(400,'RECIPIENT_REQUIRED');const results=await db().batch([statement("UPDATE reports SET status='published',published_at=? WHERE id=? AND status='reviewed'",now(),r.id),statement('UPDATE cases SET updated_at=? WHERE id=?',now(),r.case_id),auditStatement(a,'report.publish',r.id,reason)]);if(!results[0].meta.changes)fail(409,'STALE_RECORD');return response({ok:true});
  }
  if(path[2]==='withdraw'){await manager(a,r.case_id);await db().batch([statement("UPDATE reports SET status='withdrawn' WHERE id=?",r.id),auditStatement(a,'report.withdraw',r.id,reason)]);return response({ok:true})}
 }
 fail(404,'NOT_FOUND');
}

async function uploadReport(caseId:string,a:Profile,request:Request){
 await manager(a,caseId);if(Number(request.headers.get('content-length')||0)>17*1024*1024)fail(413,'TOO_LARGE');const f=await request.formData();const original=f.get('original');if(!(original instanceof File))fail(400,'FILE_REQUIRED');const title=text(f.get('title'),150),kind=choice(f.get('kind'),['report','document']),source=text(f.get('source'),150),reportDate=date(f.get('report_date')),language=choice(f.get('language'),['ka','en','zh']),cycle=number(f.get('cycle'),1,99);let recipientIds:string[]=[];try{const value=JSON.parse(String(f.get('recipients')));if(!Array.isArray(value)||!value.length||value.length>10||value.some(x=>typeof x!=='string'))fail(400,'RECIPIENT_REQUIRED');recipientIds=[...new Set(value as string[])]}catch{fail(400,'RECIPIENT_REQUIRED')}
 const members=await all("SELECT m.user_id FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? AND m.role='client' AND p.role='client' AND p.status='approved'",caseId);if(recipientIds.some(x=>!members.some(m=>m.user_id===x)))fail(400,'RECIPIENT_REQUIRED');
 const bytes=new Uint8Array(await original.arrayBuffer());if(!validateUpload(original.name,original.type,bytes))fail(400,'INVALID_FILE');const translation=f.get('translation');let translationBytes:Uint8Array|null=null;if(translation instanceof File&&translation.size){translationBytes=new Uint8Array(await translation.arrayBuffer());if(!validateUpload(translation.name,translation.type,translationBytes))fail(400,'INVALID_FILE')}
 let version=1;const supersedes=String(f.get('supersedes_id')||'').trim()||null;if(supersedes){const old=await one('SELECT * FROM reports WHERE id=? AND case_id=?',supersedes,caseId);if(!old||old.cycle!==cycle)fail(400,'INVALID_INPUT');version=old.version+1}
 const reportId=id(),objectKey=`private/${caseId}/${reportId}/original`,translationKey=translationBytes?`private/${caseId}/${reportId}/translation`:null;const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
 await env.FILES.put(objectKey,bytes,{httpMetadata:{contentType:original.type}});try{if(translationKey&&translationBytes)await env.FILES.put(translationKey,translationBytes);const ts=translation instanceof File&&translationBytes?translation:null;const stmts=[statement('INSERT INTO reports (id,case_id,cycle,title,kind,source,report_date,language,object_key,file_name,mime,size,sha256,translation_key,translation_name,translation_mime,uploaded_by,version,supersedes_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',reportId,caseId,cycle,title,kind,source,reportDate,language,objectKey,original.name.slice(0,180),original.type,original.size,hash,translationKey,ts?.name.slice(0,180)||null,ts?.type||null,a.id,version,supersedes,now()),...recipientIds.map(userId=>statement('INSERT INTO report_recipients (report_id,user_id) VALUES (?,?)',reportId,userId)),auditStatement(a,'report.upload',reportId,`cycle ${cycle}, ${kind}, version ${version}`)];await db().batch(stmts)}catch(error){await env.FILES.delete(objectKey);if(translationKey)await env.FILES.delete(translationKey);throw error}return response({id:reportId});
}
