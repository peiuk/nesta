# Firstleaf private pilot implementation

Continue the approved Chinese/English website and customer/case workspace design. Private pilot: test records only until business and data governance arrangements are confirmed.

## Architecture and limits
- Vinext/React Cloudflare Worker; D1 structured records; R2 private files.
- Generated ChatGPT sign-in identifies users; registration creates a persistent app profile. No app-owned passwords.
- ADMIN_EMAIL bootstraps the business owner from verified identity, never from submitted profile fields. Client profiles start pending.
- App roles: admin, coordinator, reviewer, client. Case membership separately limits access; staff status does not automatically grant medical record access.
- Report flow: draft upload, independent review, coordinator publication. No self-review. Client access requires published state and explicit recipient membership.
- Directory grants expire and are separately revoked. Profile status, scope and expiry are checked on every request.
- Private PDF/JPEG/PNG attachments, maximum 8 MiB, MIME/signature checks, no-store authenticated downloads. Antivirus is not integrated in this test pilot.
- Prepared SQL, bounded inputs, same-origin mutation checks, independent audit events. Schema changes use migrations only.
- Private deployment remains owner-only. Allowing real clients/staff later requires a deliberate Sites access policy change.

## Delivery steps
1. [ ] Shared theme, first homepage slice, successful compile and local handoff.
2. [ ] Failing authorization/workflow tests, then policy implementation.
3. [ ] Database schema, migration, authenticated API and private file access.
4. [x] Registration, client portal, directory, cases, report upload/review/publication, team and grants.
5. [x] Narrow authorized WebMCP read surface.
6. [x] Policy and database workflow tests, typecheck/build, migration inspection.
7. [ ] Exact source commit, private deployment, successful status and site handoff.

Before real patient use: confirm clinic/reviewer team, legal/consent text, storage jurisdiction, retention, backup process and security review. This milestone implements a working private pilot, not those operational approvals.
