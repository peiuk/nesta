import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const sql=readFileSync(join(root,'drizzle/0000_swift_jamie_braddock.sql'),'utf8');
const sql1=readFileSync(join(root,'drizzle/0001_email_auth.sql'),'utf8');
const sql2=readFileSync(join(root,'drizzle/0002_donor_status_reason.sql'),'utf8');
const sql5=readFileSync(join(root,'drizzle/0005_case_plans.sql'),'utf8');
const sql6=readFileSync(join(root,'drizzle/0006_partners.sql'),'utf8');
const sql7=readFileSync(join(root,'drizzle/0007_case_documents.sql'),'utf8');
const sql8=readFileSync(join(root,'drizzle/0008_case_payments.sql'),'utf8');
const sql9=readFileSync(join(root,'drizzle/0009_faq_entries.sql'),'utf8');
const sql11=readFileSync(join(root,'drizzle/0011_notification_outbox.sql'),'utf8');
const sql12=readFileSync(join(root,'drizzle/0012_schema_migrations.sql'),'utf8');
const journal=JSON.parse(readFileSync(join(root,'drizzle/meta/_journal.json'),'utf8'));

const tables=[
 'profiles','cases','case_members','events','donors','directory_grants','favorites',
 'reports','report_recipients','questions','audit'
];

test('migration journal points at prepared schemas',()=>{
 assert.equal(journal.dialect,'sqlite');
 assert.equal(journal.entries.length,13);
 assert.equal(journal.entries[0].tag,'0000_swift_jamie_braddock');
 assert.equal(journal.entries[1].tag,'0001_email_auth');
 assert.equal(journal.entries[2].tag,'0002_donor_status_reason');
 assert.equal(journal.entries[3].tag,'0003_egg_requests');
 assert.equal(journal.entries[4].tag,'0004_donor_photos');
 assert.equal(journal.entries[5].tag,'0005_case_plans');
 assert.equal(journal.entries[6].tag,'0006_partners');
 assert.equal(journal.entries[7].tag,'0007_case_documents');
 assert.equal(journal.entries[8].tag,'0008_case_payments');
 assert.equal(journal.entries[9].tag,'0009_faq_entries');
 assert.equal(journal.entries[10].tag,'0010_otp_ip_limits');
 assert.equal(journal.entries[11].tag,'0011_notification_outbox');
 assert.equal(journal.entries[12].tag,'0012_schema_migrations');
});

test('notification outbox migration creates durable queue and due index',()=>{
 assert.match(sql11,/CREATE TABLE `notification_outbox`/);
 assert.match(sql11,/`dedupe_key` text NOT NULL UNIQUE/);
 assert.match(sql11,/CREATE INDEX `idx_notification_outbox_due`/);
});

test('schema migrations table records applied versions',()=>{
 assert.match(sql12,/CREATE TABLE `schema_migrations`/);
 assert.match(sql12,/`version` integer PRIMARY KEY/);
});

test('faq migration stores bilingual questions separately from client messages',()=>{
 assert.match(sql9,/CREATE TABLE `faq_entries`/);
 assert.match(sql9,/`question_zh` text NOT NULL/);
 assert.match(sql9,/`question_en` text NOT NULL/);
 assert.match(sql9,/`hidden` integer/);
 assert.match(sql9,/CREATE INDEX `idx_faq_entries_position`/);
});

test('payments migration records receipts separately from plan milestones',()=>{
 assert.match(sql8,/CREATE TABLE `case_payments`/);
 assert.match(sql8,/`paid_on` text NOT NULL/);
 assert.match(sql8,/`voucher` text/);
 assert.match(sql8,/ALTER TABLE `case_plans` ADD `currency`/);
 assert.match(sql8,/ALTER TABLE `case_plans` ADD `package_version`/);
});

test('case plans migration creates case_plans table',()=>{
 assert.match(sql5,/CREATE TABLE `case_plans`/);
 assert.match(sql5,/REFERENCES `cases`\(`id`\)/);
});

test('partners migration creates partners and extends cases',()=>{
 assert.match(sql6,/CREATE TABLE `partners`/);
 assert.match(sql6,/CREATE INDEX `idx_partners_kind_status`/);
 assert.match(sql6,/ALTER TABLE `cases` ADD `ivf_partner_id`/);
 assert.match(sql6,/ALTER TABLE `cases` ADD `postpartum_partner_id`/);
});

test('case documents migration creates table and backfills four kinds',()=>{
 assert.match(sql7,/CREATE TABLE `case_documents`/);
 assert.match(sql7,/PRIMARY KEY\(`case_id`, `kind`\)/);
 assert.match(sql7,/CREATE INDEX `idx_case_documents_case`/);
 assert.match(sql7,/INSERT OR IGNORE INTO `case_documents`/);
 assert.match(sql7,/'birth_certificate'/);
 assert.match(sql7,/'parentage'/);
 assert.match(sql7,/'notarisation'/);
 assert.match(sql7,/'apostille'/);
});

test('donor status_reason migration alters donors',()=>{
 assert.match(sql2,/ALTER TABLE `donors` ADD `status_reason` text/i);
});

test('email auth migration adds otp sessions and unique email',()=>{
 assert.match(sql1,/CREATE TABLE `email_otps`/);
 assert.match(sql1,/CREATE TABLE `auth_sessions`/);
 assert.match(sql1,/CREATE UNIQUE INDEX `idx_profiles_email`/);
 assert.match(sql1,/`salt` text NOT NULL/);
});

test('migration creates every application table',()=>{
 for(const name of tables)assert.match(sql,new RegExp(`CREATE TABLE \`${name}\``));
});

test('report workflow columns support draft review publish withdraw',()=>{
 assert.match(sql,/`status` text DEFAULT 'draft' NOT NULL/);
 assert.match(sql,/`uploaded_by` text NOT NULL/);
 assert.match(sql,/`reviewed_by` text/);
 assert.match(sql,/`review_note` text/);
 assert.match(sql,/`published_at` text/);
 assert.match(sql,/`object_key` text NOT NULL/);
 assert.match(sql,/`translation_key` text/);
 assert.match(sql,/CREATE TABLE `report_recipients`/);
});

test('directory grant columns support scope expiry and revocation',()=>{
 assert.match(sql,/CREATE TABLE `directory_grants`/);
 assert.match(sql,/`scope` text NOT NULL/);
 assert.match(sql,/`expires_at` text NOT NULL/);
 assert.match(sql,/`revoked_at` text/);
});

test('case membership is keyed by case and user',()=>{
 assert.match(sql,/CREATE TABLE `case_members`/);
 assert.match(sql,/PRIMARY KEY\(`case_id`, `user_id`\)/);
 assert.match(sql,/CREATE INDEX `idx_members_user`/);
});

test('profiles bootstrap pending clients until approval',()=>{
 assert.match(sql,/`role` text DEFAULT 'client' NOT NULL/);
 assert.match(sql,/`status` text DEFAULT 'pending' NOT NULL/);
 assert.match(sql,/`registered_at` text/);
});

test('migration splits into executable statements for ensureSchema',()=>{
 const statements=sql.split(/-->\s*statement-breakpoint/).map(s=>s.trim()).filter(Boolean);
 assert.ok(statements.length>=11);
 assert.ok(statements.some(s=>s.includes('CREATE TABLE `profiles`')));
 assert.ok(statements.every(s=>!s.includes('statement-breakpoint')));
});
