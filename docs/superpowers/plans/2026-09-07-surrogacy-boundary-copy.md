# 代孕协调边界文案 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页与隐私页公开写明格鲁吉亚代孕协调，并补充非医疗/非律所服务边界。

**Architecture:** 仅改中英 `t()` 文案与首页一小段 `#boundaries`；沿用现有 section / nav-desk 模式；可选极少量 CSS。

**Tech Stack:** React 首页 `app/page.tsx`、隐私 `app/privacy/page.tsx`、`app/product.css`、`useLocale().t()`。

## Global Constraints

- 规格：`docs/superpowers/specs/2026-09-07-surrogacy-boundary-copy-design.md`
- 公开直接使用「代孕」；克制语气；无成功率/虚假背书/价格承诺
- 不改门户、API、策略、数据库
- 提交用 PowerShell 友好的 `git commit -m "..."`（勿用 bash HEREDOC）

## File Structure

| 文件 | 责任 |
| --- | --- |
| `app/page.tsx` | 首屏、care、journey、boundaries、CTA、nav |
| `app/privacy/page.tsx` | 服务边界扩写 |
| `app/product.css` | 边界段间距（仅必要时） |

---

### Task 1: 首页文案与边界段

**Files:** `app/page.tsx`，必要时 `app/product.css`

- [ ] **Step 1:** 更新首屏副文与小字；care 三条轻贴代孕案件语境；journey 四步按规格改写
- [ ] **Step 2:** 在 journey 与 CTA 之间插入 `#boundaries` 短段（2–3 句）；桌面 nav 增加 `nav-desk` 链到 `#boundaries`
- [ ] **Step 3:** CTA 一句提示可先阅读服务边界
- [ ] **Step 4:** 若边界段缺间距，用现有 `section-intro` / 轻量 padding class，避免新卡片风
- [ ] **Step 5:** 提交 `fix: clarify Georgia surrogacy coordination boundaries on homepage`

### Task 2: 隐私页服务边界

**Files:** `app/privacy/page.tsx`

- [ ] **Step 1:** 扩写「服务边界」中英，与首页语义一致
- [ ] **Step 2:** 提交 `docs: strengthen privacy service-scope for surrogacy coordination`（若仅文案也可用 `fix:`）

### Task 3: 验收

- [ ] 目视：中/英切换下首屏含代孕协调；`#boundaries` 含非医疗/非律所/不承诺结果
- [ ] 确认未改 `components/product/portal.tsx` 等门户文件
