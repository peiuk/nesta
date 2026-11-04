---
name: Nesta
description: 格鲁吉亚代孕协调 — 暖色编辑风公开站 + 同一色系的工具化门户
colors:
  home-ink: "#203e32"
  home-paper: "#f8f7f2"
  home-gold: "#a48955"
  home-sage-band: "#e8ede4"
  home-cream: "#fffdf8"
  primary: "#284e3c"
  primary-foreground: "#ffffff"
  background: "#f6f6f0"
  foreground: "#263e35"
  secondary: "#eaf0e7"
  muted-foreground: "#617167"
  border: "#dbe2d8"
  ring: "#62886d"
  destructive: "#a33130"
typography:
  display:
    fontFamily: "'Fraunces', 'Source Serif 4', Georgia, serif"
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Fraunces', 'Source Serif 4', Georgia, serif"
    fontSize: "clamp(1.65rem, 2.4vw, 2.5rem)"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "'Source Sans 3', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Source Sans 3', 'Segoe UI', 'Microsoft YaHei', sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    letterSpacing: "0.16em"
    lineHeight: 1.4
rounded:
  editorial-sm: "4px"
  editorial-md: "6px"
  product-md: "9px"
  product-lg: "16px"
  product-xl: "18px"
  pill: "999px"
spacing:
  gutter: "5vw"
  section-y: "88px"
  section-y-tablet: "60px"
  section-y-mobile: "52px"
  workspace-max: "1350px"
  editorial-max: "1600px"
components:
  button-primary-editorial:
    backgroundColor: "{colors.home-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.editorial-sm}"
    padding: "14px 26px"
  button-primary-editorial-hover:
    backgroundColor: "{colors.home-ink}"
    textColor: "#ffffff"
    rounded: "{rounded.editorial-sm}"
    padding: "14px 26px"
  button-primary-product:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.product-md}"
    padding: "11px 19px"
  button-ghost-product:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.product-md}"
    padding: "11px 19px"
  card-panel:
    backgroundColor: "{colors.primary-foreground}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.product-lg}"
    padding: "24px"
---

# Design System: Nesta

## Overview

**Creative North Star: "The Georgian Garden Ledger"**

Nesta reads like a family journey recorded in a calm, bilingual ledger—not a fertility startup landing page. Public surfaces use an editorial layout: warm paper backgrounds, deep garden ink type, gold-brown eyebrows, and numbered sections that feel documentary rather than promotional. The signed-in workspace keeps the same botanical palette but shifts to clearer panels, tables, and shadcn/Base UI controls so coordinators and clients can scan status quickly.

Depth is **tonal-first**: sections change background (`#f8f7f2`, `#e8ede4`, `#fffdf8`, `#203e32` bands) and hairline borders before shadows appear. Shadows stay soft and sparse—hero care notes, option-card hover, download CTAs—not glassmorphism or heavy elevation stacks.

**Key Characteristics:**

- Two faces, one palette: **`.home-editorial`** (Persuade/Read) vs **`.workspace`** / product tokens (Operate).
- Display type in **Fraunces**; UI and long copy in **Source Sans 3** with **Microsoft YaHei** in the CJK stack.
- Primary actions use filled deep green; secondary actions use underline links or quiet bordered buttons.
- Section eyebrows use uppercase tracking and gold accent rules—not generic pill badges.
- Motion respects `prefers-reduced-motion`; scroll reveals are optional enhancement, not required to understand content.

## Colors

The palette is muted botanical green with warm paper neutrals and restrained gold accents—trustworthy and familial, never neon “wellness” or clinical blue.

### Primary

- **Garden Ledger Ink** (`#203e32`): Editorial hero ink, service strip background, CTA bands, primary filled links on the public homepage (`--home-ink`).
- **Coordination Forest** (`#284e3c`): Portal/admin primary, stage banners, focus rings, and shadcn `primary` token (`--primary` in `app/product.css`).

### Secondary

- **Mist Sage Band** (`#e8ede4`): Journey section fills and hero gradient split (`60%` paper / `40%` sage on wide viewports).
- **Leaf Wash** (`#eaf0e7`): Secondary surfaces, notices, report review backgrounds (`--secondary`).

