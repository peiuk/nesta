# WebMCP 窄只读面设计（2026-09-06）

对应 `docs/implementation.md` 交付步骤 5：Narrow authorized WebMCP read surface。

## 背景

门户 UI（步骤 4）已完成。ChatGPT 桌面端内置浏览器通过 Site tools（WebMCP：`document.modelContext.registerTool`）可发现页面注册的工具，并在**同一已登录会话**内调用。

本步骤只暴露极窄的只读能力，让代理在已批准用户打开 `/portal` 时读取本人档案与概览摘要，不提供写操作，不暴露案件详情、报告正文/附件、资料库或管理面。

## 范围

- 修改：`components/product/portal.tsx`（在已批准的 `Workspace` 内注册工具）
- 修改：`env.d.ts`（最小 `Document.modelContext` 类型，仅供编译）
- 修改：`docs/implementation.md`（勾选步骤 5）

不在范围：独立 MCP HTTP 服务、写工具、案件/报告/资料库/管理工具、新建 UI 模块文件、后端接口变更、私密部署（步骤 7）。

## 挂载与门禁

1. 仅在 `Workspace`（`profile.status === 'approved'`）挂载时注册。
2. 未注册、待审核、已暂停状态不注册任何工具，避免必然的 401/403。
3. 用 `useEffect` + `AbortSignal`：组件卸载或依赖变化时 abort，撤销工具。
4. 特性检测：`typeof document.modelContext?.registerTool === 'function'`；不支持则静默跳过，不影响人工界面。
5. 工具执行路径复用现有 `api()`（`same-origin` 凭据），授权完全由后端 `/api/me`、`/api/overview` 决定；前端不做第二套权限规则。

## 工具

两个工具，均无入参（`inputSchema`: 空 object，`additionalProperties: false`），均标注 `annotations: { readOnlyHint: true }`。

### `firstleaf_get_profile`

- 行为：`GET` via `api('me')`
- 描述须说明：私密试用版；仅返回当前登录会话的本人档案摘要；不含兴趣自述等长文本。
- 返回白名单字段：`id`, `name`, `email`, `role`, `status`, `language`, `jurisdiction`
- 从 `profile` 对象挑上述键；其余字段丢弃。

### `firstleaf_get_overview`

- 行为：`GET` via `api('overview')`
- 描述须说明：私密试用版；仅返回本人可见案件摘要与资料库授权状态；不含报告内容或文件。
- 案件每行白名单：`id`, `code`, `title`, `stage`, `cycle`, `membership_role`, `updated_at`
- 授权每行白名单：`scope`, `expires_at`, `revoked_at`
- 返回形状：`{ cases: [...], grants: [...] }`

### 错误

`api()` 抛出的错误码（如 `SIGN_IN_REQUIRED`、`APPROVAL_REQUIRED`、`SERVICE_UNAVAILABLE`）原样以 `{ error: code }` 形式返回给调用方，或重新抛出带该码的 `Error`；不新增界面文案、不翻译错误码。

## 类型

在 `env.d.ts` 增加最小声明，例如：

- `interface ModelContext { registerTool(def: {...}, options?: { signal?: AbortSignal }): Promise<void> | void }`
- `interface Document { modelContext?: ModelContext }`

不引入 `@modelcontextprotocol/*` 或其它运行时依赖。

## 验证

- `npx tsc --noEmit` 零错误
- `npm run lint`：不提高既有基线；`portal.tsx` / `env.d.ts` 无新增问题
- `node --test tests/policy.test.mjs` 不回归
- 静态核对：仅 `Workspace` 注册；待审核路径不挂载；工具只调用 `me`/`overview`；返回字段为白名单
- 真机 Site tools 走查推迟到步骤 7 私密部署之后

## 交付

完成后将 `docs/implementation.md` 步骤 5 勾为 `[x]`。
