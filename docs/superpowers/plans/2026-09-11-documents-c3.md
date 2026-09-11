# 证件进度（C3）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 每个案件固定跟踪四项出生后证件节点；协调员可改状态/日期/内部备注，客户与审核员只读状态和日期。

**Architecture:** Approach A——新表 `case_documents`，主键 `(case_id, kind)`。建案同批插入四行；迁移/`ensureSchema` 对已有案件 `INSERT OR IGNORE` 补齐。纯函数校验 kind/status/日期并做客户投影。

**Tech Stack:** Vinext/Cloudflare Worker、D1、现有 CaseDetail、`node --test`、`tsc`。

## Global Constraints

- 规格：`docs/superpowers/specs/2026-09-11-documents-c3-design.md`
- 节点固定：`birth_certificate` | `parentage` | `notarisation` | `apostille`
- 状态：`not_started` | `in_progress` | `complete` | `blocked`；默认未开始
- 材料仅内部文字备注；不上传文件；不可增删节点
- 客户/审核员投影：`kind`, `status`, `status_date`（无 `notes`）
- 编辑：`canManageCase`；审计 `document.update`
- 分支：`main`；**仅在用户要求时 commit**
- 验证：相关 `node --test`、`npx tsc --noEmit`
- Shell 在本机需不受 sandbox 限制

## File Structure

| 文件 | 责任 |
| --- | --- |
| `drizzle/0007_case_documents.sql` | 表 + 已有案件补齐四行 |
| `drizzle/meta/_journal.json` | 登记 `0007_case_documents` |
| `db/schema.ts` | `caseDocuments` |
| `lib/ensure-schema.ts` | 建表 + 全案 `INSERT OR IGNORE` |
| `lib/documents.ts`（新建） | kind/status/日期/投影/固定顺序 |
| `tests/documents.test.mjs`（新建） | 纯函数单测 |
| `tests/migration.test.mjs` | 断言 0007 / journal |
| `lib/server.ts` | 建案写入、GET 附带 `documents`、POST 更新 |
| `components/product/portal.tsx` | CaseDetail「证件进度」 |
| `components/product/common.tsx` | 文案标签与错误码 |
| `docs/admin-guide.md` | 补证件进度说明 |

---

### Task 1: 迁移 + schema + ensureSchema

**Files:**
- Create: `drizzle/0007_case_documents.sql`
- Modify: `drizzle/meta/_journal.json`
- Modify: `db/schema.ts`
- Modify: `lib/ensure-schema.ts`
- Modify: `tests/migration.test.mjs`

**Interfaces:**
- Produces: 表 `case_documents`；已有案件补齐四行（`INSERT OR IGNORE`）

- [ ] **Step 1: 失败单测**

`tests/migration.test.mjs`：journal `entries.length` 改为 8；`entries[7].tag === '0007_case_documents'`；断言 SQL 含 `CREATE TABLE \`case_documents\``、`PRIMARY KEY(\`case_id\`, \`kind\`)`、四项 kind 的 `INSERT OR IGNORE`。

- [ ] **Step 2: 跑测确认失败**

Run: `node --test tests/migration.test.mjs`

- [ ] **Step 3: SQL**

