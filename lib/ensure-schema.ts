import {env} from 'cloudflare:workers';
import migrationSql from '../drizzle/0000_swift_jamie_braddock.sql?raw';

let ready:Promise<void>|null=null;

function migrationStatements(){
 return migrationSql
  .split(/-->\s*statement-breakpoint/)
  .map(s=>s.trim())
  .filter(Boolean);
}

export async function ensureSchema(){
 if(!ready)ready=(async()=>{
  const existing=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='profiles'").first();
  if(existing)return;
  const statements=migrationStatements();
  if(!statements.length)throw new Error('SCHEMA_MISSING');
  await env.DB.batch(statements.map(sql=>env.DB.prepare(sql)));
 })().catch(error=>{ready=null;throw error});
 await ready;
}
