# 首页设计感升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把官网首页升级为静谧自然气质：全幅绿植/晨雾主视觉、展示衬线字体、去卡片化分区，并保留既有中英文案与试用边界。

**Architecture:** 只动落地页表层。`app/layout.tsx` 引入 Fraunces + Source Sans 3；`public/hero-canopy.jpg` 作为首屏全幅背景；`app/page.tsx` 调整 markup（顶栏叠在首屏上、服务/旅程去卡片结构、CTA 全宽）；`app/product.css` 重写首页相关样式与 3 处动效。门户与 API 不动。

**Tech Stack:** Vinext/React 19、纯 CSS（`app/product.css`）、Google Fonts（link）、一张静态 JPG、页面内轻量 `IntersectionObserver`（旅程显现）。

## Global Constraints

- 设计依据：`docs/superpowers/specs/2026-09-06-homepage-design.md`。
- 气质：静谧自然；家庭感只留文案，**禁止**宝宝/全家福/孕妇大特写主视觉。
- 主色沿用 `--primary: #284e3c`；避免奶油+赤陶、紫系、默认深色营销风。
- 展示字体 Fraunces，正文 Source Sans 3；禁止 Inter/Roboto/Arial/系统默认作主展示。
- 首屏只含：品牌、一句标题、一句说明、一组 CTA、试用脚注；无统计/徽章浮层。
- 保留中英 `t()`、试用提示、`/portal`、`/privacy`；不新增虚假医疗/法律承诺。
- 动效尊重 `prefers-reduced-motion: reduce`。
- 分支：`portal-ui`。工作区已有未提交的 `app/page.tsx` / `app/product.css` / `components/product/locale.tsx` 改动——Task 2 起以规格为准覆盖首页相关部分；`locale.tsx` 若与首页无关则不要回滚。
- 验证：`npx tsc --noEmit`、`npm run lint`；本地 `npm run dev` 打开 `/` 目视检查。

## File Structure

| 文件 | 责任 |
| --- | --- |
| `public/hero-canopy.jpg`（新建） | 全幅主视觉：柔光林冠/绿植晨雾，无人像婴儿 |
| `app/layout.tsx`（改） | Google Fonts preconnect + stylesheet；`html` 挂字体 class 变量 |
| `app/page.tsx`（改） | 首页结构：叠层顶栏、全幅 hero、服务、旅程、全宽 CTA、页脚；旅程 IO 动效 |
| `app/product.css`（改） | 字体变量、首页全套样式与动效；门户样式尽量不动 |

---

### Task 1: 主视觉资源

**Files:**
- Create: `public/hero-canopy.jpg`

**Interfaces:**
- Consumes: 无。
- Produces: 静态资源路径 `/hero-canopy.jpg`，供 Task 3 CSS `background-image` 使用。宽边约 1920px，JPG，色调偏雾绿/晨光，**无人物婴儿、无文字水印**。

- [ ] **Step 1: 生成或取得图片**

用 Cursor `GenerateImage`（规格已要求该资产）生成，参数建议：

- description: `Soft morning mist through a quiet green forest canopy, gentle natural light, calm and private atmosphere, no people, no babies, no text, photographic, muted sage and deep green tones, wide landscape`
- filename: `hero-canopy.jpg`
- aspect_ratio: `16:9`

若工具把文件存到别处，复制到仓库：

```powershell
Copy-Item -Force "<generated-path>" "public/hero-canopy.jpg"
```

- [ ] **Step 2: 目视确认**

打开 `public/hero-canopy.jpg`：确认无婴儿/全家福/水印；色调与深绿品牌可协调。不合格则重新生成一次。

- [ ] **Step 3: 提交**

```powershell
git add public/hero-canopy.jpg
git commit -m "assets: add quiet canopy hero image for homepage"
```

---

### Task 2: 字体引入

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/product.css`（仅 `:root` 字体变量与 `body`/`h1,h2` 字体族）

**Interfaces:**
- Consumes: 无。
- Produces: CSS 变量 `--font-display: 'Fraunces', ...` 与 `--font-geist-sans: 'Source Sans 3', ...`（沿用现有变量名以少改门户）；`html` 上可无额外 class，靠全局 CSS 变量即可。

- [ ] **Step 1: 更新 layout 引入字体**

把 `app/layout.tsx` 换成：

```tsx
import type { Metadata } from 'next';
import { LocaleProvider } from '@/components/product/locale';
import './globals.css';
import './product.css';

