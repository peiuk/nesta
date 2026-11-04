# 精卵库运营加强（C1）（2026-09-07）

对应私密试用版门户：在 A1（管理端打磨 + 供者字段编辑）之后，补齐资料库日常运营三块——筛选、状态理由落库、授权入口贴近人员和案件。

## 背景

资料库已有：按 egg/sperm 拉取供者、收藏、管理员新建/改字段/改状态、`directory_grants` 发放与撤销。缺口是列表难筛、下架理由只在审计里、授权只能从管理「授权」Tab 操作。

## 已确认决策

- 范围：**三块一轮做完**（筛选 + `status_reason` + 双入口授权）
- 筛选维度：**状态 + 收藏 + 血型 + 年龄区间**；前端过滤现有 `/api/directory` 结果（Approach A）
- 状态理由：`donors` 增加可空字段 **`status_reason`**（不依赖从审计反查）
- 授权入口：**案件详情** + **人员行**；仍调用现有 `POST /api/grants`，管理端 Grants Tab 保留
- 不做：新授权 API、服务端分页/筛选、供者与案件硬绑定、批量授权、C2/C3

## 范围

**改 / 增：**

- D1 迁移：`donors.status_reason`（TEXT NULL）+ `db/schema` / `ensure-schema` 增量
- `POST /api/donors/:id` 改状态时写入/清空 `status_reason`；列表/详情 SELECT 带上该字段
- `components/product/portal.tsx`：Directory 筛选条；DonorCard 展示理由；People 行快捷授权；CaseDetail 对 client 成员快捷授权
- 必要时复用/抽出小型 Grant 表单组件，避免三处复制校验文案

**不改：**

- 授权业务规则（到期一年内、仅 approved、scope egg|sperm、撤销语义）
- 非管理员仍不看 `archived`
- 合作方台账（C2）、证件进度（C3）

## 资料库筛选

位置：Directory 顶部（egg/sperm 切换旁或下方）。

控件：

| 控件 | 行为 |
| --- | --- |
| 状态 | `all` + available / matching / unavailable / archived（archived 仅 admin UI 出现；服务端对非 admin 已过滤） |
| 仅收藏 | 开关；`favorite === 1` |
| 血型 | `all` + 当前已加载列表中出现过的 `blood_group` 去重选项 |
| 年龄 | min / max 数字；空表示不限；含端点 |

过滤在客户端完成；空结果用现有 Empty 文案。不改 API query。

## 状态理由

### 数据

- `donors.status_reason TEXT NULL`
- 迁移文件按仓库惯例新增（如 `drizzle/0002_*.sql`），并接入现有增量 `ensure-schema` 路径

### API

`POST /api/donors/:id` 状态分支（`status` 有值且无字段编辑载荷时）：

- 校验 `reason`（与现网一致，必填审计文案）
- `UPDATE donors SET status=?, status_reason=?`
- 当新状态为 `available` 或 `matching`：`status_reason` 写 `NULL`（或空串统一存 NULL）
- 当新状态为 `unavailable` 或 `archived`：写入本次 `reason`
- 审计动作仍为 `donor.status`，理由仍进 audit（与字段双写：字段供 UI，审计供历史）

字段编辑分支（summary/source 等）不改动 `status` / `status_reason`。

Directory SELECT 增加 `d.status_reason`。

### UI

- 改状态 Modal：保留必填理由；文案可提示「不可用/归档时会显示在卡片上」
- DonorCard：若 `status_reason` 非空，在状态旁或摘要下显示一行 metadata

## 授权入口

复用现有 `POST /api/grants` body：`user_id`, `scope`, `expires_at`, `reason`, `revoke`。

### 人员行（PeopleTab）

- 对 `status=approved` 的行提供「授权」按钮（admin 已在该页）
- 打开与 GrantsTab 同构的表单：用户预填且 ideally 只读/隐藏；可选发放或撤销；scope / 到期 / 理由
- 完成后 `refresh` 人员旁的版本或仅关 Modal（授权列表在 Grants Tab；此处不必强刷 grants）

### 案件详情（CaseDetail）

- 成员列表中，对 `role=client` 且成员对应 profile 为 approved 的项，提供「资料库授权」
- 表单：预填该成员 `user_id`；scope / 到期 / 理由；默认发放（撤销仍可从 Grants Tab 或人员行做）
- 若成员 API 未返回 `status`/`email`，沿用现有 people 旁路或扩展 members 载荷——以实现时最小改动为准，优先不扩 API

### Grants Tab

保留「发放或撤销」入口，行为不变。

## 验收标准

1. Directory：四类筛选项组合后卡片集合正确；清空筛选项恢复全量（当前 kind）
2. 改状态为 unavailable/archived 后卡片可见理由；改回 available/matching 后理由消失
3. 人员行 / 案件详情 client 成员均可成功发放 egg 或 sperm 授权；审计出现 `directory.grant`
4. `npx tsc --noEmit` 通过；现有相关单测不挂

## 风险与边界

- 前端过滤受 `LIMIT 300` 约束：试点可接受；若日后超限再做 Approach B
- `status_reason` 只保留「当前」理由，历史以 audit 为准
- 案件详情授权不自动绑定案件 ID（YAGNI；C2/C3 再考虑关联）
