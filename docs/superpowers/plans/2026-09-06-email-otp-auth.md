# 邮箱验证码登录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留 ChatGPT 登录的同时，增加邮箱 6 位 OTP 登录/建档，并用 HttpOnly 会话 Cookie 识别用户。

**Architecture:** 纯函数与哈希放在 `lib/email-auth.ts`；D1 增 `email_otps` / `auth_sessions` 与 `profiles.email` 唯一索引；`actor(request)` 先 ChatGPT 头、再会话 Cookie；未登录可调用 `auth/email/*` 与 `auth/logout`。发信走 Resend。UI 在 `SignIn` 增加 OTP 步骤，`/api/me` 返回 `sign_in`。

**Tech Stack:** Vinext/Cloudflare Worker、D1、Web Crypto、Resend HTTP API、现有 `api()` 客户端、`node --test`。

## Global Constraints

- 规格：`docs/superpowers/specs/2026-09-06-email-otp-auth-design.md`
- 无密码；ChatGPT 与邮箱并存；同规范化邮箱合并同一 `profiles`
- OTP TTL 10 分钟；会话约 14 天；Cookie `HttpOnly`、`SameSite=Lax`、生产 `Secure`
- 生产缺 `RESEND_API_KEY` / `SESSION_SECRET` 不可静默成功
- 响应不泄露邮箱是否已注册（request 一律 `{ok:true}` 成功路径）
- 分支：`main`；提交用 PowerShell 友好的 `git commit -m "..."`（勿用 bash HEREDOC）
- 验证：相关 `node --test`、`npx tsc --noEmit`

## File Structure

| 文件 | 责任 |
| --- | --- |
| `lib/email-auth.ts`（新建） | 规范化、id、OTP/会话哈希、限流常量、发信、Cookie 读写辅助 |
| `tests/email-auth.test.mjs`（新建） | 纯函数单测 |
| `db/schema.ts`、`drizzle/0001_email_auth.sql`、`drizzle/meta/_journal.json` | 表结构 |
| `lib/ensure-schema.ts` | 增量应用 0001 |
| `lib/server.ts`、`app/api/[...path]/route.ts` | actor + auth 路由 |
| `components/product/registration.tsx`、`portal.tsx`、`common.tsx` | UI / 错误文案 / 退出 |
| `app/privacy/page.tsx`、`env.d.ts`、handoff | 文案与环境变量 |

---

### Task 1: OTP / 邮箱纯函数（TDD）

**Files:**
- Create: `lib/email-auth.ts`
- Create: `tests/email-auth.test.mjs`

**Interfaces:**
- Produces:
  - `normalizeEmail(raw:string):string|null`
  - `emailProfileId(normalizedEmail:string):Promise<string>` → ``email:${first32HexOfSha256}``
  - `hashSecret(secret:string,pepper:string):Promise<{salt:string;hash:string}>`
  - `verifySecret(secret:string,pepper:string,salt:string,hash:string):Promise<boolean>`
  - `generateOtpCode():string`（6 位数字）
  - 常量：`OTP_TTL_MS=10*60*1000`、`SESSION_TTL_MS=14*24*60*60*1000`、`COOKIE_NAME='firstleaf_session'`、`OTP_MAX_ATTEMPTS=5`

- [ ] **Step 1: 写失败测试**

`tests/email-auth.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEmail,emailProfileId,hashSecret,verifySecret,generateOtpCode} from '../lib/email-auth.ts';

test('normalizeEmail trims and lowercases valid addresses',()=>{
 assert.equal(normalizeEmail('  Ada@Example.COM '),'ada@example.com');
 assert.equal(normalizeEmail('not-an-email'),null);
 assert.equal(normalizeEmail(''),null);
});

test('emailProfileId is stable and prefixed',async()=>{
 const a=await emailProfileId('ada@example.com');
 const b=await emailProfileId('ada@example.com');
 assert.equal(a,b);
 assert.match(a,/^email:[0-9a-f]{32}$/);
 assert.notEqual(a,await emailProfileId('bob@example.com'));
});

test('hashSecret verifies and rejects wrong codes',async()=>{
 const pepper='test-pepper';
 const {salt,hash}=await hashSecret('123456',pepper);
 assert.equal(await verifySecret('123456',pepper,salt,hash),true);
 assert.equal(await verifySecret('000000',pepper,salt,hash),false);
});

test('generateOtpCode is six digits',()=>{
 for(let i=0;i<20;i++)assert.match(generateOtpCode(),/^\d{6}$/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test tests/email-auth.test.mjs`  
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现 `lib/email-auth.ts`**