### Tertiary

- **Harvest Gold** (`#a48955`): Eyebrow accents, timeline numerals, inclusion index color, CTA eyebrow on dark bands (`--home-gold`).

### Neutral

- **Warm Paper** (`#f8f7f2` / `#f6f6f0`): Page backgrounds (`--home-paper`, `--background`).
- **Ledger Cream** (`#fffdf8`): Cards, partner tiles, package tiles on tinted sections.
- **Garden Text Muted** (`#617167` / `#5d6b60`): Body secondary, disclaimers, metadata (`--muted-foreground` and editorial copy colors).
- **Hairline Sage** (`#dbe2d8` / `#dce1d5`): Borders and dividers (`--border`, editorial card borders).
- **Focus Sage** (`#62886d`): Focus outlines on product surfaces (`--ring`).

### Named Rules

**The Two-Green Rule.** Public editorial ink (`#203e32`) and product primary (`#284e3c`) are close cousins—never introduce a third unrelated accent green on the same screen. Gold is for labels and indices, not full-width fills.

**The Tonal Band Rule.** Prefer a new section background or top border to separate content; do not stack more than one decorative shadow on a static block.

## Typography

**Display Font:** Fraunces (with Source Serif 4, Georgia)  
**Body Font:** Source Sans 3 (with Segoe UI, Microsoft YaHei)  
**Label/Mono Font:** Source Sans 3 for labels; Consolas for monospace (`--font-geist-mono`)

**Character:** Fraunces gives headlines a soft editorial authority; Source Sans 3 keeps forms and tables legible at 16px with generous line-height for bilingual paragraphs.

### Hierarchy

- **Display** (500, `clamp(2.4rem, 4.4vw, 4.4rem)`, line-height ~1.28): Homepage hero (`home-editorial`); em emphasis in `#768367`, not italic neon.
- **Headline** (500, section `clamp(1.65rem, 2.4vw, 2.5rem)`, line-height ~1.45): Section intros (`OUR SERVICES`, journey, packages).
- **Title** (500–600, ~1.05–1.35rem): Card titles, panel headings, FAQ questions.
- **Body** (400, 16px / 0.9–1.06rem editorial, line-height 1.65–1.95): Paragraphs; keep ~65–75ch on long guide copy where `.section-intro` already constrains width.
- **Label** (600, 0.7–0.8rem, letter-spacing 0.13–0.16em, uppercase eyebrows): Section indices (`01 / OUR SERVICES`), package tags.

### Named Rules

**The Eyebrow Rule.** Section labels are small caps with tracking and optional gold rule—never default shadcn `Badge` styling on public editorial pages.

**The Bilingual Pair Rule.** Chinese and English strings share the same hierarchy; do not shrink English to “secondary” gray unless it is genuinely metadata.

## Layout

Public editorial pages use horizontal **5vw gutters** (22px on small breakpoints), max content around **1600px** on hero/header, with optional centering cap near **1440px** on very wide screens. Section vertical rhythm: **88px** desktop → **60px** tablet → **52px** mobile.

`.section-intro` is a two-column flex: headline block left, supporting copy right (~400px max); stacks to single column ≤900px.

Grids: 3-column options/packages on desktop; 2-column journey; partner blocks collapse to single column ≤900px. Portal workspace content lives in **max-width 1350px** centered `workspace-main` with **24–32px** padding.

Breakpoints align with existing CSS: **1000px**, **900px**, **650px** (nav desktop links hidden `.nav-desk` on small phones).

## Elevation & Depth

This system is **tonal-first**. Depth comes from background shifts (`#f0f1e9` packages section, `#eef2e8` partner band, `#203e32` service strip), 1px borders, and inset featured package top bar—not floating cards everywhere.

Shadows are **accent responses**: hero care note (`0 14px 35px #203e3212`), option card hover (`0 12px 28px #203e320c`), package download button (`0 6px 16px rgba(40,78,60,.18)`). No drop shadows on default resting editorial cards.

### Shadow Vocabulary

