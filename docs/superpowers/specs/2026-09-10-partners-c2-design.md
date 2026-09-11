# 合作方台账（C2）（2026-09-10）

对应 `/admin` 业务能力：先落地 IVF 诊所与月子中心名录，并允许每个案件各绑定最多一家。C3（公证/海牙认证进度）另开规格。

## 背景

官网已宣传协作网络（IVF 诊所、月子中心、证件服务），后台尚无结构化合作方对象。案件侧只能靠口头/备注记录，无法筛选、审计或为后续证件节点复用。

## 已确认决策

- 类型：**仅 IVF 诊所 + 月子中心**（证件服务商归 C3）
- 关联：每个案件 **最多一家诊所 + 一家月子**（Approach A：案件两列外键）
- 可见性：**仅管理端**；客户 `/portal` 不展示
- 字段：**精简** — 名称、类型、联系人/电话/邮箱、备注、启用/停用
- 顺序：本轮只做 C2；C3 在 C2 合并/验收后再开

## 范围

**改 / 增：**

- D1 迁移：`partners` 表；`cases.ivf_partner_id`、`cases.postpartum_partner_id`（可空 FK）
- `db/schema.ts`、`ensure-schema` 增量（新表 + 列）
- Admin API：`partners` CRUD（列表/新建/更新含停用）；`cases/:id/partners` 设/清空绑定
- `/admin` 侧栏「合作方」模块；案件详情管理员绑定 UI
- 审计：`partner.create` / `partner.update` / `case.partners`
- 纯函数或迁移相关单测；必要时 admin API 行为测（沿仓库风格）

**不改 / 不做：**

- 客户门户展示合作方
- 同类型多家、主/备关系
- 公证/认证服务商与证件进度（C3）
- 官网公开名录、批量导入、中英双名称字段

## 数据模型

### `partners`

| 列 | 说明 |
| --- | --- |
| `id` | TEXT PK |
| `kind` | `ivf` \| `postpartum` |
| `name` | 显示名称，必填 |
| `contact_name` | 可空 |
| `phone` | 可空 |
| `email` | 可空 |
| `notes` | 可空，内部备注 |
| `status` | `active` \| `inactive`，默认 `active` |
| `created_at` / `updated_at` | ISO 文本 |

索引建议：`(kind, status)`。

### `cases` 扩展

- `ivf_partner_id TEXT NULL` → `partners(id)`
- `postpartum_partner_id TEXT NULL` → `partners(id)`

约束（应用层）：

- 写入 `ivf_partner_id` 时目标 `kind` 必须为 `ivf`（清空除外）
- 写入 `postpartum_partner_id` 时目标 `kind` 必须为 `postpartum`
- 新绑定时合作方须为 `active`；已绑定后对方被停用：保留历史 ID，UI 仍显示名称并标注已停用，不可再「新选」该条（下拉只列 active）

SQLite 可不加严格 FK enforce；与现库风格一致即可，迁移中声明 REFERENCES。

## API（全部 `admin(a)`）

### `GET /api/partners`

- Query 可选：`kind=ivf|postpartum`，`status=active|inactive|all`（默认 `all` 或 `active`——实现取 **默认 all**，UI 可筛）
- 返回 `{ partners: [...] }`，按 name 排序，上限如 300

### `POST /api/partners`

- Body：`kind, name, contact_name?, phone?, email?, notes?`
- 新建默认 `active`；审计 `partner.create`

### `POST /api/partners/:id`

- Body：可更新字段 + 可选 `status`；`reason` 记入审计（停用/改名等）
- 审计 `partner.update`
- 不做物理删除

### `POST /api/cases/:id/partners`

- Body：`ivf_partner_id` 与/或 `postpartum_partner_id`；值可为 `null` / `""` 表示清空该列；未出现的键表示不改
- `reason` 必填（审计）
- 校验 kind、active（仅非空新绑）
- 审计 `case.partners`
- 同步 `cases.updated_at`

### 案件读路径

`GET /api/cases/:id`（管理员）响应中附带只读摘要，例如：

```json
"partners": {
  "ivf": { "id", "name", "status" } | null,
  "postpartum": { "id", "name", "status" } | null
}
```

非 admin 成员读案件：**不返回** `partners` 键（或恒为省略），避免客户侧泄露。

## UI（`/admin`）

### 侧栏

新增 section：`partners` / 合作方（中英）。

### 合作方页

- 类型、状态筛选 + 新建
- 表格：名称、类型、联系、状态、操作（编辑 / 停用或启用）
- Modal 表单对应精简字段

### 案件详情

仅 `profile.role === 'admin'`（已在 CaseDetail 管理能力内）：

- 「合作方」小块：IVF / 月子两个下拉（选项 = 对应 kind 的 active 列表；当前已绑 inactive 时仍显示当前项）
- 保存调用 `cases/:id/partners`
- 客户与非 admin 协调员在 `/portal` 案件详情不渲染此块

## 验收标准

1. 管理员可新建诊所与月子、编辑字段、停用/启用；列表可按类型与状态筛
2. 案件可分别绑定/清空一家诊所与一家月子；错误 kind 或 inactive 新绑被拒绝
3. 停用后已绑定案件仍能看到名称（带停用态）；下拉新选不含该条
4. 客户 `/portal` 与非 admin 案件响应中看不到合作方数据
5. 相关单测与 `npx tsc --noEmit` 通过

## 风险与边界

- Approach A 不支持同类型多家；若日后需要，再迁到关联表（C2 不预埋）
- 停用≠解绑：避免历史案件丢引用
- C3 证件进度可引用 `cases` 与后续「证件服务商」类型，不阻塞本轮