export const metadata: Metadata = {
  title: '初禾 FIRSTLEAF · 生育服务协调',
  description: '中文与英文客户服务空间：个别评估、案件进度与私密报告交付。',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Source+Sans+3:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
```

（若 Vinext 不允许手写 `<head>`，改为在 `app/product.css` 顶部 `@import url('https://fonts.googleapis.com/css2?family=Fraunces:...')`，效果等价。）

- [ ] **Step 2: 改 product.css 字体变量**

在 `app/product.css` 的 `:root{...}` 内，把：

```css
--font-geist-sans:'Segoe UI','Microsoft YaHei',sans-serif;
```

改为：

```css
--font-geist-sans:'Source Sans 3','Segoe UI','Microsoft YaHei',sans-serif;--font-display:'Fraunces','Source Serif 4',Georgia,serif;
```

并在文件靠前（`body` 规则附近）追加：

```css
h1,h2,.hero-brand strong,.journey-grid article>span,.brand strong{font-family:var(--font-display)}
```

- [ ] **Step 3: 类型检查**

Run: `npx tsc --noEmit`
Expected: 零错误（或不少于当前分支基线；不得因 layout 新增错误）

- [ ] **Step 4: 提交**

```powershell
git add app/layout.tsx app/product.css
git commit -m "feat: add Fraunces and Source Sans 3 for marketing typography"
```

---

### Task 3: 首页结构 + 全套样式与动效

**Files:**
- Modify: `app/page.tsx`（整文件替换为下方实现）
- Modify: `app/product.css`（替换/增补首页相关选择器；保留门户 `.workspace*` 等规则）

**Interfaces:**
- Consumes: `/hero-canopy.jpg`（Task 1）；`--font-display` / `--font-geist-sans`（Task 2）。
- Produces: 可访问的 `/` 落地页；class 约定：`home-shell`、`home-hero`、`hero-media`、`hero-shade`、`hero-copy`、`hero-brand`、`reveal`、`is-in`、`service-strip`、`journey-section`、`journey-grid`、`cta-band`、`site-header`（`.home-shell` 内为叠层透明顶栏）。

- [ ] **Step 1: 重写 `app/page.tsx`**

```tsx
'use client';
import {useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowRight,ShieldCheck,FileHeart,MessagesSquare,Sprout} from 'lucide-react';
import {Brand} from '@/components/product/brand';
import {LanguageButton,useLocale} from '@/components/product/locale';

export default function Home(){
 const {t}=useLocale();
 const journeyRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  const root=journeyRef.current;if(!root)return;
  const items=[...root.querySelectorAll('.reveal')];
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(el=>el.classList.add('is-in'));return}
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:.2});
  items.forEach(el=>io.observe(el));
  return ()=>io.disconnect();
 },[]);
 return <div className="home-shell">
  <div className="pilot-strip">{t('私密试用版 · 请使用测试资料','Private pilot · Please use test data')}</div>
  <header className="site-header"><Brand/><nav><a href="#journey">{t('服务旅程','The journey')}</a><a href="#care">{t('我们的服务','Our care')}</a><LanguageButton/><a className="primary-link" href="/portal">{t('客户登录','Client sign-in')}<ArrowUpRight size={17}/></a></nav></header>
  <main>
   <section className="home-hero">
    <div className="hero-media" aria-hidden="true"/>
    <div className="hero-shade" aria-hidden="true"/>
    <div className="hero-copy">
     <div className="hero-brand hero-rise" aria-label="初禾 FIRSTLEAF"><span className="hero-mark"><Sprout size={28}/></span><div><strong>初禾 <span>FIRSTLEAF</span></strong><small>FAMILY CARE COORDINATION · GEORGIA</small></div></div>
     <h1 className="hero-rise delay-1">{t('迈向家庭的每一步，','Each step toward family,')}<br/><em>{t('都有清晰的陪伴。','with care and clarity.')}</em></h1>
     <p className="hero-rise delay-2">{t('从初步了解到治疗协调、孕期随访与出生后手续——每一次沟通、每一份报告，都有清楚记录。','From first questions to treatment coordination, pregnancy follow-up and post-birth paperwork — every conversation and report stays clearly recorded.')}</p>
     <div className="hero-actions hero-rise delay-3"><a href="/portal" className="primary-link">{t('开始保密咨询','Start a private consultation')}<ArrowRight size={17}/></a><a href="#journey" className="quiet-link">{t('了解服务流程','Explore the journey')}<ArrowUpRight size={17}/></a></div>
     <small className="hero-rise delay-3">{t('私密试用版 · 具体服务须经个别法律与医疗评估。','Private pilot · Services are subject to individual legal and clinical assessment.')}</small>
    </div>
   </section>
   <section id="care" className="service-strip">{[[ShieldCheck,t('私密的服务空间','A private care space'),t('身份验证后建立档案；阶段与负责人按人、按案件可见。','Create your profile after sign-in. Stages and a named coordinator stay visible by person and case.')],[FileHeart,t('可追溯的报告','Traceable reports'),t('原件与复核译稿按权限交付；来源、日期、版本与复核状态完整记录。','Originals and reviewed translations shared privately — source, date, version and review status recorded together.')],[MessagesSquare,t('持续的双语沟通','Ongoing bilingual support'),t('专属协调员跟进问题，让下一步更明确。','A named coordinator follows your questions and next steps.')]].map(([Icon,title,description],i)=>{const I=Icon as typeof ShieldCheck;return <article key={i}><span className="service-index">0{i+1}</span><I size={22} strokeWidth={1.5}/><h3>{title as string}</h3><p>{description as string}</p></article>})}</section>
   <section className="journey-section" id="journey" ref={journeyRef}><div className="section-intro"><div><div className="eyebrow">YOUR JOURNEY</div><h2>{t('先了解，再从容决定。','Understand first. Decide with confidence.')}</h2></div><p>{t('每个家庭的路径不同，流程会根据实际评估与医院安排调整。','Every family’s path is different. Your plan follows individual assessment and clinical arrangements.')}</p></div><div className="journey-grid">{[[t('沟通与评估','Consultation & assessment'),t('了解需求，确认所需资料及服务适用范围。','Discuss your needs, documents and applicable service scope.')],[t('计划与协调','Planning & coordination'),t('明确医院安排、费用范围和各方责任。','Clarify clinic arrangements, fee scope and responsibilities.')],[t('记录与随访','Records & follow-up'),t('逐次记录治疗、检查和沟通，及时交付报告。','Record treatment, checks and conversations; share reviewed reports.')],[t('出生后支持','Post-birth support'),t('分别跟进出生登记、亲权和旅行文件。','Track birth registration, parentage and travel documentation.')]].map((x,i)=><article key={i} className="reveal" style={{transitionDelay:`${i*90}ms`}}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div></section>
   <section className="cta-band"><div><h2>{t('从一次坦诚的沟通开始。','Begin with an honest conversation.')}</h2><p>{t('登录后填写基本意向，医疗资料将在需要时另行收集。','Sign in to share your initial interests. Medical records are requested separately when needed.')}</p></div><a href="/portal" className="primary-link on-dark">{t('建立我的档案','Create my profile')}<ArrowUpRight size={18}/></a></section>
  </main>
  <footer className="site-footer"><Brand/><span>{t('暂定品牌 · 格鲁吉亚生育服务协调','Working brand · Georgia family care coordination')}</span><a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></footer>
 </div>;
}
```

- [ ] **Step 2: 用下列规则替换 `app/product.css` 中首页相关段**

保留文件开头 `:root`/`.dark`（Task 2 已改字体）以及从 `.auth-page` 起的门户样式。删除或覆盖旧的 `.pilot-strip` … `.cta-band` 与对应 media query 首页规则，改为：

```css
.home-shell{background:linear-gradient(180deg,#f3f5ef 0%,#eef2ea 40%,#f6f6f0 100%);color:var(--foreground)}
.home-shell .pilot-strip{position:relative;z-index:3;text-align:center;background:rgba(234,240,231,.82);backdrop-filter:blur(8px);padding:7px 16px;font-size:.8rem;letter-spacing:.03em;border-bottom:1px solid rgba(219,226,216,.7)}
.home-shell .site-header{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:18px max(5vw,24px);background:rgba(246,246,240,.72);backdrop-filter:blur(12px);border-bottom:1px solid rgba(219,226,216,.55)}
.home-shell .site-header nav{display:flex;align-items:center;gap:22px;font-size:.9rem;flex-wrap:wrap}
.home-shell .site-header nav>a:not(.primary-link){color:var(--foreground)}
.home-hero{position:relative;min-height:min(92vh,920px);display:grid;align-items:end;padding:clamp(72px,12vw,140px) max(5vw,24px) clamp(56px,8vw,96px);overflow:hidden;color:#f4f7f1}
.hero-media{position:absolute;inset:-4%;background:center/cover no-repeat url('/hero-canopy.jpg');animation:hero-drift 28s ease-in-out infinite alternate;will-change:transform}
.hero-shade{position:absolute;inset:0;background:linear-gradient(115deg,rgba(20,40,30,.78) 0%,rgba(28,52,38,.55) 42%,rgba(36,60,45,.28) 100%),linear-gradient(0deg,rgba(20,34,28,.55),transparent 55%)}
.hero-copy{position:relative;z-index:1;max-width:720px}
.hero-brand{display:inline-flex;align-items:center;gap:16px;margin-bottom:28px;color:inherit}
.hero-mark{width:56px;height:60px;border-radius:28px 6px 28px 6px;background:rgba(244,247,241,.92);color:var(--primary);display:grid;place-items:center;flex-shrink:0}
.hero-brand strong{display:block;font-size:clamp(1.9rem,4vw,2.85rem);letter-spacing:.06em;font-weight:500;line-height:1.15;font-family:var(--font-display)}
.hero-brand strong span{font-size:.48em;letter-spacing:.16em;margin-left:10px;opacity:.88}
.hero-brand small{display:block;margin-top:8px;font-size:.7rem;letter-spacing:.16em;opacity:.82;font-family:var(--font-geist-sans)}
.home-hero h1{font-family:var(--font-display);font-size:clamp(1.7rem,3.2vw,2.55rem);font-weight:400;letter-spacing:-.02em;line-height:1.35;margin-bottom:18px;color:inherit}
.home-hero h1 em{font-style:italic;font-weight:400;color:#d7e6cf}
.home-hero p{max-width:540px;margin-bottom:28px;line-height:1.85;color:rgba(244,247,241,.88)}
.home-hero small{color:rgba(244,247,241,.7)}
.hero-actions{display:flex;gap:13px;flex-wrap:wrap;margin-bottom:18px}
.home-hero .quiet-link{border-color:rgba(244,247,241,.35);color:#f4f7f1;background:rgba(255,255,255,.06)}
.home-hero .primary-link{background:#f4f7f1;color:var(--primary)}
.hero-rise{opacity:0;transform:translateY(14px);animation:hero-rise .9s ease forwards}
.delay-1{animation-delay:.12s}.delay-2{animation-delay:.24s}.delay-3{animation-delay:.36s}
@keyframes hero-rise{to{opacity:1;transform:none}}
@keyframes hero-drift{from{transform:scale(1.04) translate3d(0,0,0)}to{transform:scale(1.1) translate3d(-1.5%,-1%,0)}}
.service-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:42px;padding:56px max(5vw,24px);background:transparent;border-block:0}
.service-strip article{padding-left:18px;border-left:1px solid var(--border)}
.service-strip .service-index{display:block;font-family:var(--font-display);font-size:.85rem;letter-spacing:.12em;color:#81997c;margin-bottom:14px}
.service-strip h3{margin:12px 0 8px;font-weight:600}
.service-strip p{font-size:.92rem;max-width:360px}
.journey-section{padding:72px max(5vw,24px);background:linear-gradient(180deg,rgba(228,237,223,.55),rgba(246,246,240,.2))}
.section-intro{display:flex;justify-content:space-between;gap:50px;align-items:flex-end}
.section-intro h2{font-family:var(--font-display);font-weight:500}
.section-intro p{max-width:380px;font-size:.92rem}
.journey-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:44px}
.journey-grid article{border-top:1px solid var(--border);padding-top:22px;background:transparent}
.journey-grid article>span{font-family:var(--font-display);font-size:2rem;font-weight:400;color:#a3b79a;display:block;margin-bottom:18px;line-height:1}
.journey-grid h3{margin-bottom:10px}.journey-grid p{font-size:.9rem}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
.reveal.is-in{opacity:1;transform:none}
.cta-band{margin:0;padding:56px max(5vw,24px);background:var(--primary);color:var(--primary-foreground);display:flex;align-items:center;justify-content:space-between;gap:30px;border-radius:0}
.cta-band h2{font-family:var(--font-display);font-weight:500;color:inherit}
.cta-band p{margin-top:12px;max-width:640px;font-size:.92rem;color:rgba(255,255,255,.82)}
.cta-band .primary-link.on-dark,.cta-band a.primary-link{background:#f4f7f1;color:var(--primary);flex-shrink:0}
.home-shell .site-footer{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:28px max(5vw,24px);background:transparent;border-top:1px solid var(--border);border-bottom:0;flex-wrap:wrap;font-size:.8rem;color:var(--muted-foreground)}
@media(max-width:1000px){.home-hero{min-height:78vh;padding-top:64px}.home-shell .site-header{flex-wrap:wrap}.section-intro{display:block}.section-intro p{margin-top:20px;max-width:650px}.journey-grid{grid-template-columns:1fr 1fr}}
@media(max-width:650px){.home-shell .site-header{padding:16px 22px}.home-shell .site-header nav{width:100%;gap:14px;justify-content:space-between}.home-hero{min-height:auto;padding:48px 22px 56px}.home-hero h1{font-size:1.7rem}.hero-brand strong{font-size:1.75rem}.hero-mark{width:48px;height:52px}.service-strip{grid-template-columns:1fr;gap:28px;padding:36px 22px}.journey-section{padding:48px 22px}.journey-grid{grid-template-columns:1fr;gap:22px}.cta-band{padding:36px 22px;display:block}.cta-band a{margin-top:22px;width:100%}.home-shell .site-footer{display:grid;gap:14px;padding:24px 22px}}
@media(prefers-reduced-motion:reduce){.hero-media{animation:none}.hero-rise{opacity:1;transform:none;animation:none}.reveal{opacity:1;transform:none;transition:none}}
```

注意：全局仍保留原有 `.site-header`/`.site-footer`/`.primary-link` 等基础规则供隐私页等使用；`.home-shell ...` 选择器提高特异性覆盖首页。若旧 `.home-hero`/`.service-strip`/`.journey-*`/`.cta-band` 规则与上方冲突，删除旧规则只留本段。

- [ ] **Step 3: 静态验证**

Run: `npx tsc --noEmit; npm run lint`
Expected: 类型零错误；lint 无新增错误

- [ ] **Step 4: 本地目视**

Run: `npm run dev`，打开首页 `/`：

1. 首屏全幅图 + 品牌大于/先于标题  
2. 无宝宝主视觉  
3. 服务区无卡片底板  
4. 旅程滚动显现（或 reduced-motion 下直接可见）  
5. CTA 全宽深绿  
6. 中英切换正常  

- [ ] **Step 5: 提交**

```powershell
git add app/page.tsx app/product.css
git commit -m "feat: restyle homepage with canopy hero and quiet natural layout"
```

---

### Task 4: 收尾核对

**Files:**
- 仅在发现问题时修补 Task 1–3 文件

**Interfaces:**
- Consumes: Task 1–3 全部产出。
- Produces: 与规格一致的可交付首页。

- [ ] **Step 1: 对照规格清单**

逐项确认：静谧自然、整页统一、全幅背景、Fraunces+Source Sans 3、去卡片服务/旅程、全宽 CTA、无宝宝图、3 处动效 + reduced-motion、中英与试用提示仍在。

- [ ] **Step 2: 再跑验证**

Run: `npx tsc --noEmit; npm run lint`
Expected: 通过

- [ ] **Step 3: 若有修补则提交，否则跳过**

```powershell
git add app/page.tsx app/product.css app/layout.tsx public/hero-canopy.jpg
git commit -m "fix: polish homepage design against spec checklist"
```

---

## 计划自检结论

- **规格覆盖：** 视觉系统（色/字体/主视觉）→ Task 1–2；首屏与叠层顶栏 → Task 3；服务/旅程/CTA/页脚 → Task 3；动效三处 → Task 3；合规与响应式 → Task 3–4；验证 → Task 3 Step 3–4、Task 4。
- **占位扫描：** 无 TBD/TODO；图片步骤给出 GenerateImage 参数与落盘路径。
- **类型一致性：** `/hero-canopy.jpg`、`--font-display`、`hero-rise`/`reveal`/`is-in`/`home-shell` 命名在 Task 间一致。
