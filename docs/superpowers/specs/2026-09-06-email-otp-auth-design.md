# 邮箱验证码登录（与 ChatGPT 并存）（2026-09-06）

对应私密试用版身份扩展：在保留 ChatGPT 登录的同时，允许用户用邮箱一次性验证码进入门户并建档。仍不设应用自管密码。

## 背景

当前身份仅来自 Sites 注入的 ChatGPT 请求头（`oai-authenticated-user-*`）。`actor()` 依赖 `getChatGPTUser()`；建档表单只展示邮箱，不可编辑。本地无 ChatGPT 头时无法走通门户。业务需要客户用邮箱 OTP 注册/登录，并与 ChatGPT 路径并存。

## 已确认决策

- 方式：**邮箱 6 位验证码（OTP）**，无密码
- 与 ChatGPT：**并存**；同一规范化邮箱合并为同一 `profiles` 行
- 实现：**自建 OTP + HttpOnly 会话 Cookie**（不用 Clerk / Auth.js）
- 发信：**Resend** HTTP API

## 范围

**改 / 增：**

- `lib/server.ts` 的 `actor()` 与认证相关路由
- 新模块（建议）：`lib/email-auth.ts`（OTP、会话、发信）
- D1 迁移 `drizzle/0001_*.sql` + `db/schema.ts` + `ensureSchema` 增量能力
- `components/product/registration.tsx` 的 `SignIn` UI
- 门户退出逻辑（按登录方式选路径）
- `app/privacy/page.tsx` 文案补充
- `env.d.ts` 与部署 handoff 中的环境变量说明
- 策略/认证相关单测（限流、哈希校验、合并规则等纯函数优先）

**不改：**

- 案件、报告、资料库业务规则
- 不引入密码、Magic Link、第三方 OAuth（除现有 ChatGPT）
- 不做自助改绑邮箱

## 身份解析

`actor()` 顺序：

1. 若 `getChatGPTUser()` 非空 → 现有逻辑（`INSERT OR IGNORE` by ChatGPT `userId`，`ADMIN_EMAIL` 升权）
2. 否则若请求带有效会话 Cookie → 用会话 `user_id` 加载 `profiles`；过期或找不到则清 Cookie 并 `401`
3. 否则 `401 SIGN_IN_REQUIRED`

ChatGPT 与邮箱会话同时存在时：**优先 ChatGPT 头**（平台会话为准）。

## 邮箱 OTP 流程

### `POST /api/auth/email/request`

- Body：`{ email }`
- 规范化：`trim` + 小写；格式校验失败 → `400 INVALID_EMAIL`
- 限流：同一邮箱约 **60s** 内不可重复发送；每邮箱每小时上限（如 5）；同 IP 粗限流（如每小时 20）
- 生成 6 位数字码；存储 **哈希**（`SESSION_SECRET` 作 pepper + 每码随机盐，或等价 HMAC）；明文仅进邮件
- TTL：**10 分钟**；同邮箱新请求覆盖旧码并重置 attempts
- 成功响应不区分「是否已有用户」（防枚举）：一律 `{ ok: true }`
- 生产环境无 `RESEND_API_KEY` → `503 SERVICE_UNAVAILABLE`
- 非生产且无密钥：可将码写入 Worker 日志，仍返回 `{ ok: true }`（仅便于本地试用）

### `POST /api/auth/email/verify`

- Body：`{ email, code }`
- 校验哈希与过期；错误增加 `attempts`，超过上限（如 5）作废并要求重发 → `400 OTP_INVALID` / `OTP_EXPIRED`
- 成功后：
  1. 按规范化邮箱查 `profiles`
  2. 若无：创建档案，`id` 为稳定值 `email:` + `sha256(normalizedEmail)` 的 hex 前 32 字符（或全长截断约定写死并单测）；`name` 暂用邮箱本地部分；`role/status` 按是否匹配 `ADMIN_EMAIL` 设为 admin/approved 或 client/pending
  3. 若有：复用该行（无论原 id 来自 ChatGPT 还是 email）；仍按 `ADMIN_EMAIL` 校正 owner
  4. 写入 `auth_sessions`，设置 Cookie
