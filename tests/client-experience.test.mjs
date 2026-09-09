import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {readClientHighlights} from '../lib/client-highlights.ts';
import {emailSignInAvailable} from '../lib/auth-options.ts';

test('email sign in requires sending credentials and a session secret',()=>{
 assert.equal(emailSignInAvailable({}),false);
 assert.equal(emailSignInAvailable({RESEND_API_KEY:'key',EMAIL_FROM:'from'}),false);
 assert.equal(emailSignInAvailable({RESEND_API_KEY:'key',EMAIL_FROM:'from',SESSION_SECRET:'secret'}),true);
});
test('customer homepage only returns own published recipient reports and upcoming assigned appointments',async()=>{
 const db=new DatabaseSync(':memory:');
 try{
  for(const f of ['0000_swift_jamie_braddock.sql','0003_egg_requests.sql'])db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
  db.exec("INSERT INTO profiles(id,email,name,created_at) VALUES ('client','test@example.invalid','Test','2026-09-09'); INSERT INTO cases(id,code,title,created_by,created_at,updated_at) VALUES ('case','FL-001','Case','client','2026-09-09','2026-09-09'); INSERT INTO case_members VALUES ('case','client','client','2026-09-09')");
  for(const [id,status,recipient] of [['visible','published',true],['draft','draft',true],['other','published',false]]){
   db.prepare("INSERT INTO reports(id,case_id,cycle,title,source,report_date,language,object_key,file_name,mime,size,sha256,status,uploaded_by,created_at,published_at) VALUES (?,'case',1,?,'Clinic','2026-09-09','en','SECRET','r.pdf','application/pdf',20,'HASH',?,'client','2026-09-09','2026-09-09')").run(id,id,status);
   if(recipient)db.prepare("INSERT INTO report_recipients VALUES (?,'client')").run(id);
  }
  for(const [id,date] of [['future','2026-09-10'],['past','2026-09-08']])db.prepare("INSERT INTO events(id,case_id,cycle,kind,title,event_date,created_by,created_at) VALUES (?,'case',1,'appointment',?,?,'client','2026-09-09')").run(id,id,date);
  const query={all:async(sql,...p)=>db.prepare(sql).all(...p),one:async(sql,...p)=>db.prepare(sql).get(...p)||null};
  const actor={id:'client',role:'client',status:'approved'};
  let data=await readClientHighlights(actor,query,'2026-09-09');
  assert.deepEqual(data.recent_reports.map(r=>r.id),['visible']);
  assert.deepEqual(data.appointments.map(r=>r.id),['future']);
  assert.ok(!JSON.stringify(data).includes('SECRET'));
  db.exec('DELETE FROM case_members');
  data=await readClientHighlights(actor,query,'2026-09-09');
  assert.deepEqual(data.recent_reports,[]);assert.deepEqual(data.appointments,[]);
  await assert.rejects(readClientHighlights({...actor,status:'suspended'},query),/FORBIDDEN/);
 }finally{db.close()}
});
