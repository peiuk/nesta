import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const sql=readFileSync(join(root,'drizzle/0000_swift_jamie_braddock.sql'),'utf8');
const sql1=readFileSync(join(root,'drizzle/0001_email_auth.sql'),'utf8');
const sql2=readFileSync(join(root,'drizzle/0002_donor_status_reason.sql'),'utf8');
const journal=JSON.parse(readFileSync(join(root,'drizzle/meta/_journal.json'),'utf8'));

const tables=[
 'profiles','cases','case_members','events','donors','directory_grants','favorites',
 'reports','report_recipients','questions','audit'
];

test('migration journal points at prepared schemas',()=>{
 assert.equal(journal.dialect,'sqlite');
 assert.equal(journal.entries.length,4);
 assert.equal(journal.entries[0].tag,'0000_swift_jamie_braddock');
 assert.equal(journal.entries[1].tag,'0001_email_auth');
 assert.equal(journal.entries[2].tag,'0002_donor_status_reason');
 assert.equal(journal.entries[3].tag,'0003_egg_requests');
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
