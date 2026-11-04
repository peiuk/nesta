# 精卵库运营加强（C1）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 资料库前端筛选（状态/收藏/血型/年龄）、供者 `status_reason` 落库展示、人员行与案件详情一键资料库授权。

**Architecture:** Approach A——Directory 对现有 `/api/directory` 结果做客户端过滤（纯函数可测）；`donors.status_reason` 小迁移 + `ensureSchema` 按列增量；`POST /api/donors/:id` 改状态时写入/清空理由；授权复用 `POST /api/grants`，抽出可预填 `userId` 的 `GrantForm`。

**Tech Stack:** Vinext/Cloudflare Worker、D1、现有 portal UI、`node --test`、`tsc`。

## Global Constraints

- 规格：`docs/superpowers/specs/2026-09-07-directory-ops-c1-design.md`
- 不新增授权 API；不服务端分页筛选；不做供者↔案件硬绑定
- 非管理员仍不看 `archived`
- 分支：`main`；提交用 PowerShell 友好的 `git commit -m "..."`（勿用 bash HEREDOC）；**仅在用户要求时 commit**
- 验证：相关 `node --test`、`npx tsc --noEmit`

## File Structure

| 文件 | 责任 |
| --- | --- |
| `drizzle/0002_donor_status_reason.sql` | `ALTER TABLE donors ADD status_reason` |
| `drizzle/meta/_journal.json` | 登记 0002 |
| `db/schema.ts` | `statusReason` 列 |
| `lib/ensure-schema.ts` | 按列增量应用 0002 |
| `lib/directory-filters.ts`（新建） | 纯函数过滤供者列表 |
| `tests/directory-filters.test.mjs`（新建） | 过滤单测 |
| `tests/migration.test.mjs` | 断言 0002 / journal |
| `lib/server.ts` | SELECT + 状态更新写 `status_reason` |
| `components/product/portal.tsx` | 筛选 UI、理由展示、GrantForm 预填、People/Case 入口 |

---

### Task 1: `status_reason` 迁移与 ensureSchema

**Files:**
- Create: `drizzle/0002_donor_status_reason.sql`
- Modify: `drizzle/meta/_journal.json`
- Modify: `db/schema.ts`
- Modify: `lib/ensure-schema.ts`
- Modify: `tests/migration.test.mjs`

**Interfaces:**
- Produces: D1 列 `donors.status_reason`（TEXT NULL）；`ensureSchema` 对已有库 `ALTER` 一次

- [ ] **Step 1: 写失败单测（journal + SQL 内容）**

在 `tests/migration.test.mjs` 增加：

```js
const sql2=readFileSync(join(root,'drizzle/0002_donor_status_reason.sql'),'utf8');

test('migration journal includes donor status_reason',()=>{
 assert.equal(journal.entries.length,3);
 assert.equal(journal.entries[2].tag,'0002_donor_status_reason');
});

test('donor status_reason migration alters donors',()=>{
 assert.match(sql2,/ALTER TABLE `donors` ADD `status_reason` text/i);
});
```

- [ ] **Step 2: 跑测确认失败**

Run: `node --test tests/migration.test.mjs`
Expected: FAIL（缺文件 / journal 仍为 2）

- [ ] **Step 3: 添加迁移与 schema**

`drizzle/0002_donor_status_reason.sql`:

```sql
ALTER TABLE `donors` ADD `status_reason` text;
```

`db/schema.ts` 的 `donors` 表增加：`statusReason:text('status_reason')`（可空，无 default）。

`drizzle/meta/_journal.json`：`entries` 追加一条 `idx:2`、`tag:"0002_donor_status_reason"`（其余字段仿照 0001）。

- [ ] **Step 4: ensureSchema 按列增量**

在 `lib/ensure-schema.ts`：

