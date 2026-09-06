# WebMCP 窄只读面 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已批准的门户工作区注册两个 WebMCP 只读工具（`firstleaf_get_profile`、`firstleaf_get_overview`），供 ChatGPT Site tools 在同一登录会话内读取本人摘要。

**Architecture:** 客户端在 `Workspace` 的 `useEffect` 中特性检测 `document.modelContext.registerTool`，用 `AbortSignal` 卸载；工具通过现有 `api()` 调用 `/api/me` 与 `/api/overview`，返回白名单字段。不新增后端接口。

**Tech Stack:** Vinext/React 19、TypeScript、浏览器 WebMCP（`document.modelContext`）、既有 `api()`。

## Global Constraints

- 设计依据：`docs/superpowers/specs/2026-09-06-webmcp-read-surface-design.md`
- 仅改 `env.d.ts`、`components/product/portal.tsx`、`docs/implementation.md`
- 仅只读；`readOnlyHint: true`；无入参；不暴露案件详情/报告/资料库/管理
- 仅在 `Workspace`（已批准）注册；待审核等路径不挂载
- 不引入 MCP SDK 依赖；私密试用版描述须写明测试资料语境
- 验收：`tsc --noEmit` 零错误、policy 测试不回归、lint 不提高基线

---

### Task 1: WebMCP 类型与门户只读工具

**Files:**
- Modify: `env.d.ts`
- Modify: `components/product/portal.tsx`（`Workspace` 内 effect + 同文件辅助函数）
- Modify: `docs/implementation.md`（勾选步骤 5）

**Interfaces:**
- Consumes: `api` from `./common`；`Workspace` 仅在 `status === 'approved'` 时挂载
- Produces: `firstleaf_get_profile`、`firstleaf_get_overview` 两个 Site tools；`ModelContext` 最小类型

- [ ] **Step 1: 在 `env.d.ts` 追加最小 WebMCP 类型**

在现有 `Cloudflare` 命名空间声明之后追加：

```ts
type WebMcpToolResult = Record<string, unknown> | { error: string };

interface ModelContext {
  registerTool(
    def: {
      name: string;
      description: string;
      inputSchema: {
        type: 'object';
        properties: Record<string, never>;
        additionalProperties: false;
      };
      annotations?: { readOnlyHint?: boolean };
      execute: (args?: Record<string, unknown>) => Promise<WebMcpToolResult> | WebMcpToolResult;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> | void;
}

interface Document {
  modelContext?: ModelContext;
}
```

- [ ] **Step 2: 在 `portal.tsx` 的 `Workspace` 上方加入辅助函数**

紧接在 `STAGES` / `SIGN_OUT` 常量附近、`Workspace` 之前插入：

```tsx
const PROFILE_KEYS=['id','name','email','role','status','language','jurisdiction'] as const;
const CASE_KEYS=['id','code','title','stage','cycle','membership_role','updated_at'] as const;
const GRANT_KEYS=['scope','expires_at','revoked_at'] as const;
const pick=(row:Data,keys:readonly string[])=>Object.fromEntries(keys.map(k=>[k,row[k]]));

async function registerFirstleafReadTools(signal:AbortSignal){
 if(typeof document.modelContext?.registerTool!=='function')return;
 const empty={type:'object' as const,properties:{} as Record<string,never>,additionalProperties:false as const};
 await document.modelContext.registerTool({
  name:'firstleaf_get_profile',
  description:'Private pilot: return the signed-in Firstleaf profile summary for this session (id, name, email, role, status, language, jurisdiction). No long-form interest text. Test data only.',
  inputSchema:empty,
  annotations:{readOnlyHint:true},
  execute:async()=>{try{const data=await api('me');const profile=data.profile as Data;return pick(profile,PROFILE_KEYS)}catch(e){return {error:e instanceof Error?e.message:'SERVICE_UNAVAILABLE'}}}
 },{signal});
 await document.modelContext.registerTool({
  name:'firstleaf_get_overview',
  description:'Private pilot: return cases and directory grants visible to the signed-in user. Case fields: id, code, title, stage, cycle, membership_role, updated_at. Grant fields: scope, expires_at, revoked_at. No report bodies or files. Test data only.',
  inputSchema:empty,
  annotations:{readOnlyHint:true},
  execute:async()=>{try{const data=await api('overview');const cases=((data.cases||[]) as Data[]).map(c=>pick(c,CASE_KEYS));const grants=((data.grants||[]) as Data[]).map(g=>pick(g,GRANT_KEYS));return {cases,grants}}catch(e){return {error:e instanceof Error?e.message:'SERVICE_UNAVAILABLE'}}}
 },{signal});
}
```

- [ ] **Step 3: 在 `Workspace` 内注册 effect**

在 `Workspace` 函数体开头（其它 hooks 旁）增加：

```tsx
 useEffect(()=>{const c=new AbortController();registerFirstleafReadTools(c.signal).catch(()=>{});return()=>c.abort()},[]);
```

确认：`Portal` 在 `status !== 'approved'` 时 early-return，不渲染 `Workspace`，因此待审核不会注册工具。

- [ ] **Step 4: 勾选交付步骤 5**

将 `docs/implementation.md` 中

```markdown
5. [ ] Narrow authorized WebMCP read surface.
```

改为

```markdown
5. [x] Narrow authorized WebMCP read surface.
```

- [ ] **Step 5: 验证**

Run:

```bash
npx tsc --noEmit
node --test tests/policy.test.mjs
npm run lint
```

Expected: `tsc` 零错误；policy 全通过；lint 不新增 `portal.tsx` / `env.d.ts` 问题。

静态核对：搜索 `registerTool` 仅出现在 `Workspace` 路径；工具名仅上述两个；无写操作。

- [ ] **Step 6: 提交**

```bash
git add env.d.ts components/product/portal.tsx docs/implementation.md
git commit -m "feat: register narrow WebMCP read tools on portal"
```

---

## 计划自检

- **规格覆盖**：挂载门禁 → Task 1 Step 3；两工具与白名单 → Step 2；类型 → Step 1；错误 `{error}` → Step 2 execute catch；交付勾选 → Step 4；验证 → Step 5。
- **占位扫描**：无 TBD/TODO。
- **类型一致**：`registerFirstleafReadTools(signal:AbortSignal)` 与 effect 中 `AbortController` 一致；`pick` 使用 `Data`。
