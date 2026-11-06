import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import {registerHooks} from 'node:module';
import ts from 'typescript';

// Run the actual mutation handlers against SQLite; only Worker bindings and HTTP are replaced.
const env={SITE_ORIGIN:'https://portal.example.invalid',RESEND_API_KEY:'test-key',EMAIL_FROM:'Nesta <team@example.invalid>'};
globalThis.__notificationTestEnv=env;
registerHooks({
 resolve(specifier,context,next){
  if(specifier==='cloudflare:workers')return {url:'test:workers',shortCircuit:true};
  if(specifier.startsWith('.')&&context.parentURL){
   const url=new URL(specifier,context.parentURL);
   if(!url.search&&!/\.[a-z]+$/i.test(url.pathname)&&existsSync(new URL(url.href+'.ts')))return next(url.href+'.ts',context);
  }
  return next(specifier,context);
 },
 load(url,context,next){
  if(url==='test:workers')return {format:'module',source:'export const env=globalThis.__notificationTestEnv;',shortCircuit:true};
  if(url.endsWith('.sql?raw'))return {format:'module',source:`export default ${JSON.stringify(readFileSync(new URL(url.slice(0,-4)),'utf8'))}`,shortCircuit:true};
  if(url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
  return next(url,context);
 }
});
const {write,processNotificationOutbox}=await import('../lib/server.ts');
const {sendWithRetry}=await import('../lib/client-notifications.ts');
const owner={id:'owner',role:'admin',status:'approved'};
const stamp='2026-11-05T10:00:00.000Z';

test('email delivery retries transient failures with bounded attempts',async()=>{
 let attempts=0;
 await sendWithRetry(async()=>{attempts++;if(attempts<3)throw new Error('temporary');}, {to:'a@example.invalid',subject:'test',text:'test'}, {maxAttempts:3,baseDelayMs:0});
 assert.equal(attempts,3);
});

function fixture(t){
 const db=new DatabaseSync(':memory:');
 for(const file of ['0000_swift_jamie_braddock.sql','0007_case_documents.sql','0011_notification_outbox.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const run=(sql,...args)=>db.prepare(sql).run(...args);
 for(const [id,role,status,language] of [
  ['owner','admin','approved','en'],['reviewer','reviewer','approved','en'],
  ['alice','client','approved','zh'],['bob','client','approved','en'],
  ['suspended','client','suspended','zh'],['pending','client','pending','zh'],['outsider','client','approved','en']
 ])run('INSERT INTO profiles(id,email,name,role,status,language,created_at) VALUES (?,?,?,?,?,?,?)',id,id+'@example.invalid',id,role,status,language,stamp);
 for(const id of ['case','other'])run('INSERT INTO cases(id,code,title,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?)',id,id,'PRIVATE_CASE_TITLE','owner',stamp,stamp);
 for(const [id,role] of [['owner','coordinator'],['reviewer','reviewer'],['alice','client'],['bob','client'],['suspended','client'],['pending','client']])run('INSERT INTO case_members VALUES (?,?,?,?)','case',id,role,stamp);
 run('INSERT INTO case_members VALUES (?,?,?,?)','other','outsider','client',stamp);
 run("INSERT INTO case_documents VALUES ('case','apostille','not_started',NULL,'',?,NULL)",stamp);
 run("INSERT INTO reports(id,case_id,cycle,title,source,report_date,language,object_key,file_name,mime,size,sha256,status,uploaded_by,reviewed_by,created_at) VALUES ('report','case',1,'PRIVATE_REPORT','Clinic','2026-11-05','en','PRIVATE_KEY','report.pdf','application/pdf',20,'HASH','reviewed','owner','reviewer',?)",stamp);
 for(const id of ['alice','suspended','pending','outsider'])run("INSERT INTO report_recipients VALUES ('report',?)",id);
 run("INSERT INTO questions(id,case_id,author_id,body,created_at) VALUES ('question','case','alice','PRIVATE_QUESTION',?)",stamp);
 const prepare=(sql,args=[])=>({bind:(...values)=>prepare(sql,values),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(run(sql,...args).changes)}})});
 env.DB={prepare,batch:async statements=>{
  db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}
 }};
 const sent=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  assert.equal(url,'https://api.resend.com/emails');
  const mail=JSON.parse(options.body);
  assert.doesNotMatch(JSON.stringify(mail),/PRIVATE_|HASH/);
  sent.push(mail);return new Response('{}',{status:200});
 });
 t.after(()=>db.close());
 const post=(path,body,actor=owner)=>write(path.split('/'),actor,new Request(env.SITE_ORIGIN+'/api/'+path,{method:'POST',headers:{origin:env.SITE_ORIGIN,'x-firstleaf':'firstleaf','content-type':'application/json'},body:JSON.stringify(body)}));
 const drain=()=>processNotificationOutbox(50);
 return {db,run,post,drain,sent,addresses:()=>sent.flatMap(m=>m.to).sort((a,b)=>a.localeCompare(b))};
}

