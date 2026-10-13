# Gmail OAuth outbound email (Firstleaf)

中文步骤 + brief English. Goal: send OTP via Gmail API using a **refresh token** (no password). Secrets stay in `.dev.vars` only.

## Prerequisites

- Your Gmail address (e.g. personal or Workspace mailbox that will send OTPs)
- Local Firstleaf repo with Wrangler / `npm run dev`
- Never share your Google password. Only paste `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` (and optional `GMAIL_USER`) into **private** `.dev.vars`.

## 1. Google Cloud project + Gmail API

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create or select a project.
2. **APIs & Services → Library** → enable **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name / support email: fill minimally for testing
   - Scopes: later you only need `https://www.googleapis.com/auth/gmail.send` (least privilege)
   - **Test users**: add **your** Gmail address
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Desktop app**
   - Download / copy **Client ID** and **Client secret**

English: External consent + test user = your Gmail; Desktop OAuth client; enable Gmail API only.

## 2. Get a refresh token once

### Recommended: OAuth 2.0 Playground

1. Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Gear icon → **Use your own OAuth credentials** → paste Client ID + Client secret.
3. Left list → enter scope manually: `https://www.googleapis.com/auth/gmail.send` only (do **not** select broader Gmail scopes).
4. **Authorize APIs** → sign in as the test user / sender mailbox → Allow.
5. **Exchange authorization code for tokens** → copy **Refresh token**.
6. Store it in `.dev.vars` as `GMAIL_REFRESH_TOKEN`. Do not commit.

### Alternative: tiny local script

Any one-shot OAuth desktop flow that requests `gmail.send` and prints the refresh token is fine. Delete the script after; never commit secrets.

## 3. Fill `.dev.vars`

```bash
cp .dev.vars.example .dev.vars
```

Set at least:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...
GMAIL_USER=you@gmail.com
EMAIL_FROM=Firstleaf <you@gmail.com>
SESSION_SECRET=long-random-string
SITE_ORIGIN=http://localhost:3000
```

Notes:

- `GMAIL_USER` / `EMAIL_FROM` must be the **authorized mailbox** (the account that granted `gmail.send`).
- If Gmail OAuth vars are incomplete, Firstleaf falls back to Resend (`RESEND_API_KEY` + `EMAIL_FROM`).
- If neither is configured and `SITE_ORIGIN` is localhost, OTP is logged to the console (dev only).

## 4. Local test

1. `npm run dev`
2. Portal login → **发送验证码** (POST `/api/auth/email/request`)
3. Check the Gmail inbox (and spam)
4. Bad / revoked refresh token should surface as **auth failure** (`EMAIL_AUTH_FAILED`), not a silent success

## Troubleshooting

| Symptom | Likely cause |
|--------|----------------|
| `EMAIL_AUTH_FAILED` | Invalid client secret, revoked refresh token, wrong account, consent not granted for `gmail.send` |
| `EMAIL_SEND_FAILED` | Gmail API / network / quota / malformed MIME |
| Email login disabled in UI | Missing `SESSION_SECRET`, or neither Gmail OAuth nor Resend fully configured |
| Sent but From rejected | `GMAIL_USER`/`EMAIL_FROM` not the authorized mailbox |

## Security

- Refresh token = long-lived send capability for that mailbox. Treat like a password.
- Scope **only** `gmail.send` (not full Gmail read).
- Keep secrets in `.dev.vars` / Cloudflare Worker secrets — never in git, chat, or screenshots.