```ts
export const OTP_TTL_MS=10*60*1000;
export const SESSION_TTL_MS=14*24*60*60*1000;
export const COOKIE_NAME='firstleaf_session';
export const OTP_MAX_ATTEMPTS=5;
export const OTP_RESEND_MS=60*1000;

const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw:string){
 const s=raw.trim().toLowerCase();
 if(!s||s.length>254||!emailRe.test(s)||s.includes('\u0000'))return null;
 return s;
}

function hex(buf:ArrayBuffer){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}

export async function emailProfileId(normalizedEmail:string){
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizedEmail));
 return 'email:'+hex(dig).slice(0,32);
}

export function generateOtpCode(){
 const n=crypto.getRandomValues(new Uint32Array(1))[0]%1000000;
 return String(n).padStart(6,'0');
}

export async function hashSecret(secret:string,pepper:string){
 const salt=hex(crypto.getRandomValues(new Uint8Array(16)).buffer);
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${pepper}:${salt}:${secret}`));
 return {salt,hash:hex(dig)};
}

export async function verifySecret(secret:string,pepper:string,salt:string,hash:string){
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${pepper}:${salt}:${secret}`));
 const next=hex(dig);
 if(next.length!==hash.length)return false;
 let diff=0;for(let i=0;i<next.length;i++)diff|=next.charCodeAt(i)^hash.charCodeAt(i);
 return diff===0;
}
```

- [ ] **Step 4: 测试通过**

Run: `node --test tests/email-auth.test.mjs`  
Expected: pass 4

- [ ] **Step 5: 提交**

```powershell
git add lib/email-auth.ts tests/email-auth.test.mjs
git commit -m "feat: add email OTP crypto helpers"
```

---

### Task 2: D1 迁移与 ensureSchema 增量

**Files:**
- Modify: `db/schema.ts`
- Create: `drizzle/0001_email_auth.sql`
- Modify: `drizzle/meta/_journal.json`
- Modify: `lib/ensure-schema.ts`
- Modify: `tests/migration.test.mjs`（断言新表名出现在 0001）

**Interfaces:**
- Produces: 表 `email_otps`、`auth_sessions`；`profiles.email` 唯一索引 `idx_profiles_email`
- `ensureSchema()`：若无 `email_otps` 则执行 0001（已有 profiles 的库也能升级）

- [ ] **Step 1: 写 SQL 迁移**

`drizzle/0001_email_auth.sql`：

```sql
CREATE TABLE `email_otps` (
	`email` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`salt` text NOT NULL,
	`expires_at` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`request_ip` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user` ON `auth_sessions` (`user_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_email` ON `profiles` (`email`);
```

（若线上已有重复 email，唯一索引会失败——私密试用可接受；在 handoff 注明。）

- [ ] **Step 2: 更新 journal**

在 `drizzle/meta/_journal.json` 的 `entries` 追加：

```json
{
  "idx": 1,
  "version": "6",
  "when": 1788720000000,
  "tag": "0001_email_auth",
  "breakpoints": true
}
```

- [ ] **Step 3: 更新 `db/schema.ts`**

在 `profiles` 的表回调中加 `uniqueIndex('idx_profiles_email').on(t.email)`。文件末尾新增：

```ts
export const emailOtps=sqliteTable('email_otps',{email:text('email').primaryKey(),codeHash:text('code_hash').notNull(),salt:text('salt').notNull(),expiresAt:text('expires_at').notNull(),attempts:integer('attempts').notNull().default(0),createdAt:text('created_at').notNull(),requestIp:text('request_ip').notNull().default('')});
export const authSessions=sqliteTable('auth_sessions',{id:text('id').primaryKey(),userId:text('user_id').notNull().references(()=>profiles.id),tokenHash:text('token_hash').notNull(),expiresAt:text('expires_at').notNull(),createdAt:text('created_at').notNull()},t=>[index('idx_auth_sessions_user').on(t.userId)]);
```

- [ ] **Step 4: 改 `ensure-schema.ts`**

```ts
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
```

- [ ] **Step 5: 扩展 migration 测试**

在 `tests/migration.test.mjs` 增加对 `0001_email_auth.sql` 的读入与断言含 `email_otps`、`auth_sessions`、`idx_profiles_email`。

- [ ] **Step 6: 运行测试并提交**

Run: `node --test tests/migration.test.mjs tests/email-auth.test.mjs`  
Expected: 全过

```powershell
git add db/schema.ts drizzle/0001_email_auth.sql drizzle/meta/_journal.json lib/ensure-schema.ts tests/migration.test.mjs
git commit -m "feat: add email OTP and session tables"
```

---

### Task 3: actor 会话解析 + auth API

**Files:**
- Modify: `lib/email-auth.ts`（追加 cookie / send / 业务编排，可依赖 server 的 db 辅助——**避免循环依赖**：编排放 `lib/server-auth.ts` 或继续扩 `email-auth` 仅纯函数，DB 逻辑放 `lib/server.ts`）
- Modify: `lib/server.ts`
- Modify: `app/api/[...path]/route.ts`
- Modify: `env.d.ts`
- Modify: `components/product/common.tsx`（错误文案）

**推荐拆分：** `lib/server.ts` 内增加 `resolveActor(request)`、`handleAuth(path,request)`；cookie 解析纯函数仍在 `email-auth.ts`。

**Interfaces:**
- `actor(request:Request):Promise<{profile:Profile;sign_in:'chatgpt'|'email'}>` 或 `actor` 返回 Profile 且用 AsyncLocal / 同请求字段——**规格要求 me 带 `sign_in`**：让 `actor` 返回 `Profile`，并另设 `let lastSignIn` 不优雅。更好：

```ts
export type AuthContext={profile:Profile;sign_in:'chatgpt'|'email'};
export async function authenticate(request:Request):Promise<AuthContext>
```

将原 `actor()` 替换为 `authenticate`，或 `actor` 仍返回 Profile、`authenticate` 供 route 使用。计划采用：

- `export async function authenticate(request:Request):Promise<AuthContext>`
- 保留 `export async function actor(request:Request)` 作为 `authenticate(request).then(x=>x.profile)` 以减少改动面；`read('me')` 改为接收 `AuthContext` 或额外参数。

最小改动：`handle` 里 `const auth=await authenticate(request)`，`read/write` 增加可选 `sign_in`，仅 `me` 使用。

- [ ] **Step 1: `env.d.ts` 增加**

```ts
SESSION_SECRET?: string;
RESEND_API_KEY?: string;
EMAIL_FROM?: string;
```

- [ ] **Step 2: `email-auth.ts` 追加 cookie 解析**

```ts
export function parseSessionCookie(header:string|null){
 if(!header)return null;
 const part=header.split(/;\s*/).find(x=>x.startsWith(COOKIE_NAME+'='));
 if(!part)return null;
 const raw=decodeURIComponent(part.slice(COOKIE_NAME.length+1));
 const i=raw.indexOf('.');
 if(i<=0)return null;
 return {sessionId:raw.slice(0,i),token:raw.slice(i+1)};
}

export function sessionCookieValue(sessionId:string,token:string){
 return `${COOKIE_NAME}=${encodeURIComponent(`${sessionId}.${token}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS/1000)}`;
}

export function clearSessionCookie(){
 return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
```

（生产在 `server` 组装 Cookie 时追加 `Secure`。）

- [ ] **Step 3: 实现 `authenticate` 与 auth 写路径**

在 `lib/server.ts`（摘要，实现时写全）：

```ts
export type AuthContext={profile:Profile;sign_in:'chatgpt'|'email'};

export async function authenticate(request:Request):Promise<AuthContext>{
 await ensureSchema();
 const identity=await getChatGPTUser();
 if(identity){
  const email=identity.email.trim().toLowerCase();
  const isOwner=!!env.ADMIN_EMAIL&&email===env.ADMIN_EMAIL.trim().toLowerCase();
  await statement('INSERT OR IGNORE INTO profiles (id,email,name,role,status,created_at) VALUES (?,?,?,?,?,?)',identity.userId,email,identity.displayName,isOwner?'admin':'client',isOwner?'approved':'pending',now()).run();
  if(isOwner)await statement("UPDATE profiles SET role='admin',status='approved',email=? WHERE id=?",email,identity.userId).run();
  const profile=await one<Profile>('SELECT * FROM profiles WHERE id=?',identity.userId);if(!profile)fail(503,'SERVICE_UNAVAILABLE');
  return {profile,sign_in:'chatgpt'};
 }
 const pepper=env.SESSION_SECRET;if(!pepper)fail(401,'SIGN_IN_REQUIRED');
 const parsed=parseSessionCookie(request.headers.get('cookie'));if(!parsed)fail(401,'SIGN_IN_REQUIRED');
 const row=await one<{id:string;user_id:string;token_hash:string;salt:string;expires_at:string}>('SELECT * FROM auth_sessions WHERE id=?',parsed.sessionId);
 // 若表无 salt 列：token_hash 使用 hashSecret 存 salt+hash 两列——迁移已有 salt 在 otp；会话用同样 salt 列：补迁移或把 salt 拼进 token_hash 格式 salt:hash
 ...
}
```

**会话存储约定（锁定）：** `auth_sessions` 增加 `salt` 列（与 OTP 一致）。若 Task 2 SQL 无 `salt`，在本任务补进 0001：

```sql
`salt` text NOT NULL,
```

校验：`verifySecret(parsed.token,pepper,row.salt,row.token_hash)` 且 `expires_at > now`；否则删会话并 `401`。

- [ ] **Step 4: `handleAuth`**

路径：
- `POST auth/email/request` — mutateRequest；normalizeEmail；限流；写 otp；发信；`response({ok:true})`
- `POST auth/email/verify` — 校验；upsert profile by email；建 session；`Set-Cookie` + `{ok:true}`
- `POST auth/logout` — 可选登录；清会话与 Cookie；`{ok:true}`

发信：

```ts
async function sendOtpEmail(to:string,code:string){
 if(!env.RESEND_API_KEY||!env.EMAIL_FROM){
  if(env.SITE_ORIGIN?.includes('localhost')||!env.RESEND_API_KEY){console.info('[firstleaf-otp]',to,code);return}
  fail(503,'SERVICE_UNAVAILABLE');
 }
 const res=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject:'Firstleaf login code',text:`Your Firstleaf login code is ${code}. It expires in 10 minutes. Private pilot — test data only.`})});
 if(!res.ok)fail(503,'SERVICE_UNAVAILABLE');
}
```

（本地无 key 时打日志；生产无 key → 503。）

限流：读 `email_otps.created_at`，若 `< OTP_RESEND_MS` → `429 TOO_MANY_REQUESTS`。

- [ ] **Step 5: 改 `route.ts`**

```ts
import {authenticate,read,write,response,AppError,handleAuth} from '@/lib/server';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context){
 try{
  const {path}=await context.params;
  if(path[0]==='auth')return await handleAuth(path.slice(1),request);
  const auth=await authenticate(request);
  return request.method==='GET'?await read(path,auth,request):await write(path,auth.profile,request);
 }catch(error){
  if(error instanceof AppError)return response({error:error.code},error.status);
  console.error('Firstleaf request failed',error instanceof Error?error.message:'Unknown error');
  return response({error:'SERVICE_UNAVAILABLE'},503);
 }
}
export const GET=handle;export const POST=handle;
```

`read` 签名改为 `(path,auth:AuthContext,request)`；`me` 返回 `{profile,sign_in:auth.sign_in}`；其余用 `auth.profile`。

把原 `actor()` 调用全部改为 `auth.profile`；删除旧无 request 的 `actor` 或令其 `fail` 弃用。

- [ ] **Step 6: `common.tsx` 错误文案**

追加：`INVALID_EMAIL`、`OTP_INVALID`、`OTP_EXPIRED`、`TOO_MANY_REQUESTS`（若尚未有）的中英对。

- [ ] **Step 7: tsc + 测试 + 提交**

```powershell
node --test tests/email-auth.test.mjs tests/policy.test.mjs tests/migration.test.mjs
npx tsc --noEmit
git add lib/server.ts lib/email-auth.ts app/api/[...path]/route.ts env.d.ts components/product/common.tsx drizzle/0001_email_auth.sql
git commit -m "feat: authenticate via email OTP session or ChatGPT"
```

---

### Task 4: 登录 UI、退出、隐私文案

**Files:**
- Modify: `components/product/registration.tsx`（`SignIn`）
- Modify: `components/product/portal.tsx`（退出；`me` 含 `sign_in`）
- Modify: `app/privacy/page.tsx`

**Interfaces:**
- Consumes: `POST auth/email/request|verify`、`POST auth/logout`；`me.sign_in`
- Produces: 双路径登录 UI；邮箱会话退出清 Cookie

- [ ] **Step 1: 扩展 `SignIn`**

在 ChatGPT 按钮下增加：

```tsx
// 状态：email, code, phase: 'email'|'code', busy via ActionForm
// phase email: Field email + submit 发送验证码 -> api('auth/email/request',{email}) -> setPhase('code')
// phase code: Field code + submit -> api('auth/email/verify',{email,code}) -> location.assign('/portal') 或 done callback
```

因 `api()` 已带 credentials `same-origin`，Cookie 会保存。验证成功后 `window.location.href='/portal'` 或父级刷新。

文案：`或使用邮箱验证码` / `发送验证码` / `登录`；说明同邮箱合并档案。

- [ ] **Step 2: Portal 退出**

`useResource('me')` 读取 `sign_in`（若 API 把 sign_in 放在顶层，portal 需读 `data.sign_in`）。

```tsx
const signIn=data.sign_in==='email'?'email':'chatgpt';
// 退出：email -> await api('auth/logout',{}) then location=/ 
// chatgpt -> <a href={SIGN_OUT}>
```

Shell 传入 `signIn` 或在 Portal 内处理。

- [ ] **Step 3: 隐私页**

「登录与档案」段追加邮箱验证码说明（中英 `t()`）。

- [ ] **Step 4: 提交**

```powershell
git add components/product/registration.tsx components/product/portal.tsx app/privacy/page.tsx
git commit -m "feat: add email OTP sign-in UI and logout path"
```

---

### Task 5: 部署说明与收尾验证

**Files:**
- Modify: `docs/superpowers/handoff-2026-09-06-sites-deploy.md`（若存在则更新；否则改 `docs/implementation.md` 备注）
- Modify: `docs/implementation.md`（架构句：ChatGPT 或邮箱 OTP，仍无密码）

- [ ] **Step 1: handoff 表增加** `SESSION_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM`

- [ ] **Step 2: 全量验证**

Run: `node --test tests/*.mjs; npx tsc --noEmit`  
Expected: 全过、tsc 零错误

- [ ] **Step 3: 提交**

```powershell
git add docs/implementation.md docs/superpowers/handoff-2026-09-06-sites-deploy.md
git commit -m "docs: document email OTP env and dual sign-in"
```

---

## 计划自检结论

- **规格覆盖：** 身份顺序 → Task 3；OTP request/verify/限流/发信 → Task 3；会话 Cookie → Task 3；表与 ensureSchema → Task 2；UI/隐私/退出 → Task 4；环境变量 → Task 3+5；纯函数测试 → Task 1；合并同邮箱 → Task 3 verify。
- **占位扫描：** 无 TBD；Task 3 给出关键签名与 Cookie/会话 salt 约定。
- **类型一致：** `AuthContext`、`COOKIE_NAME`、`emailProfileId` 前缀、`auth/email/*` 路径在任务间一致。
- **路由注意：** `auth/*` 必须在调用 `authenticate` 之前分支，否则无法未登录发码。
