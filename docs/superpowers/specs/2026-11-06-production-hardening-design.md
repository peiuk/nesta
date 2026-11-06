# Production Hardening Design

## Intent

Make the private client portal safer and more reliable under real production traffic without changing its visible business workflow.

## Goals

- Bound upload memory and reject oversized requests before buffering.
- Make client update emails durable, retryable, and observable.
- Add IP-aware OTP throttling while preserving the current email cooldown.
- Move production execution from development mode to the built start command.
- Establish explicit database migration/version checks.
- Reduce lint failures and add predictable pagination for growing admin lists.
- Upgrade dependencies where fixes are available and document unavoidable transitive advisories.

## Non-goals

- No redesign of the portal UI.
- No change to report visibility or role policy.
- No automatic deletion of existing records or storage objects.

## Approach

Use small, tested modules around the existing server primitives. Upload validation remains in policy/server code, notifications gain an outbox abstraction, and pagination is added as an optional query contract so existing clients keep working. Deployment and dependency changes remain operational/documentation changes, not hidden runtime behavior.

## Constraints

- Keep Cloudflare D1/R2-compatible APIs.
- Keep current API error codes where possible.
- Do not expose private report contents in email.
- Every behavior change gets a failing test before implementation.
