import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {canReadReport,canManageCase,canReviewReport,canPublishReport,canUseDirectory,validMutation,validDate,validateUpload} from './policy';
export type Profile={id:string;email:string;name:string;role:string;status:string;language:string;jurisdiction:string;interest:string;registered_at:string|null;created_at:string};
export type Row=Record<string,any>;
export class AppError extends Error{constructor(public status:number,public code:string){super(code)}}
export const fail=(status:number,code:string):never=>{throw new AppError(status,code)};
export const db=()=>env.DB;
export const one=async<T=Row>(sql:string,...params:any[])=>db().prepare(sql).bind(...params).first<T>();
export const all=async<T=Row>(sql:string,...params:any[])=>{const r=await db().prepare(sql).bind(...params).all<T>();return r.results};
export const now=()=>new Date().toISOString();
export const id=()=>crypto.randomUUID();
export const statement=(sql:string,...p:any[])=>db().prepare(sql).bind(...p);
export function auditStatement(actor:Profile,action:string,target:string,reason:string){return statement('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)',id(),actor.id,action,target,reason,now())}
export async function actor(){const identity=await getChatGPTUser();if(!identity)fail(401,'SIGN_IN_REQUIRED');const isOwner=!!env.ADMIN_EMAIL&&identity.email.trim().toLowerCase()===env.ADMIN_EMAIL.trim().toLowerCase();await statement('INSERT OR IGNORE INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)',identity.userId,identity.email,identity.displayName,isOwner?'admin':'client',isOwner?'approved':'pending',now()).run();if(isOwner)await statement("UPDATE profiles SET role='admin',status='approved' WHERE id=? AND role<>'admin'",identity.userId).run();const profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',identity.userId);if(!profile)fail(503,'SERVICE_UNAVAILABLE');return profile}
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
export const response=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export const stages=['assessment','treatment','transfer','pregnancy','birth','paperwork','paused','loss','closed'];

export async function read(path:string[],a:Profile,request:Request){
 if(path[0]==='me')return response({profile:a});
 active(a);
 if(path[0]==='overview'){
  const cases=await all('SELECT c.*,m.role AS membership_role FROM cases c JOIN case_members m ON m.case_id=c.id WHERE m.user_id=? ORDER BY c.updated_at DESC LIMIT 200',a.id);
  const grants=await all('SELECT scope,expires_at,revoked_at FROM directory_grants WHERE user_id=?',a.id);
  return response({cases,grants});
 }
 if(path[0]==='people'){admin(a);return response({people:await all('SELECT * FROM profiles ORDER BY created_at DESC LIMIT 300')})}
 if(path[0]==='audit'){admin(a);return response({audit:await all('SELECT a.*,p.name AS actor_name FROM audit a LEFT JOIN profiles p ON p.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100')})}
 if(path[0]==='grants'){admin(a);return response({grants:await all('SELECT g.*,p.name,p.email FROM directory_grants g JOIN profiles p ON p.id=g.user_id ORDER BY p.name')})}
 if(path[0]==='directory'){
  const kind=choice(new URL(request.url).searchParams.get('kind')||'egg',['egg','sperm']);
  if(a.role!=='admin'){const grant=await one('SELECT * FROM directory_grants WHERE user_id=? AND scope=?',a.id,kind);if(!canUseDirectory(a,grant as any,kind))fail(403,'DIRECTORY_LOCKED')}
  const donors=await all(`SELECT d.id,d.code,d.kind,d.age,d.height,d.blood_group,d.source,d.summary_zh,d.summary_en,d.status,d.verified_at,CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END AS favorite FROM donors d LEFT JOIN favorites f ON f.donor_id=d.id AND f.user_id=? WHERE d.kind=? ${a.role==='admin'?'':"AND d.status<>'archived'"} ORDER BY d.code LIMIT 300`,a.id,kind);
  return response({donors});
 }
 if(path[0]==='cases'&&path.length===1){admin(a);return response({cases:await all('SELECT c.*,m.role AS membership_role FROM cases c LEFT JOIN case_members m ON m.case_id=c.id AND m.user_id=? ORDER BY updated_at DESC LIMIT 200',a.id)})}
 if(path[0]==='cases'&&path.length===2){
  const caseId=path[1];const role=await member(a,caseId);const c=await one('SELECT * FROM cases WHERE id=?',caseId);if(!c)fail(404,'NOT_FOUND');
  const reportRows=await all('SELECT r.*,EXISTS(SELECT 1 FROM report_recipients rr WHERE rr.report_id=r.id AND rr.user_id=?) AS is_recipient FROM reports r WHERE r.case_id=? ORDER BY r.report_date DESC,r.created_at DESC',a.id,caseId);
  const reports=reportRows.filter(r=>canReadReport(a,role,r as any,!!r.is_recipient)).map(r=>{const {object_key,translation_key,sha256,...safe}=r;return {...safe,has_translation:!!translation_key,can_review:canReviewReport(a,role,r as any),can_publish:canPublishReport(a,role,r as any)}});
  const members=await all(`SELECT p.id,p.name,m.role,p.status ${role==='client'?'':',p.email'} FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? ${role==='client'?"AND (m.user_id=? OR m.role='coordinator')":''}`,caseId,...(role==='client'?[a.id]:[]));
  const questions=await all(`SELECT q.*,p.name AS author_name FROM questions q JOIN profiles p ON p.id=q.author_id WHERE q.case_id=? ${role==='client'?'AND q.author_id=?':''} ORDER BY q.created_at DESC LIMIT 100`,caseId,...(role==='client'?[a.id]:[]));
  const events=await all('SELECT e.*,p.name AS author_name FROM events e JOIN profiles p ON p.id=e.created_by WHERE e.case_id=? ORDER BY e.event_date DESC,e.created_at DESC LIMIT 200',caseId);
  return response({case:c,membership:role,can_manage:canManageCase(a,role),members,reports,events,questions});
 }
 if(path[0]==='files'&&path.length===3){
  const r=await one('SELECT * FROM reports WHERE id=?',path[1]);if(!r)fail(404,'NOT_FOUND');const role=await member(a,r.case_id);const recipient=await one('SELECT 1 FROM report_recipients WHERE report_id=? AND user_id=?',r.id,a.id);if(!canReadReport(a,role,r as any,!!recipient))fail(404,'NOT_FOUND');
  const variant=choice(path[2],['original','translation']);const key=variant==='original'?r.object_key:r.translation_key;if(!key)fail(404,'NOT_FOUND');const object=await env.FILES.get(key);if(!object)fail(404,'NOT_FOUND');await auditStatement(a,'file.download',r.id,variant).run();const name=variant==='original'?r.file_name:r.translation_name;
  return new Response(object.body,{headers:{'Content-Type':variant==='original'?r.mime:r.translation_mime,'Content-Disposition':`attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(name)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Referrer-Policy':'no-referrer'}});
 }
 fail(404,'NOT_FOUND');
}

export async function write(path:string[],a:Profile,request:Request){
 mutateRequest(request);
 if(path[0]==='profile'){
  if(a.status==='suspended')fail(403,'ACCOUNT_SUSPENDED');const body=await json(request);if(body.accepted!==true)fail(400,'CONSENT_REQUIRED');const name=text(body.name,80),language=choice(body.language,['zh','en']),jurisdiction=text(body.jurisdiction,100),interest=text(body.interest,1000);
  await db().batch([statement('UPDATE profiles SET name=?,language=?,jurisdiction=?,interest=?,registered_at=COALESCE(registered_at,?) WHERE id=?',name,language,jurisdiction,interest,now(),a.id),auditStatement(a,'profile.register',a.id,'Private pilot notice v1 acknowledged')]);return response({ok:true});
 }
 active(a);
 if(path[0]==='people'&&path.length===2){
  admin(a);const b=await json(request),target=await one<Profile>('SELECT * FROM profiles WHERE id=?',path[1]);if(!target)fail(404,'NOT_FOUND');if(target.role==='admin'||target.id===a.id)fail(403,'OWNER_PROTECTED');const status=choice(b.status,['pending','approved','suspended']),role=choice(b.role,['client','coordinator','reviewer']),reason=text(b.reason,500);
  // Role changes drop previous case permissions; a fresh assignment is required.
  const stmts=[statement('UPDATE profiles SET status=?,role=? WHERE id=?',status,role,target.id)];if(role!==target.role)stmts.push(statement('DELETE FROM case_members WHERE user_id=?',target.id));if(status!=='approved'||role!==target.role)stmts.push(statement('UPDATE directory_grants SET revoked_at=? WHERE user_id=?',now(),target.id));stmts.push(auditStatement(a,'profile.update',target.id,`${role}/${status}: ${reason}`));await db().batch(stmts);return response({ok:true});
 }
 if(path[0]==='grants'){
  admin(a);const b=await json(request),userId=text(b.user_id),scope=choice(b.scope,['egg','sperm']),reason=text(b.reason,500);const person=await one<Profile>('SELECT * FROM profiles WHERE id=?',userId);if(!person)fail(404,'NOT_FOUND');if(b.revoke===true){await db().batch([statement('UPDATE directory_grants SET revoked_at=? WHERE user_id=? AND scope=?',now(),userId,scope),auditStatement(a,'directory.revoke',userId,`${scope}: ${reason}`)]);return response({ok:true})}if(person.status!=='approved')fail(400,'APPROVAL_REQUIRED');const expires=date(b.expires_at)+'T23:59:59.999Z';if(Date.parse(expires)<=Date.now()||Date.parse(expires)>Date.now()+366*86400000)fail(400,'INVALID_DATE');
  await db().batch([statement('INSERT INTO directory_grants (user_id,scope,expires_at,revoked_at,reason,granted_by) VALUES (?,?,?,NULL,?,?) ON CONFLICT(user_id,scope) DO UPDATE SET expires_at=excluded.expires_at,revoked_at=NULL,reason=excluded.reason,granted_by=excluded.granted_by',userId,scope,expires,reason,a.id),auditStatement(a,'directory.grant',userId,`${scope} / ${expires}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='donors'&&path.length===1){
  admin(a);const b=await json(request),donorId=id(),code=text(b.code,40),kind=choice(b.kind,['egg','sperm']),age=number(b.age,18,65),height=b.height?number(b.height,100,230):null,group=text(b.blood_group||'',20,false),source=text(b.source,150),zh=text(b.summary_zh,1500),en=text(b.summary_en,1500),verified=date(b.verified_at),consent=text(b.consent_ref,250);const exists=await one('SELECT id FROM donors WHERE code=?',code);if(exists)fail(409,'DUPLICATE_CODE');
  await db().batch([statement('INSERT INTO donors (id,code,kind,age,height,blood_group,source,summary_zh,summary_en,verified_at,consent_ref,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',donorId,code,kind,age,height,group,source,zh,en,verified,consent,now()),auditStatement(a,'donor.create',donorId,consent)]);return response({id:donorId});
 }
 if(path[0]==='donors'&&path.length===2){admin(a);const b=await json(request);const status=choice(b.status,['available','matching','unavailable','archived']);await db().batch([statement('UPDATE donors SET status=? WHERE id=?',status,path[1]),auditStatement(a,'donor.status',path[1],text(b.reason,500))]);return response({ok:true})}
 if(path[0]==='favorites'){
  const b=await json(request),d=await one('SELECT * FROM donors WHERE id=?',text(b.donor_id));if(!d||d.status==='archived')fail(404,'NOT_FOUND');if(a.role!=='admin'){const grant=await one('SELECT * FROM directory_grants WHERE user_id=? AND scope=?',a.id,d.kind);if(!canUseDirectory(a,grant as any,d.kind))fail(403,'DIRECTORY_LOCKED')}
  if(b.favorite===true)await statement('INSERT OR IGNORE INTO favorites (user_id,donor_id) VALUES (?,?)',a.id,d.id).run();else await statement('DELETE FROM favorites WHERE user_id=? AND donor_id=?',a.id,d.id).run();return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===1){
  admin(a);const b=await json(request),caseId=id(),title=text(b.title,120),customerId=text(b.customer_id),reason=text(b.reason,500);const customer=await one<Profile>('SELECT * FROM profiles WHERE id=?',customerId);if(!customer||customer.role!=='client'||customer.status!=='approved')fail(400,'APPROVAL_REQUIRED');const code=`FL-${new Date().getUTCFullYear()}-${caseId.slice(0,8).toUpperCase()}`,created=now();
  await db().batch([statement('INSERT INTO cases (id,code,title,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?)',caseId,code,title,a.id,created,created),statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?)',caseId,customerId,'client',created),statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?)',caseId,a.id,'coordinator',created),auditStatement(a,'case.create',caseId,reason)]);return response({id:caseId});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='members'){
  admin(a);const b=await json(request),caseId=path[1],userId=text(b.user_id),reason=text(b.reason,500);if(!await one('SELECT id FROM cases WHERE id=?',caseId))fail(404,'NOT_FOUND');if(b.remove===true){await db().batch([statement('DELETE FROM case_members WHERE case_id=? AND user_id=?',caseId,userId),statement('DELETE FROM report_recipients WHERE user_id=? AND report_id IN (SELECT id FROM reports WHERE case_id=?)',userId,caseId),auditStatement(a,'member.remove',caseId,`${userId}: ${reason}`)]);return response({ok:true})}const target=await one<Profile>('SELECT * FROM profiles WHERE id=?',userId);if(!target||target.status!=='approved')fail(400,'APPROVAL_REQUIRED');const role=target.role==='admin'?'coordinator':choice(target.role,['client','coordinator','reviewer']);await db().batch([statement('INSERT INTO case_members (case_id,user_id,role,created_at) VALUES (?,?,?,?) ON CONFLICT(case_id,user_id) DO UPDATE SET role=excluded.role',caseId,userId,role,now()),auditStatement(a,'member.assign',caseId,`${userId}/${role}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='stage'){
  await manager(a,path[1]);const b=await json(request),stage=choice(b.stage,stages),cycle=number(b.cycle,1,99),reason=text(b.reason,500);await db().batch([statement('UPDATE cases SET stage=?,cycle=?,updated_at=? WHERE id=?',stage,cycle,now(),path[1]),auditStatement(a,'case.stage',path[1],`${stage}/cycle ${cycle}: ${reason}`)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='events'){
  await manager(a,path[1]);const b=await json(request),eventId=id(),title=text(b.title,150),note=text(b.note||'',1500,false),kind=choice(b.kind,['milestone','appointment']),day=date(b.event_date),cycle=number(b.cycle,1,99);await db().batch([statement('INSERT INTO events (id,case_id,cycle,kind,title,note,event_date,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)',eventId,path[1],cycle,kind,title,note,day,a.id,now()),statement('UPDATE cases SET updated_at=? WHERE id=?',now(),path[1]),auditStatement(a,'event.create',eventId,kind)]);return response({ok:true});
 }
 if(path[0]==='cases'&&path.length===3&&path[2]==='questions'){
  await member(a,path[1]);const b=await json(request);const recent=await one('SELECT COUNT(*) AS count FROM questions WHERE author_id=? AND created_at>?',a.id,new Date(Date.now()-3600000).toISOString());if(Number(recent?.count)>=20)fail(429,'TOO_MANY_REQUESTS');await statement('INSERT INTO questions (id,case_id,author_id,body,created_at) VALUES (?,?,?,?,?)',id(),path[1],a.id,text(b.body,2000),now()).run();return response({ok:true});
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
 await manager(a,caseId);if(Number(request.headers.get('content-length')||0)>17*1024*1024)fail(413,'TOO_LARGE');const f=await request.formData();const original=f.get('original');if(!(original instanceof File))fail(400,'FILE_REQUIRED');const title=text(f.get('title'),150),kind=choice(f.get('kind'),['report','document']),source=text(f.get('source'),150),reportDate=date(f.get('report_date')),language=choice(f.get('language'),['ka','en','zh']),cycle=number(f.get('cycle'),1,99);let recipientIds:string[]=[];try{const value=JSON.parse(String(f.get('recipients')));if(!Array.isArray(value)||!value.length||value.length>10||value.some(x=>typeof x!=='string'))fail(400,'RECIPIENT_REQUIRED');recipientIds=[...new Set(value)]}catch{fail(400,'RECIPIENT_REQUIRED')}
 const members=await all("SELECT m.user_id FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? AND m.role='client' AND p.role='client' AND p.status='approved'",caseId);if(recipientIds.some(x=>!members.some(m=>m.user_id===x)))fail(400,'RECIPIENT_REQUIRED');
 const bytes=new Uint8Array(await original.arrayBuffer());if(!validateUpload(original.name,original.type,bytes))fail(400,'INVALID_FILE');const translation=f.get('translation');let translationBytes:Uint8Array|null=null;if(translation instanceof File&&translation.size){translationBytes=new Uint8Array(await translation.arrayBuffer());if(!validateUpload(translation.name,translation.type,translationBytes))fail(400,'INVALID_FILE')}
 let version=1;const supersedes=String(f.get('supersedes_id')||'').trim()||null;if(supersedes){const old=await one('SELECT * FROM reports WHERE id=? AND case_id=?',supersedes,caseId);if(!old||old.cycle!==cycle)fail(400,'INVALID_INPUT');version=old.version+1}
 const reportId=id(),objectKey=`private/${caseId}/${reportId}/original`,translationKey=translationBytes?`private/${caseId}/${reportId}/translation`:null;const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
 await env.FILES.put(objectKey,bytes,{httpMetadata:{contentType:original.type}});try{if(translationKey&&translationBytes)await env.FILES.put(translationKey,translationBytes);const ts=translation instanceof File&&translationBytes?translation:null;const stmts=[statement('INSERT INTO reports (id,case_id,cycle,title,kind,source,report_date,language,object_key,file_name,mime,size,sha256,translation_key,translation_name,translation_mime,uploaded_by,version,supersedes_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',reportId,caseId,cycle,title,kind,source,reportDate,language,objectKey,original.name.slice(0,180),original.type,original.size,hash,translationKey,ts?.name.slice(0,180)||null,ts?.type||null,a.id,version,supersedes,now()),...recipientIds.map(userId=>statement('INSERT INTO report_recipients (report_id,user_id) VALUES (?,?)',reportId,userId)),auditStatement(a,'report.upload',reportId,`cycle ${cycle}, ${kind}, version ${version}`)];await db().batch(stmts)}catch(error){await env.FILES.delete(objectKey);if(translationKey)await env.FILES.delete(translationKey);throw error}return response({id:reportId});
}