test('publishing queues only approved assigned report recipients after commit',async t=>{
 const f=fixture(t);
 assert.equal((await f.post('reports/report/publish',{reason:'release'})).status,200);
 assert.equal(f.db.prepare("SELECT status FROM reports WHERE id='report'").get().status,'published');
 const queued=f.db.prepare("SELECT recipient,subject,body,status FROM notification_outbox ORDER BY recipient").all();
 assert.deepEqual(queued.map(row=>row.recipient),['alice@example.invalid']);
 assert.equal(queued[0].status,'pending');
 assert.match(queued[0].body,/报告与文件/);
 assert.match(queued[0].body,/https:\/\/portal\.example\.invalid\/portal/);
 assert.equal(f.sent.length,0);
 await assert.rejects(f.post('reports/report/publish',{reason:'repeat'}));
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM notification_outbox').get().n,1);
});

test('draft reviews do not notify; withdrawing a published file notifies once',async t=>{
 const f=fixture(t);
 f.run("UPDATE reports SET status='draft'");
 await f.post('reports/report/review',{decision:'reviewed',reason:'checked'},{id:'reviewer',role:'reviewer',status:'approved'});
 assert.equal(f.sent.length,0);
 await f.post('reports/report/withdraw',{reason:'draft removed'});
 assert.equal(f.sent.length,0);
 f.run("UPDATE reports SET status='published'");
 await f.post('reports/report/withdraw',{reason:'removed'});
 await f.drain();
 await f.post('reports/report/withdraw',{reason:'removed again'});
 assert.deepEqual(f.addresses(),['alice@example.invalid']);
});

test('stage and cycle changes notify current clients in their language; unchanged saves do not',async t=>{
 const f=fixture(t);
 await f.post('cases/case/stage',{stage:'treatment',cycle:1,reason:'PRIVATE_REASON'});
 await f.drain();
 assert.deepEqual(f.addresses(),['alice@example.invalid','bob@example.invalid']);
 assert.match(f.sent.find(m=>m.to[0].startsWith('alice')).text,/服务进度/);
 assert.match(f.sent.find(m=>m.to[0].startsWith('bob')).text,/service progress/i);
 await f.post('cases/case/stage',{stage:'treatment',cycle:1,reason:'save again'});
 assert.equal(f.sent.length,2);
 await f.post('cases/case/stage',{stage:'treatment',cycle:2,reason:'new cycle'});
 await f.drain();
 assert.equal(f.sent.length,4);
});

test('milestones and appointments notify case clients',async t=>{
 const f=fixture(t);
 for(const kind of ['milestone','appointment']){await f.post('cases/case/events',{kind,title:'PRIVATE_TITLE',note:'PRIVATE_NOTE',cycle:1,event_date:'2026-11-06'});await f.drain()}
 assert.deepEqual(f.addresses(),['alice@example.invalid','alice@example.invalid','bob@example.invalid','bob@example.invalid']);
});

