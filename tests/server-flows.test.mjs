import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,existsSync} from 'node:fs';
import {registerHooks} from 'node:module';
import ts from 'typescript';

// Real login and payment handlers on SQLite; no mail provider, so codes go to console.info (local dev path).
const origin='http://localhost:5173';
const env={SITE_ORIGIN:origin,SESSION_SECRET:'test-secret',ADMIN_EMAIL:'owner@example.invalid'};
globalThis.__serverFlowsEnv=env;
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
  if(url==='test:workers')return {format:'module',source:'export const env=globalThis.__serverFlowsEnv;',shortCircuit:true};
  if(url.endsWith('.sql?raw'))return {format:'module',source:`export default ${JSON.stringify(readFileSync(new URL(url.slice(0,-4)),'utf8'))}`,shortCircuit:true};
  if(url.endsWith('.ts'))return {format:'module',source:ts.transpileModule(readFileSync(new URL(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
  return next(url,context);
 }
});

// One database for the file: ensureSchema caches per process.
const db=new DatabaseSync(':memory:');
const run=(sql,...args)=>db.prepare(sql).run(...args);
const prepare=(sql,args=[])=>({bind:(...values)=>prepare(sql,values),first:async()=>db.prepare(sql).get(...args)||null,all:async()=>({results:db.prepare(sql).all(...args)}),run:async()=>({meta:{changes:Number(run(sql,...args).changes)}})});
env.DB={prepare,batch:async statements=>{db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results}catch(e){db.exec('ROLLBACK');throw e}}};
const {handleAuth,write}=await import('../lib/server.ts');
const {ensureSchema}=await import('../lib/ensure-schema.ts');
await ensureSchema();

const codes=new Map();
console.info=(_tag,to,text)=>{const m=/code is (\d{6})/.exec(String(text));if(m)codes.set(to,m[1])};
let ipCounter=0;
const post=(path,body,headers={})=>new Request(`${origin}/api/${path}`,{method:'POST',headers:{origin,'x-firstleaf':'firstleaf','content-type':'application/json','cf-connecting-ip':`10.0.0.${++ipCounter}`,...headers},body:JSON.stringify(body)});
const requestCode=async email=>{await handleAuth(['email','request'],post('auth/email/request',{email}));return codes.get(email)};
const verify=(email,code)=>handleAuth(['email','verify'],post('auth/email/verify',{email,code}));
const wrong=code=>String((Number(code)+1)%1000000).padStart(6,'0');
const outcome=p=>p.then(r=>r.status,e=>e.code);

test('parallel guesses each spend an attempt, so a sixth guess is refused even if right',async()=>{
 const email='parallel@example.invalid';const code=await requestCode(email);
 const results=await Promise.all([...Array(5)].map(()=>outcome(verify(email,wrong(code)))).concat(outcome(verify(email,code))));
 assert.deepEqual(results,['OTP_INVALID','OTP_INVALID','OTP_INVALID','OTP_INVALID','OTP_INVALID','OTP_EXPIRED']);
 assert.equal(await outcome(verify(email,code)),'OTP_EXPIRED');
});

test('a code signs in once, even when submitted twice at the same time',async()=>{
 const email='once@example.invalid';const code=await requestCode(email);
 const results=await Promise.all([outcome(verify(email,code)),outcome(verify(email,code))]);
 assert.deepEqual(results.map(String).sort((a,b)=>a.localeCompare(b)),['200','OTP_INVALID']);
 assert.equal(await outcome(verify(email,code)),'OTP_INVALID');
});

test('resending a code does not reset spent attempts while the old code is live',async()=>{
 const email='resend@example.invalid';const first=await requestCode(email);
 for(let i=0;i<5;i++)assert.equal(await outcome(verify(email,wrong(first))),'OTP_INVALID');
 run('UPDATE email_otps SET created_at=? WHERE email=?','2000-01-01T00:00:00.000Z',email);
 const second=await requestCode(email);
 assert.equal(await outcome(verify(email,second)),'OTP_EXPIRED');
 // Once that code expires, a new request starts a fresh budget.
 run('UPDATE email_otps SET created_at=?,expires_at=? WHERE email=?','2000-01-01T00:00:00.000Z','2000-01-01T00:10:00.000Z',email);
 const third=await requestCode(email);
 assert.equal(await outcome(verify(email,third)),200);
});

test('a receipt must use its plan currency, and needs a plan',async()=>{
 const stamp='2026-11-18T10:00:00.000Z',owner={id:'owner',role:'admin',status:'approved'};
 run('INSERT INTO profiles(id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)','owner','owner@example.invalid','owner','admin','approved',stamp);
 for(const id of ['planned','unplanned']){
  run('INSERT INTO cases(id,code,title,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?)',id,id,id,'owner',stamp,stamp);
  run('INSERT INTO case_members VALUES (?,?,?,?)',id,'owner','coordinator',stamp);
 }
 run("INSERT INTO case_plans(case_id,tier,total_usd,currency,milestones_json,updated_at,updated_by) VALUES ('planned','b',520000,'CNY','[]',?,'owner')",stamp);
 const pay=(caseId,currency)=>outcome(write(['cases',caseId,'payments'],owner,post(`cases/${caseId}/payments`,{amount:10000,currency,paid_on:'2026-11-18',voucher:'V1',reason:'test'})));
 assert.equal(await pay('planned','USD'),'INVALID_INPUT');
 assert.equal(await pay('unplanned','CNY'),'INVALID_INPUT');
 assert.equal(await pay('planned','CNY'),200);
 assert.deepEqual(db.prepare('SELECT case_id,currency,amount FROM case_payments').all().map(r=>({...r})),[{case_id:'planned',currency:'CNY',amount:10000}]);
});
