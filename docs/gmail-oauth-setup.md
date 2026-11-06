# Gmail OAuth outbound email (Firstleaf)

中文步骤 + brief English. Goal: send OTP via Gmail API using a **refresh token** (no password). Local secrets stay in `.dev.vars`; production secrets belong in the deployment secret store.

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
   - For the OAuth Playground flow below, choose **Web application**.
   - Add `https://developers.google.com/oauthplayground` as an authorised redirect URI.
   - Copy the **Client ID** and **Client secret**.
5. In the OAuth app branding/configuration, set the homepage to `https://nestafamily.com` and the privacy policy URL to `https://nestafamily.com/privacy` (not the homepage URL). Keep the privacy policy linked from the public site homepage.

English: External consent + test user = your Gmail; Web application OAuth client for Playground; enable Gmail API only.

## 2. Get a refresh token once

### Recommended: OAuth 2.0 Playground

1. Open [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Gear icon → **Use your own OAuth credentials** → paste Client ID + Client secret.
3. Left list → enter scope manually: `https://www.googleapis.com/auth/gmail.send` only (do **not** select broader Gmail scopes).
4. **Authorize APIs** → sign in as the test user / sender mailbox → Allow.
5. **Exchange authorization code for tokens** → copy **Refresh token**.
6. Store it in `.dev.vars` as `GMAIL_REFRESH_TOKEN`. Do not commit.
7. If the response has no refresh token, set Access type to **Offline** and Force prompt to **Consent Screen**, then authorise again.

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
EMAIL_FROM=Nesta <you@gmail.com>
SESSION_SECRET=long-random-string
SITE_ORIGIN=http://localhost:3000
```

Notes:

- `GMAIL_USER` is the Google account that granted `gmail.send`. `EMAIL_FROM` controls the visible sender name and address. If it uses a different address (for example `noreply@nestafamily.com`), add and verify that address in Gmail's **Send mail as** settings first; the Gmail API cannot send from an unverified alias.
- An External OAuth app left in **Testing** may receive refresh tokens that expire after 7 days for the Gmail send scope. For persistent use, publish the app and complete any verification Google requires.
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
