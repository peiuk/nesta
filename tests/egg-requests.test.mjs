import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {submitEggRequest,decideEggRequest,withdrawEggRequest,listEggRequests} from '../lib/egg-requests.ts';
const now='2026-09-08T15:00:00.000Z';
const client={id:'client',role:'client',status:'approved'},admin={id:'owner',role:'admin',status:'approved'};
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const file of ['0000_swift_jamie_braddock.sql','0003_egg_requests.sql'])db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const run=(sql,...p)=>db.prepare(sql).run(...p);
 for(const [id,role] of [['client','client'],['other','client'],['owner','admin']])run('INSERT INTO profiles(id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)',id,id+'@test.invalid',id,role,'approved',now);
 run("INSERT INTO donors(id,code,kind,age,source,summary_zh,summary_en,verified_at,consent_ref,created_at) VALUES ('donor','EG-001','egg',28,'Partner','summary','summary','2026-09-08','PRIVATE-CONSENT',?)",now);
 run("INSERT INTO directory_grants VALUES ('client','egg','2026-10-01T00:00:00Z',NULL,'test','owner')");
 const store={first:async(sql,...p)=>db.prepare(sql).get(...p)||null,all:async(sql,...p)=>db.prepare(sql).all(...p),batch:async items=>{
  db.exec('BEGIN');try{const out=items.map(s=>({changes:Number(run(s.sql,...s.params).changes)}));db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}
 }};
 return {db,run,store};
}
test('client submits, admin approves with reply, own history is isolated and approval does not reserve donor',async()=>{
 const {db,store}=fixture();try{
  const {id}=await submitEggRequest(store,client,'donor','Please contact me',now);
  assert.equal((await listEggRequests(store,client))[0].status,'pending');
  assert.deepEqual(await listEggRequests(store,{...client,id:'other'}),[]);
  await decideEggRequest(store,admin,id,'approved','We will coordinate with the clinic',now);
  const rows=await listEggRequests(store,client);
  assert.equal(rows[0].reply,'We will coordinate with the clinic');
  assert.equal(rows[0].status,'approved');
  assert.ok(!JSON.stringify(rows).includes('PRIVATE-CONSENT'));
  assert.equal(db.prepare('SELECT status FROM donors').get().status,'available');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit').get().n,2);
 }finally{db.close()}
});
test('duplicate clicks create only one request and one submission audit',async()=>{
 const {db,store}=fixture();try{
  await submitEggRequest(store,client,'donor','',now);
  await assert.rejects(submitEggRequest(store,client,'donor','',now),/REQUEST_EXISTS/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM egg_requests').get().n,1);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit').get().n,1);
 }finally{db.close()}
});
test('revoked access blocks submission and approval; rejection still closes the pending request',async()=>{
 const {db,store,run}=fixture();try{
  const {id}=await submitEggRequest(store,client,'donor','',now);
  run('UPDATE directory_grants SET revoked_at=?',now);
  await assert.rejects(decideEggRequest(store,admin,id,'approved','ok',now),/SELECTION_NOT_ELIGIBLE/);
  await assert.rejects(submitEggRequest(store,client,'donor','',now),/SELECTION_NOT_ELIGIBLE/);
  await decideEggRequest(store,admin,id,'rejected','Access expired',now);
  assert.equal((await listEggRequests(store,client))[0].status,'rejected');
 }finally{db.close()}
});
test('unavailable donors, expired grants and suspended clients cannot submit',async()=>{
 for(const sql of ["UPDATE donors SET status='unavailable'","UPDATE donors SET kind='sperm'","UPDATE directory_grants SET expires_at='2026-09-01'","UPDATE profiles SET status='suspended' WHERE id='client'"]){
  const {db,store,run}=fixture();try{run(sql);await assert.rejects(submitEggRequest(store,client,'donor','',now),/SELECTION_NOT_ELIGIBLE/)}finally{db.close()}
 }
});
test('only owner client can withdraw; stale decisions cannot overwrite withdrawal or approval',async()=>{
 const {db,store}=fixture();try{
  const {id}=await submitEggRequest(store,client,'donor','',now);
  await assert.rejects(withdrawEggRequest(store,{...client,id:'other'},id,now),/STALE_RECORD/);
  await assert.rejects(decideEggRequest(store,client,id,'approved','ok',now),/FORBIDDEN/);
  await withdrawEggRequest(store,client,id,now);
  await assert.rejects(decideEggRequest(store,admin,id,'approved','ok',now),/STALE_RECORD/);
  const next=await submitEggRequest(store,client,'donor','retry',now);
  await decideEggRequest(store,admin,next.id,'approved','ok',now);
  await assert.rejects(decideEggRequest(store,admin,next.id,'rejected','later',now),/STALE_RECORD/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit').get().n,4);
 }finally{db.close()}
});
test('revocation between initial eligibility check and write blocks approval without a false audit event',async()=>{
 const {db,store,run}=fixture();try{
  const {id}=await submitEggRequest(store,client,'donor','',now);
  const original=store.batch;
  store.batch=async items=>{run('UPDATE directory_grants SET revoked_at=?',now);return original(items)};
  await assert.rejects(decideEggRequest(store,admin,id,'approved','ok',now),/SELECTION_NOT_ELIGIBLE/);
  assert.equal(db.prepare('SELECT status FROM egg_requests WHERE id=?').get(id).status,'pending');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM audit').get().n,1);
 }finally{db.close()}
});
