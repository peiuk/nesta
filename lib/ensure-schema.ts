import {env} from 'cloudflare:workers';
import migration0 from '../drizzle/0000_swift_jamie_braddock.sql?raw';
import migration1 from '../drizzle/0001_email_auth.sql?raw';

let ready:Promise<void>|null=null;

function statements(sql:string){
 return sql.split(/-->\s*statement-breakpoint/).map(s=>s.trim()).filter(Boolean);
}

async function applyIfMissing(table:string,sql:string){
 const existing=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
 if(existing)return;
 const parts=statements(sql);
 if(!parts.length)throw new Error('SCHEMA_MISSING');
 await env.DB.batch(parts.map(s=>env.DB.prepare(s)));
}

export async function ensureSchema(){
 if(!ready)ready=(async()=>{
  await applyIfMissing('profiles',migration0);
  await applyIfMissing('email_otps',migration1);
 })().catch(error=>{ready=null;throw error});
 await ready;
}