- Cookie：`HttpOnly`；`Secure`（生产）；`SameSite=Lax`；`Path=/`；名如 `firstleaf_session`；值含会话 id（或签名 token），服务端以 `token_hash` 校验；有效期约 **14 天**

### `POST /api/auth/logout`

- 删除当前会话行并清除 Cookie
- ChatGPT 用户仍使用 `/signout-with-chatgpt?return_to=%2F`
- 门户：若当前档案 id 以 `email:` 开头（或 profile 标注 `auth_via`——**推荐用会话存在且无 ChatGPT 头**判断）则链到 `/api/auth/logout` 或前端调用 logout 再跳转首页；有 ChatGPT 头则用平台退出

为避免启发式脆弱，可在 `GET /api/me` 增加只读字段 `sign_in: 'chatgpt' | 'email'`（由本次请求如何通过 `actor` 决定），UI 据此选退出路径。

## 数据模型

### `email_otps`

| 列 | 说明 |
| --- | --- |
| `email` PK | 规范化邮箱 |
| `code_hash` | 哈希 |
| `salt` | 每码盐（若需要） |
| `expires_at` | ISO |
| `attempts` | 整数 |
| `created_at` | ISO |
| `request_ip` | 可选，限流辅助 |

### `auth_sessions`

| 列 | 说明 |
| --- | --- |
| `id` PK | 会话 id |
| `user_id` | → profiles |
| `token_hash` | Cookie 秘密的哈希 |
| `expires_at` | ISO |
| `created_at` | ISO |

### `profiles`

- 为 `email` 增加 **UNIQUE**（规范化存储）；迁移时先规范化再加索引
- 若历史存在重复邮箱，迁移策略：保留 `created_at` 最早一行，其余需人工处理——私密试用可假设无冲突；若有冲突，迁移失败并记录

### `ensureSchema`

当前仅在缺少 `profiles` 时跑 `0000`。改为：检测缺少 `email_otps`（或迁移版本表）时执行 `0001` 语句，保证已部署库可增量升级。

## 环境变量

| Key | 用途 |
| --- | --- |
| `ADMIN_EMAIL` | 既有：owner 引导 |
| `SITE_ORIGIN` | 既有：mutation 校验 |
| `SESSION_SECRET` | Cookie / OTP pepper（必填于生产） |
| `RESEND_API_KEY` | 发信 |
| `EMAIL_FROM` | 已验证发件人，如 `Firstleaf <noreply@example.com>` |

不向客户端暴露密钥。不把密钥写入仓库。

## 界面

`SignIn` 卡片：

1. 保留 ChatGPT 主按钮与试用说明  
2. 分隔线 +「或使用邮箱验证码」  
3. 步骤：邮箱 →「发送验证码」→ 验证码输入 →「登录」  
4. 说明：无密码；与 ChatGPT 使用同一邮箱将进入同一档案  

注册表单（已登录未建档）仍只读展示 `profile.email`。

隐私页「登录与档案」补充：可通过 ChatGPT 或邮箱验证码登录；验证码邮件仅用于登录，不设网站密码。

## 安全边界

- OTP 与会话 token 均不明文存库  
- 恒定时间比较哈希（或等价安全比较）  
- mutation 路由仍走 `validMutation` / `x-firstleaf`  
- 不在响应中泄露「邮箱是否已注册」  
- 审计：可选记录 `auth.email.request`（无码）、`auth.email.verify`、`auth.logout`（reason 不含验证码）

## 验证

- 单测：邮箱规范化、OTP 哈希校验、attempts/过期、id 稳定算法、ADMIN_EMAIL 升权（纯函数层）  
- `npx tsc --noEmit`、`npm run lint`（无新增错误相对基线）  
- 手工：本地用日志码完成邮箱登录；有 ChatGPT 头时优先平台身份；同邮箱先 OTP 再建 ChatGPT（或反之）仍为同一业务档案（按 email 合并）

## 备注

部署前必须在 Sites 配置 `SESSION_SECRET`、`RESEND_API_KEY`、`EMAIL_FROM`。未配置发信时生产环境不可静默成功。
