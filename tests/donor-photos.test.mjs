import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {listDonorPhotos,readDonorPhoto,uploadDonorPhotos,deleteDonorPhoto,validatePhotos} from '../lib/donor-photos.ts';

const owner={id:'owner',role:'admin',status:'approved'},client={id:'client',role:'client',status:'approved'};
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const photo=()=>({mime:'image/png',bytes:png});
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const migration of ['0000_swift_jamie_braddock','0004_donor_photos'])db.exec(readFileSync(new URL('../drizzle/'+migration+'.sql',import.meta.url),'utf8'));
 for(const a of [owner,client])db.prepare('INSERT INTO profiles(id,email,name,role,status,created_at) VALUES(?,?,?,?,?,?)').run(a.id,a.id+'@example.test',a.id,a.role,a.status,'2026-01-01');
 db.exec("INSERT INTO donors(id,code,kind,age,source,summary_zh,summary_en,verified_at,consent_ref,created_at) VALUES('donor','E-01','egg',25,'Partner','Summary','Summary','2026-01-01','Ref','2026-01-01'); INSERT INTO directory_grants VALUES('client','egg','2099-01-01',NULL,'test','owner')");
 const store={first:async(sql,...p)=>db.prepare(sql).get(...p)||null,all:async(sql,...p)=>db.prepare(sql).all(...p),batch:async items=>{db.exec('BEGIN');try{const results=items.map(s=>({changes:Number(db.prepare(s.sql).run(...s.params).changes)}));db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}};
 const objects=new Map(),storage={put:async(key,bytes)=>{objects.set(key,bytes)},delete:async key=>{objects.delete(key)}};
 return {db,store,objects,storage};
}
test('photo validation rejects documents, mismatched types, oversized files and batches',()=>{
 assert.doesNotThrow(()=>validatePhotos([photo(),photo()]));
 for(const entries of [[],[{mime:'application/pdf',bytes:png}],[{mime:'image/jpeg',bytes:png}],[{mime:'image/png',bytes:new Uint8Array(5*1024*1024+1)}],Array.from({length:11},photo)])assert.throws(()=>validatePhotos(entries));
 const large={mime:'image/png',bytes:new Uint8Array(5*1024*1024)};large.bytes.set(png);
 assert.throws(()=>validatePhotos(Array(5).fill(large)));
});
test('multiple photos persist in order without exposing storage keys or filenames',async()=>{
 const f=fixture();try{
  await uploadDonorPhotos(f.store,f.storage,owner,'donor',[photo(),photo()]);
  const rows=await listDonorPhotos(f.store,client,'donor');assert.equal(rows.length,2);assert.equal(f.objects.size,2);
  assert.deepEqual(Object.keys(rows[0]).sort(),['created_at','id']);
  const original=await readDonorPhoto(f.store,client,rows[0].id);assert.ok(f.objects.has(original.object_key));
  await assert.rejects(uploadDonorPhotos(f.store,f.storage,client,'donor',[photo()]),{code:'FORBIDDEN'});
  await assert.rejects(deleteDonorPhoto(f.store,f.storage,client,rows[0].id),{code:'FORBIDDEN'});
  await deleteDonorPhoto(f.store,f.storage,owner,rows[0].id);
  assert.equal((await listDonorPhotos(f.store,client,'donor'))[0].id,rows[1].id);assert.equal(f.objects.size,1);
  await assert.rejects(readDonorPhoto(f.store,client,rows[0].id),{code:'NOT_FOUND'});
 }finally{f.db.close()}
});
test('direct image access rechecks grants, scope, expiry, archive and account status',async()=>{
 const f=fixture();try{
  await uploadDonorPhotos(f.store,f.storage,owner,'donor',[photo()]);const [p]=await listDonorPhotos(f.store,client,'donor');
  for(const update of ["UPDATE directory_grants SET revoked_at='2026-01-01'","UPDATE directory_grants SET revoked_at=NULL,expires_at='2000-01-01'","UPDATE directory_grants SET expires_at='2099-01-01',scope='sperm'"]){f.db.exec(update);await assert.rejects(readDonorPhoto(f.store,client,p.id),{code:'DIRECTORY_LOCKED'})}
  f.db.exec("UPDATE directory_grants SET scope='egg'; UPDATE donors SET status='archived'");
  await assert.rejects(readDonorPhoto(f.store,client,p.id),{code:'NOT_FOUND'});
  assert.ok(await readDonorPhoto(f.store,owner,p.id));
  await assert.rejects(readDonorPhoto(f.store,{...owner,status:'suspended'},p.id),{code:'FORBIDDEN'});
 }finally{f.db.close()}
});
test('database enforces the ten-photo limit and failed writes remove newly stored objects',async()=>{
 const f=fixture();try{
  await uploadDonorPhotos(f.store,f.storage,owner,'donor',Array.from({length:10},photo));
  await assert.rejects(uploadDonorPhotos(f.store,f.storage,owner,'donor',[photo()]),{code:'PHOTO_LIMIT'});
  assert.equal(f.objects.size,10);
  assert.throws(()=>f.db.prepare("INSERT INTO donor_photos(id,donor_id,object_key,mime,size,uploaded_by,created_at) VALUES('extra','donor','private/extra','image/png',12,'owner','2026')").run(),/PHOTO_LIMIT/);
  const failed={...f.store,batch:async()=>{throw new Error('Database unavailable')}};
  await deleteDonorPhoto(f.store,f.storage,owner,(await listDonorPhotos(f.store,owner,'donor'))[0].id);
  await assert.rejects(uploadDonorPhotos(failed,f.storage,owner,'donor',[photo()]));assert.equal(f.objects.size,9);
 }finally{f.db.close()}
});
test('partial storage failures roll back all attempted uploads',async()=>{
 const f=fixture();try{
  let writes=0;const failing={...f.storage,put:async(key,bytes)=>{await f.storage.put(key,bytes);if(++writes===2)throw new Error('Storage unavailable')}};
  await assert.rejects(uploadDonorPhotos(f.store,failing,owner,'donor',[photo(),photo()]));
  assert.equal(f.objects.size,0);assert.equal((await listDonorPhotos(f.store,owner,'donor')).length,0);
 }finally{f.db.close()}
});
