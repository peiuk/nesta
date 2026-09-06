# Sites private deploy handoff (step 7)

## Locked source

- Branch: `portal-ui`
- Commit: `9ab99c7` (`9ab99c768ed9ef6de29b380dee79f1a31c30e42a`)
- Hosting: `.openai/hosting.json` → `project_id=appgprj_6a9d4f5aac64819193587b0f41052c06`, D1=`DB`, R2=`FILES`
- Build artifact checked: `dist/.openai/hosting.json` + `dist/.openai/drizzle/**`

## Required hosted env

| Key | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Owner email (ChatGPT or email OTP); bootstraps admin/approved |
| `SITE_ORIGIN` | Live origin for same-origin mutation checks (set after URL is known if needed) |
| `SESSION_SECRET` | Pepper for email OTP + session token hashing (required for email sign-in) |
| `RESEND_API_KEY` | Resend API key for sending OTP emails (required in production for email sign-in) |
| `EMAIL_FROM` | From address for OTP mail (e.g. `Firstleaf <noreply@yourdomain>`) |

Do not commit secret values. Local `.env` is gitignored.

## Wizard

Interactive steps live in `scripts/deploy-sites-wizard.sh`.

```powershell
& "C:\Program Files\Git\bin\bash.exe" scripts/deploy-sites-wizard.sh
```

## Login shows「暂时无法读取或保存」

Cause: empty D1 (no `profiles` table). Fixed in commit that adds `lib/ensure-schema.ts` — first authenticated request applies `drizzle/0000_swift_jamie_braddock.sql` if needed.

**Action:** Save + Deploy this commit on Sites, then hard-refresh `/portal`.

## After a successful portal check

1. Mark `docs/implementation.md` step 7 `[x]`.
2. Record the production URL in your private handoff notes (`.env` `SITE_URL` via the wizard).
3. Tell the coding agent: `step 7 succeeded with URL <SITE_URL>`.