```ts
import migration2 from '../drizzle/0002_donor_status_reason.sql?raw';

async function applyColumnIfMissing(table:string,column:string,sql:string){
 const rows=await env.DB.prepare(`PRAGMA table_info(${table})`).all<{name:string}>();
 if((rows.results||[]).some(r=>r.name===column))return;
 const parts=statements(sql);
 if(!parts.length)throw new Error('SCHEMA_MISSING');
 await env.DB.batch(parts.map(s=>env.DB.prepare(s)));
}

// inside ensureSchema ready:
await applyIfMissing('profiles',migration0);
await applyIfMissing('email_otps',migration1);
await applyColumnIfMissing('donors','status_reason',migration2);
```

- [ ] **Step 5: 跑测通过**

Run: `node --test tests/migration.test.mjs`
Expected: PASS

---

### Task 2: 服务端写读 `status_reason`

**Files:**
- Modify: `lib/server.ts`（directory SELECT；`donors/:id` 状态分支）

**Interfaces:**
- Consumes: 列 `status_reason`
- Produces: directory 载荷含 `status_reason`；改状态时 `unavailable`/`archived` 写入 reason，`available`/`matching` 置 `NULL`

- [ ] **Step 1: 扩展 SELECT**

将 directory 查询中的列列表加入 `d.status_reason`（紧挨 `d.status` 即可）。

- [ ] **Step 2: 状态更新**

状态分支改为：

```ts
const status=choice(b.status,['available','matching','unavailable','archived']);
const reason=text(b.reason,500);
const statusReason=(status==='unavailable'||status==='archived')?reason:null;
await db().batch([
 statement('UPDATE donors SET status=?,status_reason=? WHERE id=?',status,statusReason,path[1]),
 auditStatement(a,'donor.status',path[1],reason)
]);
return response({ok:true});
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无 error

---

### Task 3: 资料库筛选纯函数 + UI + 理由展示

**Files:**
- Create: `lib/directory-filters.ts`
- Create: `tests/directory-filters.test.mjs`
- Modify: `components/product/portal.tsx`（`Directory`、`DonorCard`、改状态 Modal 提示）

**Interfaces:**
- Produces: `filterDonors(donors, filters) => donors`
- Filters shape: `{ status:'all'|string, favoriteOnly:boolean, blood:'all'|string, ageMin:string, ageMax:string }`

- [ ] **Step 1: 写失败单测**

`lib/directory-filters.ts` 先不存在；`tests/directory-filters.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDonors} from '../lib/directory-filters.ts';

const sample=[
 {id:'1',status:'available',favorite:1,blood_group:'A',age:28},
 {id:'2',status:'matching',favorite:0,blood_group:'B',age:32},
 {id:'3',status:'unavailable',favorite:1,blood_group:'A',age:40},
 {id:'4',status:'archived',favorite:0,blood_group:'O',age:25},
];

test('filters by status favorite blood and age',()=>{
 const out=filterDonors(sample,{status:'available',favoriteOnly:true,blood:'A',ageMin:'20',ageMax:'30'});
 assert.deepEqual(out.map(d=>d.id),['1']);
});

test('all empty means no filter',()=>{
 assert.equal(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'',ageMax:''}).length,4);
});
```

若仓库对 `.ts` 导入测例有既有模式，跟随 `email-auth` 测例的导入方式（必要时改为相对编译产物或 `node --experimental-strip-types`）。

- [ ] **Step 2: 跑测确认失败**

Run: `node --test tests/directory-filters.test.mjs`（或项目惯用命令）
Expected: FAIL module not found

- [ ] **Step 3: 实现 `filterDonors`**

```ts
export type DonorFilter={status:string;favoriteOnly:boolean;blood:string;ageMin:string;ageMax:string};

