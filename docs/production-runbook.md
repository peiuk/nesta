# Nesta production runbook

## Release

1. Run `npm ci` and `npm run prebuild`.
2. Run `npm run build`.
3. Apply the reviewed D1 migrations before starting the new process.
4. Use `npm run start` to smoke-test the built Cloudflare-compatible app with Vite preview; use `npm run start:worker` for Wrangler's local Worker runtime. Neither command deploys production.
5. Before production deployment, replace the placeholder D1 ID in the Cloudflare build configuration with the real database, verify the R2 bucket binding, then deploy the Worker through the configured Cloudflare release pipeline. This project imports `cloudflare:workers` and requires D1/R2 bindings; a plain Node/aaPanel process is not a supported production target.
6. Check `/`, `/admin`, `/portal`, and one authenticated API request against the deployed Worker.

## Current aaPanel observation

On 2026-11-06, the aaPanel file manager showed `/www/wwwroot/nesta` and its terminal showed the running command `node /www/wwwroot/nesta/node_modules/.bin/vinext dev`; that process had logged an HTTP 200 response. This confirms the current site is being served by the development server, not by the production Worker release path described above. A successful page response alone does not verify D1/R2-backed writes, uploads, or notification delivery. Do not treat this observation as production-release validation.

Before changing the live process, determine whether the site should move to Cloudflare Workers (the configured target) or be deliberately ported to a Node deployment target. The current Worker bindings and `cloudflare:workers` imports cannot be made production-ready on aaPanel merely by changing `vinext dev` to `vinext start`; the Node runtime needs a compatible app build and storage/email configuration. Keep the current process unchanged until that target decision and migration are prepared.

## Required environment

- `SITE_ORIGIN=https://nestafamily.com,https://www.nestafamily.com` (comma-separated allowed origins; canonical origin first)
- `SESSION_SECRET` set to a long random secret
- `ADMIN_EMAIL` set to the owner account
- Either the Gmail OAuth variables or Resend variables fully configured
- D1 and R2 bindings available to the process

## Upload verification

- Test one PDF and one image with a small file.
- Confirm the object exists in R2 and the database row is committed.
- Confirm a client notification is sent without private file contents.
- If storage fails, confirm the database does not retain a dangling row.

## Email incident handling

Client updates are stored in the D1 outbox and delivery is attempted immediately after the update is saved. Failures stay in the outbox with exponential backoff, capped at 24 hours between attempts; the queue does not wake itself when the app is idle. Process due items through the authenticated `POST /api/notification-outbox/process` endpoint (maximum 50 per call); review its `sent`, `failed`, and `remaining` counts and provider error logs. Avoid repeating the business mutation to retry a message.

## Rollback

Keep the previous build artifact and environment file. Stop the new process, restore the previous artifact, restart with the deployment target's recorded production command, and verify `/admin` before re-enabling traffic. Never roll back the application without checking whether a database migration has already run.

## Backups

Back up D1 and R2 before schema or storage changes, and periodically perform a restore test into a non-production environment.

## Dependency audit

`npm audit --omit=dev` is clean. The full audit currently reports four moderate findings in the development-only `drizzle-kit` toolchain (`@esbuild-kit/*` and its nested esbuild). npm offers a fix only by downgrading `drizzle-kit` from 0.31.x to 0.18.1, a major backward change; keep the current migration tooling and revisit when the upstream toolchain has a compatible fix. These packages are not included in the production runtime install.
