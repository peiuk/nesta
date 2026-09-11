import {env} from 'cloudflare:workers';
import migration0 from '../drizzle/0000_swift_jamie_braddock.sql?raw';
import migration1 from '../drizzle/0001_email_auth.sql?raw';
import migration2 from '../drizzle/0002_donor_status_reason.sql?raw';
import migration3 from '../drizzle/0003_egg_requests.sql?raw';
import migration4 from '../drizzle/0004_donor_photos.sql?raw';
import migration5 from '../drizzle/0005_case_plans.sql?raw';
import migration6 from '../drizzle/0006_partners.sql?raw';
import migration7 from '../drizzle/0007_case_documents.sql?raw';
import {DOCUMENT_KINDS} from './documents';

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

async function seedMissingCaseDocuments(){
 const existing=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='case_documents'").first();
 if(!existing)return;
 const ts=new Date().toISOString();
 await env.DB.batch(DOCUMENT_KINDS.map(kind=>
  env.DB.prepare("INSERT OR IGNORE INTO case_documents (case_id,kind,status,status_date,notes,updated_at,updated_by) SELECT id, ?,'not_started', NULL, '', ?, NULL FROM cases").bind(kind,ts)
 ));
}

async function applyColumnIfMissing(table:string,column:string,sql:string){
 const rows=await env.DB.prepare(`PRAGMA table_info(${table})`).all<{name:string}>();
 if((rows.results||[]).some(r=>r.name===column))return;
 const parts=statements(sql);
 if(!parts.length)throw new Error('SCHEMA_MISSING');
 await env.DB.batch(parts.map(s=>env.DB.prepare(s)));
}

export async function ensureSchema(){
 if(!ready)ready=(async()=>{
  await applyIfMissing('profiles',migration0);
  await applyIfMissing('email_otps',migration1);
  await applyColumnIfMissing('donors','status_reason',migration2);
  await applyIfMissing('egg_requests',migration3);
  await applyIfMissing('donor_photos',migration4);
  await applyIfMissing('case_plans',migration5);
  await applyIfMissing('partners',migration6);
  await applyColumnIfMissing('cases','ivf_partner_id','ALTER TABLE `cases` ADD `ivf_partner_id` text REFERENCES `partners`(`id`);');
  await applyColumnIfMissing('cases','postpartum_partner_id','ALTER TABLE `cases` ADD `postpartum_partner_id` text REFERENCES `partners`(`id`);');
  await applyIfMissing('case_documents',migration7);
  await seedMissingCaseDocuments();
 })().catch(error=>{ready=null;throw error});
 await ready;
}