test('document status or date changes notify; internal-only edits and no-op saves do not',async t=>{
 const f=fixture(t);
 const body={kind:'apostille',status:'in_progress',status_date:null,notes:'PRIVATE_NOTES',reason:'update'};
 await f.post('cases/case/documents',body);
 await f.drain();
 assert.equal(f.sent.length,2);
 await f.post('cases/case/documents',body);
 await f.post('cases/case/documents',{...body,notes:'PRIVATE_NEW_NOTES'});
 assert.equal(f.sent.length,2);
 await f.post('cases/case/documents',{...body,status_date:'2026-11-05'});
 await f.drain();
 assert.equal(f.sent.length,4);
});

test('a new or edited reply only notifies its author; no-op saves and removed members do not',async t=>{
 const f=fixture(t);
 await f.post('questions/question',{reply:'PRIVATE_REPLY'});
 await f.drain();
 assert.deepEqual(f.addresses(),['alice@example.invalid']);
 assert.match(f.sent[0].text,/沟通记录/);
 await f.post('questions/question',{reply:'PRIVATE_REPLY'});
 assert.equal(f.sent.length,1);
 await f.post('questions/question',{reply:'PRIVATE_NEW_REPLY'});
 await f.drain();
 assert.equal(f.sent.length,2);
 f.run("DELETE FROM case_members WHERE user_id='alice'");
 await f.post('questions/question',{reply:'PRIVATE_LAST_REPLY'});
 assert.equal(f.sent.length,2);
});

test('failed or unauthorized mutations never send email',async t=>{
 const f=fixture(t);
 await assert.rejects(f.post('cases/case/stage',{stage:'bad',cycle:1,reason:'bad'}));
 await assert.rejects(f.post('cases/case/stage',{stage:'treatment',cycle:1,reason:'bad'},{id:'outsider',role:'client',status:'approved'}));
 f.db.exec("CREATE TRIGGER reject_events BEFORE INSERT ON events BEGIN SELECT RAISE(ABORT,'storage failure'); END");
 await assert.rejects(f.post('cases/case/events',{kind:'milestone',title:'title',cycle:1,event_date:'2026-11-06'}));
 assert.equal(f.sent.length,0);
});

test('mail failure preserves the update and stores failed delivery for retry',async t=>{
 const f=fixture(t);const attempted=[];
 t.mock.method(console,'error',()=>{});
 t.mock.method(globalThis,'fetch',async(url,options)=>{attempted.push(JSON.parse(options.body).to[0]);return new Response('{}',{status:attempted.length===1?503:200})});
 assert.equal((await f.post('cases/case/stage',{stage:'treatment',cycle:1,reason:'update'})).status,200);
 assert.equal(f.db.prepare("SELECT stage FROM cases WHERE id='case'").get().stage,'treatment');
 await f.drain();
 assert.deepEqual(attempted.sort((a,b)=>a.localeCompare(b)),['alice@example.invalid','bob@example.invalid']);
 const failed=f.db.prepare("SELECT status,attempts,last_error FROM notification_outbox WHERE recipient='alice@example.invalid'").get();
 assert.equal(failed.status,'pending');assert.equal(failed.attempts,1);assert.ok(failed.last_error);
});

test('concurrent publication makes stale withdrawal fail without a false audit or email',async t=>{
 const f=fixture(t);
 const batch=env.DB.batch;
 env.DB.batch=async statements=>{
  f.run("UPDATE reports SET status='published' WHERE id='report'");
  return batch(statements);
 };
 await assert.rejects(f.post('reports/report/withdraw',{reason:'withdraw'}),error=>error.status===409&&error.code==='STALE_RECORD');
 assert.equal(f.db.prepare("SELECT status FROM reports WHERE id='report'").get().status,'published');
 assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE action='report.withdraw'").get().n,0);
 assert.equal(f.sent.length,0);
});
