import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {directoryQuery} from '../lib/directory-query.ts';

test('admin receives consent reference for editing, client projection omits it and archived records',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(readFileSync(new URL('../drizzle/0000_swift_jamie_braddock.sql',import.meta.url),'utf8'));
  db.exec(readFileSync(new URL('../drizzle/0002_donor_status_reason.sql',import.meta.url),'utf8'));
  const insert=db.prepare('INSERT INTO donors (id,code,kind,age,source,summary_zh,summary_en,status,verified_at,consent_ref,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  for(const status of ['available','archived'])insert.run(status,status,'egg',28,'Partner','Summary','Summary',status,'2026-09-01','CONSENT-42','2026-09-01');
  const adminRows=db.prepare(directoryQuery(true)).all('owner','egg');
  assert.equal(adminRows.length,2);
  assert.equal(adminRows[0].consent_ref,'CONSENT-42');
  const clientRows=db.prepare(directoryQuery(false)).all('client','egg');
  assert.equal(clientRows.length,1);
  assert.equal(clientRows[0].code,'available');
  assert.ok(!Object.hasOwn(clientRows[0],'consent_ref'));
  assert.equal(db.prepare(directoryQuery(true)).all('owner','sperm').length,0);
 }finally{db.close()}
});
