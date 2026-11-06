# Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden uploads, email delivery, OTP abuse controls, production startup, migrations, pagination, lint, and dependency hygiene.

**Architecture:** Add focused pure helpers and database-backed outbox/rate-limit records around the existing `lib/server.ts` flow. Preserve existing response codes and make new query parameters backward-compatible.

**Tech Stack:** TypeScript, Cloudflare D1/R2 bindings, Vinext, Node test runner, Oxlint, npm audit.

**Spec:** `docs/superpowers/specs/2026-11-06-production-hardening-design.md`

## Global Constraints

- Preserve current authorization and notification privacy behavior.
- Keep D1/R2-compatible APIs and existing routes.
- Tests must be written and observed failing before production code changes.

## Review Focus

- Concurrent uploads must not buffer more than the configured request budget.
- A failed email must remain retryable and must not duplicate indefinitely.
- OTP requests from one IP must be throttled even across different emails.
- Existing API consumers without pagination parameters must keep working.
- A fresh worker must not rerun destructive data rewrites.

### Task 1: Upload request budgeting

**Files:**
- Modify: `lib/server.ts:268-281,498-505`
- Test: `tests/policy.test.mjs`

- [x] Add failing tests for missing/oversized content length and per-file/batch limits.
- [x] Implement early request-budget validation and avoid duplicate buffer copies where possible.
- [x] Run focused upload tests, then the full suite.

### Task 2: Notification outbox and retry policy

**Files:**
- Create: `lib/notification-outbox.ts`
- Modify: `lib/client-notifications.ts`, `lib/server.ts`, `drizzle/0010_notification_outbox.sql`
- Test: `tests/client-notifications.test.mjs`

- [x] Add failing tests for durable enqueue, retry backoff, and idempotency keys.
- [x] Implement an outbox row keyed by update/case/recipient, with bounded retries and status.
- [x] Keep mutation responses successful after enqueue; add a processing helper for cron/maintenance use.
- [x] Run notification tests and the full suite.

### Task 3: IP-aware OTP throttling

**Files:**
- Modify: `lib/server.ts`, `drizzle/0010_notification_outbox.sql` or a separate migration
- Test: `tests/email-auth.test.mjs`

- [x] Add failing tests for per-IP windows, cooldown, and reset after expiry.
- [x] Implement bounded D1-backed counters using the existing request IP extraction.
- [x] Run auth tests and the full suite.

### Task 4: Explicit migration guard

**Files:**
- Modify: `lib/ensure-schema.ts`
- Create: `drizzle/0011_schema_version.sql`
- Test: `tests/migration.test.mjs`

- [x] Add failing tests proving schema version is checked and legacy rewrites are not repeated.
- [x] Implement versioned migration bookkeeping while retaining first-run compatibility.
- [x] Run migration tests and the full suite.

### Task 5: Pagination contract

**Files:**
- Modify: `lib/server.ts`
- Test: `tests/admin-operations.test.mjs`

- [x] Add failing tests for default and bounded `limit/offset` handling.
- [x] Implement shared integer parsing and pagination metadata for people, cases, audit, grants, and partners.
- [x] Run focused API tests and the full suite.

### Task 6: Lint and dependency cleanup

**Files:**
- Modify: affected components reported by `npm run lint`, `package.json`, `package-lock.json`
- Test: lint command and build

- [x] Fix internal navigation links, accessibility violations, unsafe ref access, and avoidable `any`/stringification errors.
- [x] Upgrade dependencies with available security fixes without changing runtime behavior.
- [x] Run lint, tests, build, and audit; document advisories with no compatible upstream fix.

### Task 7: Production runbook

**Files:**
- Modify: `docs/admin-guide.md`
- Create: `docs/production-runbook.md`

- [x] Document the repository's actual `build`, `start` (Vite preview), and `start:worker` commands, environment checks, restart/rollback, migration order, backups, and notification retry operations.
- [x] Inspect the current aaPanel process and document that it is running `vinext dev`; record that this is not production-release validation and that changing the target requires a planned migration.