export function filterDonors<T extends {status:unknown;favorite?:unknown;blood_group?:unknown;age?:unknown}>(
 donors:T[],f:DonorFilter
):T[]{
 return donors.filter(d=>{
  if(f.status!=='all'&&String(d.status)!==f.status)return false;
  if(f.favoriteOnly&&Number(d.favorite)!==1)return false;
  if(f.blood!=='all'&&String(d.blood_group||'')!==f.blood)return false;
  const age=Number(d.age);
  if(f.ageMin!==''&&(!Number.isFinite(age)||age<Number(f.ageMin)))return false;
  if(f.ageMax!==''&&(!Number.isFinite(age)||age>Number(f.ageMax)))return false;
  return true;
 });
}
```

- [ ] **Step 4: 跑测通过**

Run: `node --test tests/directory-filters.test.mjs`
Expected: PASS

- [ ] **Step 5: Directory UI**

在 `Directory`：state `status/favoriteOnly/blood/ageMin/ageMax`；对 `donors` 调用 `filterDonors`；筛选条放在 kind tabs 下方：

- select 状态（admin 含 archived；非 admin 不含）
- checkbox/按钮「仅收藏」
- select 血型：`all` + `[...new Set(donors.map(d=>String(d.blood_group||'')).filter(Boolean))].sort()`
- 两个 number input：年龄从/至

`DonorCard`：若 `donor.status_reason` 非空，显示一行 metadata。

改状态 Modal description 增加一句：不可用/归档时理由会显示在卡片上。

- [ ] **Step 6: tsc**

Run: `npx tsc --noEmit`
Expected: 无 error

---

### Task 4: GrantForm 预填 + 人员行 + 案件详情入口

**Files:**
- Modify: `components/product/portal.tsx`（`GrantForm`、`PeopleActions`/`PersonRow`、`CaseDetail` 成员行）

**Interfaces:**
- Consumes: `POST /api/grants`（现有）
- Produces: `GrantForm({ refresh, userId?, userLabel?, allowRevoke?, triggerLabel? })`

- [ ] **Step 1: 扩展 GrantForm**

```tsx
function GrantForm({refresh,userId,userLabel,allowRevoke=true,triggerLabel}:{
 refresh:()=>void;userId?:string;userLabel?:string;allowRevoke?:boolean;triggerLabel?:string
}){
 // open 时若传入 userId：不拉全量 people 选用户；hidden input name=user_id value=userId
 // 展示只读 userLabel
 // allowRevoke===false 时操作固定为 grant（案件详情）
 // trigger 默认文案沿用「发放或撤销」；可被 triggerLabel 覆盖
}
```

`GrantsTab` 仍 `<GrantForm refresh={refresh}/>`（无预填）。

- [ ] **Step 2: 人员行**

在 `PersonRow`（或等价）对 `person.status==='approved'` 增加：

```tsx
<GrantForm refresh={refresh} userId={String(person.id)} userLabel={`${person.name} · ${person.email}`} triggerLabel={t('授权','Grant')}/>
```

（`refresh` 用 PeopleTab 的 `setVersion`；授权成功不必强刷 grants 列表。）

- [ ] **Step 3: 案件详情**

成员行：若 `profile.role==='admin' && m.role==='client' && m.status==='approved'`，渲染：

```tsx
<GrantForm refresh={refresh} userId={String(m.id)} userLabel={String(m.name)} allowRevoke={false} triggerLabel={t('资料库授权','Directory grant')}/>
```

成员 API 已返回 `p.status`；无需扩 API。

- [ ] **Step 4: 验证**

Run: `npx tsc --noEmit`
Run: `node --test tests/directory-filters.test.mjs tests/migration.test.mjs`
Expected: 全部 PASS

手动冒烟（若本地 Worker 可用）：改状态看卡片理由；Directory 组合筛选；人员/案件发 egg 授权后 Grants Tab 可见。

---

## Spec coverage（自检）

| 规格项 | Task |
| --- | --- |
| 状态/收藏/血型/年龄前端筛选 | 3 |
| `status_reason` 迁移 + ensure | 1 |
| 改状态写入/清空 + SELECT | 2 |
| 卡片展示理由 | 3 |
| 人员行授权 | 4 |
| 案件详情 client 授权 | 4 |
| 复用 grants API / Grants Tab 保留 | 4 |
| 不做服务端筛选/新 API/案件硬绑定 | 全任务遵守 |

## Placeholder scan

无 TBD；过滤函数与 SQL/ensureSchema 步骤含完整代码。
