# 客户/案件工作台界面设计（2026-09-06）

对应 `docs/implementation.md` 交付步骤 4：注册、客户门户、资料库、案件、报告上传/复核/发布、团队与授权。

## 背景

后端已完成：`lib/policy.ts` 授权规则、`lib/server.ts` 读写接口、`db/schema.ts` 与 `drizzle/0000_swift_jamie_braddock.sql`、`app/api/[...path]/route.ts` 入口、R2 私密附件下载。`app/product.css` 已包含工作台所需的全部类名。

唯一缺口：`app/portal/page.tsx` 引用 `@/components/product/portal` 的 `Portal`，该文件不存在，登录后无界面。

## 范围

新增 `components/product/portal.tsx`，单个 `'use client'` 组件，用内部视图状态切换，不新增路由、不改后端接口、不改数据库。`Registration`、`SignIn`、`common.tsx` 的既有工具全部复用。

不在本次范围：WebMCP 只读面（步骤 5）、部署（步骤 7）。

## 门禁与外壳

依据 `GET /api/me` 返回的 `profile` 分三层：

1. `registered_at` 为空 → 渲染 `Registration`，成功后重取 `me`。
2. 已注册但 `status !== 'approved'` → 用 `.notice` 显示待审核或已暂停说明，不再请求其他接口，避免必然的 403。
3. `status === 'approved'` → 渲染工作区。

工作区外壳为 `.workspace` 包 `.workspace-header`（`Brand`、导航、`LanguageButton`、返回官网）与 `.workspace-main`。导航按角色显示：

- 客户：概览；资料库仅在 `overview.grants` 中存在未撤销且未过期的授权时出现。
- 协调员、审核员：概览。
- 管理员：概览、资料库、管理。

选中案件时不切换导航项，在概览视图内切到案件详情，顶部提供返回按钮。加载中用 `.loading`，错误统一交给 `ErrorNotice`（`common.tsx` 的 `errors` 已覆盖全部后端错误码）。

数据获取沿用 `useResource(path, version)`；每次写操作成功后递增 `version` 触发重取，不自建缓存。

## 视图

### 概览

数据源 `GET /api/overview`（返回本人可见案件与授权）。

`.summary-grid` 三格：案件数、当前阶段、资料库授权状态。下方案件列表，每张卡片显示编号、标题、阶段 `Status`、本人成员角色、更新时间，点击进入案件详情。无案件时用 `Empty`。

管理员额外提供「新建案件」（`Modal` + `ActionForm` → `POST /api/cases`，字段 title、customer_id、reason）。客户下拉取自 `GET /api/people`，筛 `role === 'client' && status === 'approved'`。

### 案件详情

数据源 `GET /api/cases/:id`，返回 `case`、`membership`、`can_manage`、`members`、`reports`、`events`、`questions`。布局用 `.split`（左 1.6fr、右 1fr）。

顶部 `.stage-banner`：案件编号、标题、阶段、周期。`can_manage` 为真时提供「更新阶段」（`POST /api/cases/:id/stage`，字段 stage、cycle 1–99、reason）。

阶段选项由门户组件内的常量提供，与 `lib/server.ts` 的 `stages` 逐项一致；`lib/server.ts` 依赖 `cloudflare:workers`，客户端组件不能引入。中英文名称取 `common.tsx` 的 `labels`，其中已含全部九个阶段。

左栏：

- 报告面板，每条一行 `.report-row`，显示标题、来源、报告日期、语言、版本、状态 `Status`。操作按后端逐条返回的标志渲染：
  - 下载原件 → `GET /api/files/:id/original`
  - 下载译稿 → `GET /api/files/:id/translation`，仅当 `has_translation`
  - `can_review` → 复核（`POST /api/reports/:id/review`，decision 取 reviewed/rejected，reason 必填）
  - `can_publish` → 发布（`POST /api/reports/:id/publish`，reason 必填）
  - `can_manage` → 撤回（`POST /api/reports/:id/withdraw`，reason 必填）
  - `review_note` 存在时用 `.report-review` 显示
