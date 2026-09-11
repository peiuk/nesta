# 证件进度（C3）（2026-09-11）

对应 `/admin` 与案件详情：在合作方台账（C2）之后，为每个案件固定跟踪四项出生后证件节点。

## 背景

案件阶段已有 `paperwork`（出生后手续），时间线可记任意备注，但没有结构化的公证/海牙认证清单。协调员无法按节点看状态与日期，客户也看不到可核对的进度。

## 已确认决策

- 节点：**固定四项** — 出生证明、亲权、公证、海牙认证
- 生成：**建案时自动写入**；已有案件补齐四行，默认「未开始」
- 材料：**内部文字备注**；不上传文件
- 客户可见：**只读状态和日期**；不看 `notes`
- 状态：**未开始 / 进行中 / 已完成 / 受阻**
- 做法：Approach A — 新表 `case_documents`
- 编辑：能管理该案的协调员或管理员（`canManageCase`）；客户与审核员只读（审核员连 notes 也不看）

## 范围

**改 / 增：**

- D1 迁移 `drizzle/0007_case_documents.sql`：表 `case_documents`；为已有案件补齐四行
- `db/schema.ts`、`ensure-schema` 增量
- 建案写入四行
- `GET /api/cases/:id` 附带 `documents`
- `POST /api/cases/:id/documents` 更新一项
- 案件详情：管理员/协调员编辑；客户只读状态与日期
- 审计 `document.update`
- 纯函数单测（状态/kind 校验、客户投影）

**不做：**

- 文件上传、自由增删节点、公证服务商名录
- 官网展示、批量导入
- 修改案件阶段枚举

## 数据模型

### `case_documents`

| 列 | 说明 |
| --- | --- |
| `case_id` | FK → `cases(id)` |
| `kind` | `birth_certificate` \| `parentage` \| `notarisation` \| `apostille` |
| `status` | `not_started` \| `in_progress` \| `complete` \| `blocked`，默认 `not_started` |
| `status_date` | 可空日期文本 `YYYY-MM-DD`；客户可见 |
| `notes` | 内部备注，默认 `''` |
| `updated_at` | ISO 文本 |
| `updated_by` | 可空，FK → `profiles(id)` |

主键：`(case_id, kind)`。

### 建案与补齐

- `POST /api/cases` 与建案语句同批插入四行
- 迁移或 `ensureSchema` 后，对缺少行的案件 `INSERT OR IGNORE` 四项
- 不可删除、不可改 `kind`

## API

### `GET /api/cases/:id`

在现有响应上增加 `documents` 数组（固定顺序：出生证明、亲权、公证、海牙认证）。

客户与审核员每项只含：`kind`, `status`, `status_date`。

可管理者额外含：`notes`, `updated_at`。

### `POST /api/cases/:id/documents`

- 调用者须 `canManageCase`；否则 `403`
- Body：`kind`, `status`, `status_date`（可空清空）, `notes`, `reason`
- 校验 kind/status；`status_date` 空或合法日期
- 更新该行；审计 `document.update`，明细含 `kind/status/status_date` 与 reason
- 不接受新增 kind

## UI

### 案件详情（`/admin` 与 `/portal` 共用 CaseDetail）

- 标题：证件进度
- 四行：名称、状态、日期
- 客户：只读
- 可管理者：打开表单改状态、日期、内部备注、审计理由
- 审核员：与客户相同的只读投影（无 notes）

不新增侧栏模块；入口在案件详情。

## 验收标准

1. 新建案件后恰好四项，状态均为未开始
2. 已有案件补齐后不重复插入
3. 协调员/管理员可改状态、日期、notes；客户 GET 无 `notes`
4. 非法 kind/status 被拒绝；节点不能删除
5. 相关单测与 `npx tsc --noEmit` 通过

## 风险与边界

- `status_date` 是人工日期，不是系统自动时间戳
- 备注不进客户响应，也不写入客户可见审计摘要
- C3 不引用 C2 合作方；证件服务商仍不建档
