import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {ensureSchema} from './ensure-schema';
import {readAdminOperations} from './admin-operations';
import {directoryQuery} from './directory-query';
import {listDonorPhotos,readDonorPhoto,uploadDonorPhotos,deleteDonorPhoto} from './donor-photos';
import {emailSignInAvailable} from './auth-options';
import {readClientHighlights} from './client-highlights';
import {defaultMilestones,isAddon,isTier,publicPlan,TIER_PGS,TIER_TOTAL} from './case-plans';
import {submitEggRequest,decideEggRequest,withdrawEggRequest,listEggRequests,type SelectionStore} from './egg-requests';
import {canReadReport,canManageCase,canReviewReport,canPublishReport,canUseDirectory,validMutation,validDate,validateUpload} from './policy';
import {assertPartnerKind,canBindPartner,normalizePartnerId} from './partners';
import {DOCUMENT_KINDS,assertDocumentKind,assertDocumentStatus,normalizeStatusDate,projectDocument,sortDocuments,documentSeedRows,type DocumentRow} from './documents';
import {normalizeEmail,emailProfileId,generateOtpCode,hashSecret,verifySecret,parseSessionCookie,sessionCookieValue,clearSessionCookie,OTP_TTL_MS,SESSION_TTL_MS,OTP_MAX_ATTEMPTS,OTP_RESEND_MS} from './email-auth';
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
function isOwnerEmail(email:string){return !!env.ADMIN_EMAIL&&email===env.ADMIN_EMAIL.trim().toLowerCase()}
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
 if(env.RESEND_API_KEY&&env.EMAIL_FROM){
  const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject:'Firstleaf login code',text:`Your Firstleaf login code is ${code}. It expires in 10 minutes. Private pilot — test data only.`})});
  if(!res.ok){
   const detail=await res.text().catch(()=>'');
   console.error('[firstleaf-otp-resend]',res.status,detail.slice(0,300));
   if(res.status===401||res.status===403)fail(503,'EMAIL_AUTH_FAILED');
   fail(503,'EMAIL_SEND_FAILED');
  }
  return;
 }
 const origin=env.SITE_ORIGIN||'';
 if(origin&&!/localhost|127\.0\.0\.1/.test(origin))fail(503,'SERVICE_UNAVAILABLE');
 console.info('[firstleaf-otp]',to,code);
}