- `can_manage` 时提供「上传报告」，`FormData` 提交至 `POST /api/cases/:id/reports`，字段 title、kind（report/document）、source、report_date、language（ka/en/zh）、cycle、recipients（JSON 字符串数组）、original、translation（可选）、supersedes_id（可选）。文件输入的 `accept` 与单文件 8 MiB 上限对齐 `validateUpload`；收件人从 `members` 中 `role === 'client'` 者多选，至少一位，最多十位。
- 进度时间线 `.timeline` 列出 `events`（日期、类型、标题、备注、记录人）。`can_manage` 时提供「添加记录」（`POST /api/cases/:id/events`，字段 kind、title、note、event_date、cycle）。

右栏：

- 成员面板显示姓名、角色、状态。客户身份下后端已限制只返回本人与协调员。管理员可分配或移除成员（`POST /api/cases/:id/members`，字段 user_id、reason、remove）。
- 沟通面板用 `.question` 列出问题，回复用 `.answer`。案件成员均可提问（`POST /api/cases/:id/questions`，body ≤2000 字）；`can_manage` 可回复（`POST /api/questions/:id`，reply ≤2000 字）。

### 资料库

数据源 `GET /api/directory?kind=egg|sperm`，两类用切换控件。`.directory-grid` 铺 `.donor-card`：编号、年龄、身高、血型、来源、按当前语言取 `summary_zh` 或 `summary_en`、状态 `Status`、核实日期，右上角收藏开关（`POST /api/favorites`，字段 donor_id、favorite）。

后端返回 `DIRECTORY_LOCKED` 时由 `ErrorNotice` 呈现既有文案，不额外造词。

管理员额外提供新增供者（`POST /api/donors`，字段 code、kind、age 18–65、height 100–230 可空、blood_group 可空、source、summary_zh、summary_en、verified_at、consent_ref）与状态变更（`POST /api/donors/:id`，字段 status、reason）。

### 管理（仅 admin）

`.section-tabs` 四页，均用 `.table-wrap` 包 `ui/table`：

- 人员：`GET /api/people`，行内修改角色与状态（`POST /api/people/:id`，reason 必填）。管理员本人与其他 admin 行不提供操作，后端返回 `OWNER_PROTECTED`。界面提示角色变更会清除既有案件成员身份与目录授权。
- 授权：`GET /api/grants`，发放或撤销（`POST /api/grants`，字段 user_id、scope、expires_at、reason、revoke）。到期日输入限制在未来一年内，与后端一致。
- 案件：`GET /api/cases`，全量列表加新建入口。该接口对未参与的案件返回 `membership_role` 为空，而案件详情要求成员身份，因此只对 `membership_role` 非空的行提供进入入口，其余行显示需先分配自己为成员。
- 审计：`GET /api/audit`，只读，显示时间、操作人、动作、对象、理由。

## 错误处理

所有写操作通过 `ActionForm`，它已内置提交期禁用与错误码渲染。`api()` 已附带 `x-firstleaf` 头并使用 `same-origin` 凭据，满足 `validMutation`。读取失败由各视图的 `ErrorNotice` 呈现，`STALE_RECORD` 与 `409` 类冲突提示用户刷新后重试，刷新即递增 `version`。

## 验证

授权规则已由 `tests/policy.test.mjs` 覆盖，本次不为界面新增自动化测试。交付前执行：

- `node --test tests/policy.test.mjs`（确认既有规则未回归）
- `npx tsc --noEmit`
- `npm run build`
- `npm run lint`

手工检查清单，六种身份各走一遍：未注册、待审核、客户、协调员、独立审核员、管理员。重点确认：客户看不到草稿报告、上传者不能自审、未授权时资料库锁定、非成员访问案件返回未找到。

## 备注

当前工作目录不是 git 仓库，本文档无法提交；如后续初始化仓库，应一并纳入首次提交。