- **Care note float** (`0 14px 35px #203e3212`): Floating proof strip on hero imagery only.
- **Card hover lift** (`0 12px 28px #203e320c`): Options grid hover (disabled under reduced motion).
- **Product download** (`0 6px 16px rgba(40,78,60,.18)`): Document download CTA on fees/packages flows.

### Named Rules

**The Flat-At-Rest Rule.** Editorial package and partner cards use borders only until interaction (hover) or semantic emphasis (featured inset bar).

## Shapes

**Editorial face:** Tight corners—**4px** primary buttons, **6px** cards, **5px** care notes; hero photo uses an organic **44% / 8px** silhouette (arch + flat base), not generic `rounded-2xl`.

**Product face:** Softer UI—**9px** on `.primary-link` / `.quiet-link`, **16–18px** panels and auth cards, **12px** summary tiles. Brand mark uses an asymmetric leaf tile: **22px 4px** radius on `.brand-icon`.

Chips on partner services use **pill (999px)** with 1px sage border. Featured package uses **inset 4px top bar** `#63794e` instead of a glowing outline.

## Components

### Buttons

- **Shape:** Editorial 4px radius; product 9px (`rounded-lg` on shadcn Button).
- **Primary:** Filled garden ink (public) or `--primary` (portal); min-height **44–52px** on marketing CTAs.
- **Hover / Focus:** Editorial links use `filter: brightness(1.08)`; product uses `--ring` **3px** outline offset **3px**; shadcn buttons use ring/50.
- **Secondary / Ghost:** `.quiet-link` bordered `#dbe2d8`; `.hero-process-link` and `.network-more` are text links with bottom border `#203e3230`.

### Chips (if used)

- **Style:** Partner service pills—`#f4f7f0` fill, `#d5dfc9` border, `#3d5144` text.
- **State:** Package tags use `#e9eee1` / `#596f45` (editorial), or primary-tint pill on product grid.

### Cards / Containers

- **Corner Style:** 6px editorial; 16px `.panel` / `.donor-card`.
- **Background:** `#fffdf8` or white on tinted sections; panels use `--card`.
- **Shadow Strategy:** See Elevation—borders default, shadow on hover or download only.
- **Border:** 1px `#dce1d5` / `var(--border)`.
- **Internal Padding:** 24–30px editorial cards; 23–24px donor cards.

### Inputs / Fields

- **Style:** 1px `--input` / `#c9d4c7` borders; 12px radius on fields; file inputs styled with green selector button (`#254c3b`).
- **Focus:** 3px `--ring` outline on links/buttons; package disclosure uses `#63794e` outline.
- **Error / Disabled:** `.error-banner` `#fbe9e5` / `#8c2c29`; destructive token `#a33130`.

### Navigation

- **Public header:** Flex brand + nav; desktop links + language switch + filled “Client sign-in”. Sticky editorial FAQ header matches paper background.
- **Workspace header:** `.workspace-header` white bar, compact nav with shadcn ghost/secondary tab buttons.
- **Mobile:** Hide `.nav-desk`; keep primary sign-in and language control reachable (min 44px targets).

### Signature Components

- **Hero care note:** White/cream floating strip with FileHeart-style icon capsule and documentary copy—only on homepage hero.
- **Journey grid markers:** 9px sage dots on timeline borders; large Fraunces step numerals in `#8b9c7e`.
- **Stage banner:** Full-width `--primary` panel in portal for case stage emphasis.

## Do's and Don'ts

### Do:

- **Do** use `.home-editorial` tokens (`--home-ink`, `--home-paper`, `--home-gold`) on public marketing and guide pages that import `home.css`.
- **Do** use `app/product.css` semantic tokens for portal, auth, admin, and shadcn components.
- **Do** keep CTAs at least **44px** tall on touch targets (already enforced on key links).
- **Do** respect `prefers-reduced-motion` by disabling reveal/hover translate patterns already scoped in CSS.

### Don't:

- **Don't** import generic gray shadcn defaults on the editorial homepage—they override the warm paper world.
- **Don't** use saturated medical blue, gradient hero clichés, or stock “happy doctor” tropes on public surfaces.
- **Don't** round editorial primary buttons to pill shapes—the 4px corner is part of the ledger identity.
- **Don't** add heavy box-shadow stacks to static content blocks; use tonal bands instead.