```sql
CREATE TABLE `case_documents` (
 `case_id` text NOT NULL,
 `kind` text NOT NULL,
 `status` text DEFAULT 'not_started' NOT NULL,
 `status_date` text,
 `notes` text DEFAULT '' NOT NULL,
 `updated_at` text NOT NULL,
 `updated_by` text,
 PRIMARY KEY(`case_id`, `kind`),
 FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`),
 FOREIGN KEY (`updated_by`) REFERENCES `profiles`(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_case_documents_case` ON `case_documents` (`case_id`);
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'birth_certificate','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'parentage','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'notarisation','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
--> statement-breakpoint
INSERT OR IGNORE INTO `case_documents` (`case_id`,`kind`,`status`,`status_date`,`notes`,`updated_at`,`updated_by`)
 SELECT `id`,'apostille','not_started',NULL,'',strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL FROM `cases`;
```

- [ ] **Step 4: schema + ensureSchema**

`caseDocuments` 映射到 drizzle（复合主键）。`ensureSchema`：`applyIfMissing('case_documents', migration7)` 后对四项再跑一遍 `INSERT OR IGNORE … SELECT FROM cases`（表已存在时迁移里的补齐不会再执行）。

- [ ] **Step 5: 跑测通过**

---

### Task 2: 纯函数校验（TDD）

**Files:**
- Create: `lib/documents.ts`
- Create: `tests/documents.test.mjs`

**Interfaces:**
- Produces:
  - `DOCUMENT_KINDS`: `['birth_certificate','parentage','notarisation','apostille']`
  - `DOCUMENT_STATUSES`: `['not_started','in_progress','complete','blocked']`
  - `assertDocumentKind(kind: string)` / `assertDocumentStatus(status: string)`
  - `normalizeStatusDate(value: unknown): string|null` — 空/`null` → null；非法抛 `INVALID_DATE`
  - `projectDocument(row, includeInternal: boolean)` — 客户投影无 `notes`/`updated_at`
  - `sortDocuments(rows)` — 固定四种顺序
  - `documentSeedRows(caseId, ts)` — 四行默认「未开始」，供建案 batch

**Seams:** 纯函数公开接口（规格已定：kind/status 校验、客户投影）。

- [ ] **Step 1–4: RED → 实现 → GREEN**

用例至少覆盖：

- 四项 kind / 四项 status 接受
- 未知 kind → `DOCUMENT_KIND_INVALID`；未知 status → `DOCUMENT_STATUS_INVALID`
- `normalizeStatusDate(null|'')` → null；`'2026-09-11'` → 同字面量；`'2026-13-01'` 抛 `INVALID_DATE`
- `projectDocument(..., false)` 仅 `kind/status/status_date`
- `projectDocument(..., true)` 另含 `notes/updated_at`
- `sortDocuments` 乱序输入排成固定顺序
- `documentSeedRows` 恰好四行、均为 `not_started`

---

### Task 3: Server API

**Files:**
- Modify: `lib/server.ts`

**Interfaces:**
- Consumes: Task 1 表 + Task 2 纯函数
- Produces: 建案四行；`GET cases/:id` 含 `documents`；`POST cases/:id/documents`

- [ ] **Step 1: `POST /api/cases` 同批插入四行**

在现有 `INSERT INTO cases` / members / audit 的 `db().batch([...])` 末尾追加 `documentSeedRows(caseId, created)` 对应的 `INSERT OR IGNORE` 语句。

- [ ] **Step 2: `GET /api/cases/:id` 附带 `documents`**

读取该案全部行；若不足四行则先 `INSERT OR IGNORE` 再读。`sortDocuments` 后：

- `canManageCase(a, role)`：投影 `includeInternal=true`
- 否则（客户、审核员、非管理者）：`includeInternal=false`

- [ ] **Step 3: `POST /api/cases/:id/documents`**

- `manager(a, caseId)`（即 `canManageCase`）；否则 403
- Body：`kind`, `status`, `status_date`（空则清空）, `notes`, `reason`
- 校验 kind/status；日期空或合法；`notes` 上限 1500
- `UPDATE` 该行（不存在则 404，因不可新增 kind）
- 审计 `document.update`，reason 含 `kind/status/status_date` 与调用方 reason

- [ ] **Step 4: `npx tsc --noEmit`**

---

### Task 4: CaseDetail UI + 文案

**Files:**
- Modify: `components/product/portal.tsx`
- Modify: `components/product/common.tsx`
- Modify: `docs/admin-guide.md`

**Interfaces:**
- Consumes: 案件响应 `documents`、`POST cases/:id/documents`

- [ ] **Step 1: 标签与错误码**

`labels` 增加四项 kind 与四项 status。`errors` 增加 `DOCUMENT_KIND_INVALID`、`DOCUMENT_STATUS_INVALID`。`Status` 的 outline 集合纳入 `not_started`、`blocked`、`in_progress`。

- [ ] **Step 2: CaseDocumentsPanel**

案件详情左侧（服务进度附近）渲染「证件进度」：四行名称、状态、日期。

- `can_manage`：每行可打开表单改状态、日期、内部备注、审计理由
- 客户/审核员：只读；不渲染 notes

不新增侧栏模块。

- [ ] **Step 3: admin-guide**

在「案件与进度」补一句：案件详情可维护四项证件节点（出生证明、亲权、公证、海牙认证）；客户只见状态与日期。

- [ ] **Step 4: 验证**

```
node --test tests/documents.test.mjs tests/migration.test.mjs
npx tsc --noEmit
```

---

## Spec coverage（自检）

| 规格项 | Task |
| --- | --- |
| `case_documents` + 已有案件补齐 | 1 |
| 建案写入四行 | 3 |
| GET 附带 documents + 客户投影 | 2–3 |
| POST 更新 + `document.update` | 3 |
| CaseDetail 编辑/只读 | 4 |
| 纯函数单测 + tsc | 2、4 |
| 不做上传/增删节点/合作方名录 | 全任务遵守 |

## Placeholder scan

无 TBD；SQL 与纯函数签名已写死。
