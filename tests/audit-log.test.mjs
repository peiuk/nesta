import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {readAudit} from '../lib/audit-log.ts';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec(readFileSync(new URL('../drizzle/0000_swift_jamie_braddock.sql',import.meta.url),'utf8'));
 const run=(sql,...args)=>db.prepare(sql).run(...args);
 run('INSERT INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)','ada','ada@test.invalid','Ada','admin','approved','2026-01-01T00:00:00.000Z');
 run('INSERT INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)','bea','bea@test.invalid','Bea','client','approved','2026-01-01T00:00:00.000Z');
 run('INSERT INTO cases (id,code,title,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?)','case-1','FL-1','Bea case','ada','2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');
 run('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)','old','ada','profile.update','bea','approved','2026-01-01T00:00:00.000Z');
 run('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)','case-row','ada','case.create','case-1','opened','2026-01-02T00:00:00.000Z');
 for(let i=0;i<100;i++)run('INSERT INTO audit (id,actor_id,action,target,reason,created_at) VALUES (?,?,?,?,?,?)','n'+i,'ada','event.create','case-1','tick','2026-02-01T00:00:'+String(i).padStart(2,'0')+'.000Z');
 return {db,query:{all:async(sql,...args)=>db.prepare(sql).all(...args),one:async(sql,...args)=>db.prepare(sql).get(...args)||null}};
}
test('audit search reaches past the newest 100 and labels people and cases',async()=>{
 const {db,query}=fixture();try{
  const latest=await readAudit(query,{});
  assert.equal(latest.length,100);
  assert.equal(latest.some(row=>row.id==='old'),false);
  const found=await readAudit(query,{action:'profile.update'});
  assert.deepEqual(found.map(row=>row.id),['old']);
  assert.equal(found[0].target_label,'Bea');
  assert.equal(found[0].actor_name,'Ada');
  const byCase=await readAudit(query,{target:'FL-1',action:'case.create'});
  assert.deepEqual(byCase.map(row=>row.id),['case-row']);
  assert.equal(byCase[0].target_label,'FL-1');
  const escaped=await readAudit(query,{action:'%'});
  assert.equal(escaped.length,0);
 }finally{db.close()}
});
