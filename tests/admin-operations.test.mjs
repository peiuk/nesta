import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {readAdminOperations} from '../lib/admin-operations.ts';

const actor={id:'owner',role:'admin',status:'approved'};
const now='2026-09-08T10:00:00.000Z';
function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(new URL('../drizzle/0000_swift_jamie_braddock.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../drizzle/0003_egg_requests.sql',import.meta.url),'utf8'));
 const run=(sql,...args)=>db.prepare(sql).run(...args);
 for(const [id,role,status,registered] of [['owner','admin','approved',null],['client','client','approved',now],['pending','client','pending',now],['unfinished','client','pending',null],['suspended','client','suspended',now]])run('INSERT INTO profiles (id,email,name,role,status,registered_at,created_at) VALUES (?,?,?,?,?,?,?)',id,id+'@test.invalid',id,role,status,registered,now);
 for(const id of ['assigned','private','closed'])run('INSERT INTO cases (id,code,title,stage,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',id,id,id,id==='closed'?'closed':'pregnancy','owner',now,now);
 run('INSERT INTO case_members VALUES (?,?,?,?)','assigned','owner','coordinator',now);
 for(const [id,caseId,status] of [['ready','assigned','reviewed'],['draft','assigned','draft'],['secret','private','reviewed']])run('INSERT INTO reports (id,case_id,cycle,title,source,report_date,language,object_key,file_name,mime,size,sha256,status,uploaded_by,created_at) VALUES (?,?,1,?,?,?,?,?,?,?,?,?,?,?,?)',id,caseId,id,'clinic','2026-09-08','en','PRIVATE_STORAGE_KEY','report.pdf','application/pdf',100,'PRIVATE_HASH',status,'owner',now);
 for(const id of ['assigned','private'])run('INSERT INTO questions (id,case_id,author_id,body,created_at) VALUES (?,?,?,?,?)',id,id,'client',id+' message',now);
 for(const [id,date] of [['upcoming','2026-09-10'],['past','2026-09-07'],['far','2026-09-15']])run('INSERT INTO events (id,case_id,cycle,kind,title,event_date,created_by,created_at) VALUES (?, ?,1,?,?,?,?,?)',id,'assigned','appointment',id,date,'owner',now);
 for(const [user,scope,expires,revoked] of [['client','egg','2026-09-10T00:00:00Z',null],['client','sperm','2026-09-07T00:00:00Z',null],['suspended','egg','2026-09-10T00:00:00Z',null],['pending','egg','2026-09-10T00:00:00Z',now]])run('INSERT INTO directory_grants VALUES (?,?,?,?,?,?)',user,scope,expires,revoked,'reason','owner');
 return {db,run,query:{all:async(sql,...args)=>db.prepare(sql).all(...args),one:async(sql,...args)=>db.prepare(sql).get(...args)||null}};
}
test('admin work queues count real records and exclude unsubmitted registrations',async()=>{
 const {db,query}=fixture();try{
  const data=await readAdminOperations(actor,query,now);
  assert.equal(data.counts.pending_profiles,1);
  assert.equal(data.counts.active_cases,2);
  assert.equal(data.counts.ready_reports,1);
  assert.equal(data.counts.draft_reports,1);
  assert.equal(data.counts.unanswered,1);
  assert.equal(data.counts.expiring_grants,1);
  assert.deepEqual(data.pending.map(p=>p.id),['pending']);
  assert.deepEqual(data.appointments.map(e=>e.id),['upcoming']);
 }finally{db.close()}
});
test('medical metadata and messages remain limited to assigned cases; storage keys never leave server',async()=>{
 const {db,query,run}=fixture();try{
  const data=await readAdminOperations(actor,query,now);
  assert.deepEqual(data.reports.map(r=>r.id).sort(),['draft','ready']);
  assert.deepEqual(data.questions.map(q=>q.id),['assigned']);
  assert.ok(!JSON.stringify(data).includes('PRIVATE_STORAGE_KEY'));
  assert.ok(!JSON.stringify(data).includes('PRIVATE_HASH'));
  run('DELETE FROM case_members WHERE user_id=?','owner');
  const revoked=await readAdminOperations(actor,query,now);
  assert.equal(revoked.reports.length,0);
  assert.equal(revoked.questions.length,0);
  assert.equal(revoked.appointments.length,0);
  assert.equal(revoked.counts.ready_reports,0);
  assert.equal(revoked.counts.my_open_cases,0);
  assert.deepEqual(revoked.drafts_missing_reviewer,[]);
  assert.deepEqual(revoked.unassigned.map(c=>c.id),['assigned','private']);
 }finally{db.close()}
});
test('non-admin and suspended actors are rejected before database queries',async()=>{
 const query={one:()=>assert.fail('must not query'),all:()=>assert.fail('must not query')};
 for(const a of [{...actor,role:'client'},{...actor,role:'coordinator'},{...actor,status:'suspended'},{...actor,status:'pending'}])await assert.rejects(readAdminOperations(a,query,now),/FORBIDDEN/);
});
test('empty database has zero counts and empty queues',async()=>{
 const {db,query}=fixture();try{
  db.exec('PRAGMA foreign_keys=OFF');
  for(const table of ['case_members','reports','questions','events','directory_grants','cases','profiles'])db.exec('DELETE FROM '+table);
  const data=await readAdminOperations(actor,query,now);
  assert.ok(Object.values(data.counts).every(n=>n===0));
  for(const key of ['pending','reports','questions','appointments','expiring','activity','unassigned','drafts_missing_reviewer'])assert.deepEqual(data[key],[]);
 }finally{db.close()}
});
test('open-case count splits membership from the full list, and drafts without an approved reviewer are named',async()=>{
 const {db,query,run}=fixture();try{
  const data=await readAdminOperations(actor,query,now);
  assert.equal(data.counts.active_cases,2);
  assert.equal(data.counts.my_open_cases,1);
  assert.deepEqual(data.unassigned.map(c=>c.id),['private']);
  assert.deepEqual(data.drafts_missing_reviewer.map(r=>r.id),['draft']);
  assert.equal(JSON.stringify(data.unassigned).includes('PRIVATE_STORAGE_KEY'),false);
  run('INSERT INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)','reviewer','reviewer@test.invalid','reviewer','reviewer','pending',now);
  run('INSERT INTO case_members VALUES (?,?,?,?)','assigned','reviewer','reviewer',now);
  const pendingReviewer=await readAdminOperations(actor,query,now);
  assert.deepEqual(pendingReviewer.drafts_missing_reviewer.map(r=>r.id),['draft']);
  run("UPDATE profiles SET status='approved' WHERE id=?",'reviewer');
  const covered=await readAdminOperations(actor,query,now);
  assert.deepEqual(covered.drafts_missing_reviewer,[]);
  assert.deepEqual(covered.unassigned.map(c=>c.id),['private']);
 }finally{db.close()}
});
