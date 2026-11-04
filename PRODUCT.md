# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Chinese-speaking intended parents and families exploring or pursuing a Georgia surrogacy path. English is a parallel communication language, not a secondary afterthought.

**Other audiences (confirmed in product):**

- **Clients (approved):** use the care space for cases, published reports, plan/fees, and directory access when granted.
- **Staff:** administrators, coordinators, and reviewers operate cases, reports, directory, grants, and admin workflows.
- **Prospective visitors:** read the public site for process, fees, clinic context, and FAQ before contacting the team.

## Product Purpose

Nesta (奈斯) coordinates Georgia surrogacy journeys for Chinese-speaking families: consultation and assessment, clinic and travel arrangements, progress and reports, and post-birth paperwork follow-up. Success means clients can understand options, see where they are in the journey, and communicate with a named coordinator in Chinese and English—without Nesta acting as a medical provider or law firm.

The product spans a **public marketing and education surface** (Persuade/Read) and a **signed-in care space** (Operate) with optional **administration** for staff.

## Positioning

**Mechanism others cannot copy without doing the work:** end-to-end bilingual coordination with traceable progress—stages, coordinator visibility, and reports with source, date, version, and review status—plus grant-gated egg and sperm directories inside the case context rather than public donor browsing.

Nesta is the coordination layer; clinical care stays with medical partners (notably LeaderMed in Tbilisi). Legal eligibility, parentage, and document outcomes are confirmed by licensed professionals; Nesta records progress and arrangements.

## Operating Context

- **Geography:** Georgia (Tbilisi clinic partnership); clients often prepare domestically and travel for key steps.
- **Languages:** Chinese (zh-CN default on the public site) and English via in-app locale switching (`components/product/locale`).
- **Channels:** phone and email on the public site; consultation before mandatory registration (`lib/faq.ts`).
- **Journey (typical, adjusted per case):** domestic checks → travel/site visit → written contract → embryo work and storage → transfer → pregnancy follow-up → delivery and newborn care → documents and return travel.
- **Internal engineering name:** “Firstleaf” appears in API markers, alerts, and pilot tooling; the customer-facing brand is **Nesta / 奈斯**.

## Capabilities and Constraints

**Public site**

- Routes: `/`, `/services`, `/process`, `/fees`, `/clinic`, `/faq`; SEO and JSON-LD in `lib/seo.ts`.
- Three programme tiers (A/B/C) and fee copy aligned to the package sheet; main prices in RMB as on the sheet, extras in USD where the sheet shows USD (`lib/public-packages.ts`).
- No identifiable donor samples on public pages; directory access only after sign-in, approval, and grant.

**Client portal (`/portal`)**

- Sign-in (ChatGPT and/or email depending on environment); registration and admin approval before full access.
- Overview, case stages, published reports, plan/fees, egg requests, and directory (egg/sperm) when authorized.
- WebMCP read tools for signed-in pilot sessions (`firstleaf_get_profile`, `firstleaf_get_overview`)—test/pilot scope as described in tool strings.

**Admin (`/admin`)**

- Case, people, directory, grants, reports, FAQ, and operational tooling for approved staff roles.

**Hard product constraints (confirmed or stated in canonical copy)**

- Nesta is **not** a medical provider or law firm; no diagnosis, legal eligibility decisions, or emergency medical contact.
- **Package and fee truth:** amounts and inclusions must stay consistent with `public/nesta-packages.jpg` and related package PDFs; site prices are not an offer—written quote and contract govern tax, invoices, and local fees.
- **No outcome guarantees** for pregnancy, live birth, or sex; contract terms (e.g. preferred sex, protection clauses) follow signed agreements.
- **No payments on the website**; milestones and receipts live in the care space after contract.
- Directory content supports informed choice and coordination; it is **not** medical advice.

**Technical context (existing codebase)**

- Vinext (Next-compatible) on Cloudflare Workers with D1/R2; Drizzle schema; React 19 + Tailwind/shadcn-style UI.
- Dev: `npm run dev` (vinext); production-style local: `npm run start` (wrangler).

## Brand Commitments

- **Name:** Nesta / 奈斯 — tagline on brand: 格鲁吉亚代孕协调 (Georgia surrogacy coordination) — `components/product/brand.tsx`.
- **Voice:** calm, documentary, family-oriented editorial on the homepage; bilingual pairs throughout UI copy; disclaimers visible near hero and packages.
- **Partner naming:** LeaderMed (Tbilisi) as named IVF clinic partner on public and FAQ copy.
- **Contact (public):** `lib/public-contact.ts` — email and UK phone as published on the site.

## Evidence on Hand

| Asset | Path / source |
| --- | --- |
| Package sheet (image) | `public/nesta-packages.jpg` |
| Package PDF (ZH) | `public/firstleaf-packages-zh-v2026-09-09.pdf` |
| Hero / OG imagery | `public/nesta-family.webp` |
| LeaderMed partner photos | `public/partners/leadermed/*` |
| Programme data derived from sheet | `lib/public-packages.ts` |
| FAQ canon | `lib/faq.ts` (`DEFAULT_FAQ`) |

**Do not fabricate:** customer testimonials, success rates, licensing claims beyond FAQ/partner copy, live production URLs if unset, or donor identities on public pages.

## Product Principles

1. **Coordinate, don’t diagnose** — keep medical and legal authority with licensed partners; Nesta owns communication, scheduling, and progress records.
2. **Bilingual by default** — Chinese-first audience with English parity in UI and content pairs.
3. **Permission before intimacy** — sensitive directory and report content only after authentication, approval, and grants.
4. **Sheet-faithful economics** — programme prices and inclusions trace to the package sheet and written contracts, with clear currency rules.
5. **Traceable journey** — stages, coordinator visibility, and report metadata so clients always know what happened and what is next.

## Accessibility & Inclusion

- Public homepage respects `prefers-reduced-motion` for reveal animations (`app/home-view.tsx`).
- No additional compliance standard recorded; treat WCAG improvements as incremental engineering work unless the business sets a target.
