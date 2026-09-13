'use client';
import {useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowRight,Download,FileText,ShieldCheck,FileHeart,MessagesSquare,Phone,Mail} from 'lucide-react';
import {Brand} from '@/components/product/brand';
import {LanguageButton,useLocale} from '@/components/product/locale';

const CONTACT_PHONE='+44 7778 888938';
const CONTACT_PHONE_TEL='+447778889388';
const CONTACT_EMAIL='rui@huarenmedia.com';

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
  <main>
   <section className="home-hero home-hero-family">
  <header className="site-header"><Brand/><nav>
   <a className="nav-desk" href="#options">{t('服务','Services')}</a>
   <a className="nav-desk" href="#packages">{t('费用','Fees')}</a>
   <LanguageButton/>
   <a className="primary-link" href="/portal">{t('客户登录','Client sign-in')}<ArrowUpRight size={17}/></a>
  </nav></header>
    <div className="family-hero-layout">
    <div className="hero-copy">
     <h1 className="hero-rise">{t('格鲁吉亚代孕服务协调','Surrogacy coordination in Georgia')}</h1>
     <p className="hero-rise delay-1">{t('中英双语支持，协助对接诊所、查阅供者资料，持续跟进孕期进度。','Support in Chinese and English, with clinic coordination, authorised access to donor profiles, and ongoing pregnancy updates.')}</p>
     <div className="hero-actions hero-rise delay-2"><a href="#contact" className="primary-link">{t('预约咨询','Book a consultation')}<ArrowRight size={17}/></a></div>
     <small className="hero-rise delay-3">{t('具体服务须经个别法律与医疗评估，不承诺结果。','Services require individual legal and clinical assessment. Outcomes are not guaranteed.')}</small>
    </div>
    <figure className="family-hero-photo"><img src="/nesta-family.webp" width="1448" height="1086" fetchPriority="high" alt={t('父母轻抱婴儿的家庭主题配图','Family illustration: parents gently holding their baby')}/></figure>
    </div>
   </section>
   <section id="care" className="service-strip">{[[ShieldCheck,t('私密的服务空间','A private care space'),t('身份验证后建立代孕协调档案；阶段与负责人按人、按案件可见。','Create your surrogacy-coordination profile after sign-in. Stages and a named coordinator stay visible by person and case.')],[FileHeart,t('可追溯的报告','Traceable reports'),t('原件与复核译稿按权限交付；来源、日期、版本与复核状态完整记录。','Originals and reviewed translations shared privately — source, date, version and review status recorded together.')],[MessagesSquare,t('持续的双语沟通','Ongoing bilingual support'),t('专属协调员跟进代孕行程中的问题，让下一步更明确。','A named coordinator follows questions through your surrogacy journey so next steps stay clear.')]].map(([Icon,title,description],i)=>{const I=Icon as typeof ShieldCheck;return <article key={i}><span className="service-index">0{i+1}</span><I size={22} strokeWidth={1.5}/><h3>{title as string}</h3><p>{description as string}</p></article>})}</section>
   <section id="options" className="options-section">
    <div className="section-intro">
     <div><div className="eyebrow">OPTIONS</div><h2>{t('多元方案，按需组合。','Flexible programmes — combine as you need.')}</h2></div>
     <p>{t('代孕协调、独立卵子库与独立精子库并列可选；登录并获批后，资料库按授权开放。','Surrogacy coordination, an independent egg bank and an independent sperm bank sit side by side. After sign-in and approval, directories open by grant.')}</p>
    </div>
    <div className="options-grid">
     {[[t('代孕协调','Surrogacy coordination'),t('沟通与评估、诊所与行程对接、进度与报告、出生后手续跟进。','Consultation, clinic and travel coordination, progress and reports, post-birth paperwork follow-up.')],[t('独立卵子库','Independent egg bank'),t('经授权后查看与选择；用于知情选择与协调，不构成医疗建议。','View and choose after authorisation — for informed choice and coordination, not medical advice.')],[t('独立精子库','Independent sperm bank'),t('经授权后查看与选择；可与代孕或供卵方案按需组合。','View and choose after authorisation — combinable with surrogacy or egg-donor programmes as needed.')]].map((x,i)=><article key={i}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}
    </div>
    <p className="options-note">{t('具体组合经个案评估后确认；首页不展示可供识别的供者样本。','Specific combinations are confirmed after individual assessment. Identifiable donor samples are not shown on this page.')}</p>
   </section>

   <section id="packages" className="packages-section">
    <div className="section-intro">
     <div><div className="eyebrow">PACKAGES</div><h2>{t('三档套餐，按需升级。','Three tiers — upgrade as you need.')}</h2></div>
     <p>{t('基础不含住宿与月子；中级含约定枚数 PGS 与可移植胚胎的移植安排；高级在中级之上含约 30 天月子与住宿。均为协调服务起始价，最终以书面报价为准，不承诺活产结果。','Basic excludes lodging and postpartum care. Mid includes an agreed number of PGS tests and transfers of transferable embryos. Advanced adds about 30 days of postpartum care and lodging. Starting coordination prices only — final quotes in writing. Live birth is not guaranteed.')}</p>
    </div>
    <div className="packages-grid">
     {[{
       tag:t('基础','Basic'),
       title:t('基础套餐','Basic package'),
       priceZh:'¥420,000',
       priceEn:'$58,000',
       desc:t('覆盖基础医疗与生产协调、常规检测与证件跟进；不含月子中心与住宿。适合预算优先、住宿可自理的家庭。','Covers basic medical and delivery coordination, routine testing, and document follow-up — no postpartum centre or lodging. For families who prefer a leaner budget and will arrange stay themselves.'),
       points:[t('医院周期与生产协调','Clinic cycle and delivery coordination'),t('孕母匹配与基础检测','Surrogate matching and basic testing'),t('出生后手续协助；住宿/月子另计','Post-birth paperwork help; lodging/postpartum extra')]
     },{
       tag:t('最常选 · 中级','Most chosen · Mid'),
       title:t('中级套餐','Mid package'),
       priceZh:'¥520,000',
       priceEn:'$72,000',
       desc:t('在基础上增加约定枚数的 PGS 检测，并按合同安排可移植胚胎的移植（在可用胚胎与方案规则内），仍不含 30 天月子与住宿。','Adds an agreed number of PGS tests and contracted transfers of transferable embryos within available embryos and plan rules — still without 30-day postpartum care or lodging.'),
       points:[t('含 6 枚 PGS（超出 $500/枚）','Includes 6 PGS tests ($500/embryo after)'),t('可移植胚胎的约定移植安排','Contracted transfers of transferable embryos'),t('首次移植未成功，可在剩余可移植胚胎内、按合同约定次数继续移植；不是包活产，胚胎用尽后的重启方式写进合同','If the first transfer does not succeed, further transfers may continue within remaining transferable embryos and the contracted transfer count; not a live-birth guarantee — restart rules after embryos are exhausted go in the contract')]
     },{
       tag:t('高级','Advanced'),
       title:t('高级套餐','Advanced package'),
       priceZh:'¥600,000',
       priceEn:'$84,000',
       desc:t('含中级全部内容，并打包约 30 天月子中心与住宿，减少落地后的零散开支与协调成本。','Includes everything in Mid, plus about 30 days of postpartum centre care and lodging — fewer ad-hoc costs after arrival.'),
       points:[t('与中级医疗规则相同，增加月子与住宿','Same medical rules as Mid; adds postpartum care and lodging'),t('约 30 天月子中心','About 30 days postpartum centre'),t('约 30 天住宿安排','About 30 days lodging')]
     }].map((pkg,i)=> <article key={i} className={i===1?'is-featured':undefined}>
      <span className="pkg-tag">{pkg.tag}</span>
      <h3>{pkg.title}</h3>
      <div className="pkg-price"><strong>{pkg.priceZh}</strong><small>{t('起','from')} · {pkg.priceEn} {t('起','from')}</small></div>
      <p>{pkg.desc}</p>
      <ul>{pkg.points.map((pt,j)=> <li key={j}>{pt}</li>)}</ul>
      <a href="/portal" className="quiet-link">{t('咨询此套餐','Ask about this package')}<ArrowUpRight size={16}/></a>
     </article>)}
    </div>
    <aside className="packages-download-card" aria-label={t('套餐说明下载','Package sheet download')}>
     <div className="packages-download-icon" aria-hidden="true"><FileText size={22}/></div>
     <div className="packages-download-copy">
      <h3>{t('套餐说明（咨询用）','Package sheet (for consultation)')}</h3>
      <p>{t('三档对照 + 付款节点 + 加价参考，一页带走','Three tiers, payment milestones, and add-on ranges — one page to take away.')}</p>
      <span className="packages-download-meta">{t('中文 · PDF · 版本 2026-09-13','Chinese · PDF · v2026-09-13')}</span>
     </div>
     <a className="primary-link packages-download-btn" href="/nesta-packages-zh-v2026-09-13.pdf" download>
      {t('下载套餐说明','Download package sheet')}<Download size={16}/>
     </a>
    </aside>
    <p className="packages-note">{t('供卵另计 $5,000、供精另计 $5,000（可写入报价）；机票签证、国内体检、超出 PGS 枚数等通常另计；双胎/剖宫/NICU 见下方参考区间。中级：首次移植未成功，可在剩余可移植胚胎内、按合同约定次数继续移植；不是包活产。高级与中级医疗规则相同，增加月子与住宿。','Egg donation +$5,000 and sperm donation +$5,000, quoted separately. Airfare, visas, domestic exams, and extra PGS embryos are usually extra; twin/C-section/NICU ranges are listed below. Mid: further contracted transfers may continue within remaining transferable embryos after a failed first transfer — not a live-birth guarantee. Advanced matches Mid medical rules and adds postpartum care and lodging.')}</p>
    <div className="packages-detail">
     <div className="packages-detail-block">
      <h3>{t('三档对照','Tier comparison')}</h3>
      <div className="packages-table-wrap" role="region" aria-label={t('套餐对照表','Package comparison table')}>
       <table className="packages-table">
        <thead>
         <tr>
          <th scope="col">{t('项目','Item')}</th>
          <th scope="col">{t('基础','Basic')}</th>
          <th scope="col">{t('中级','Mid')}</th>
          <th scope="col">{t('高级','Advanced')}</th>
         </tr>
        </thead>
        <tbody>
         {[[t('医院周期 / 生产协调','Clinic cycle / delivery coordination'),t('含','Yes'),t('含','Yes'),t('含','Yes')],
           [t('孕母匹配与基础检测','Surrogate matching & basic testing'),t('含','Yes'),t('含','Yes'),t('含','Yes')],
           [t('出生后证件协助','Post-birth document support'),t('含','Yes'),t('含','Yes'),t('含','Yes')],
           [t('PGS（6 枚）','PGS (6 embryos)'),t('不含','No'),t('含','Yes'),t('含','Yes')],
           [t('可移植胚胎的约定移植','Contracted transferable-embryo transfers'),t('按基础规则','Per basic rules'),t('含','Yes'),t('含','Yes')],
           [t('约 30 天月子中心','~30 days postpartum centre'),t('另计','Extra'),t('另计','Extra'),t('含','Yes')],
           [t('约 30 天住宿','~30 days lodging'),t('另计','Extra'),t('另计','Extra'),t('含','Yes')],
           [t('供卵 / 供精','Egg / sperm donation'),t('各 +$5,000','+$5,000 each'),t('各 +$5,000','+$5,000 each'),t('各 +$5,000','+$5,000 each')]].map((row,i)=> <tr key={i}><th scope="row">{row[0]}</th><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td></tr>)}
        </tbody>
       </table>
      </div>
     </div>
     <div className="packages-detail-grid">
      <div className="packages-detail-block">
       <h3>{t('中级特别说明','Mid-tier notes')}</h3>
       <ul>
        <li>{t('中级/高级含 6 枚 PGS；超出按 $500/枚另计。','Mid/Advanced include 6 PGS tests; extras billed at $500 each.')}</li>
        <li>{t('「可移植」指实验室与方案确认可移植的胚胎，在合同规则内安排移植。','“Transferable” means embryos cleared for transfer; transfers follow contract rules.')}</li>
        <li>{t('首次移植未成功，可在剩余可移植胚胎内、按合同约定次数继续移植；不是包活产，胚胎用尽后的重启方式写进合同。仍不保证着床、活产或性别结果。','If the first transfer does not succeed, further transfers may continue within remaining transferable embryos and the contracted transfer count; not a live-birth guarantee — restart rules after embryos are exhausted go in the contract. Implantation, live birth, and sex selection are still not guaranteed.')}</li>
       </ul>
      </div>
      <div className="packages-detail-block">
       <h3>{t('通常不含（三档共用）','Usually excluded (all tiers)')}</h3>
       <ul>
        <li>{t('国际机票、签证与个人旅游消费','International flights, visas, personal travel')}</li>
        <li>{t('国内体检及个人原因的重复检查','Domestic exams and repeat tests for personal reasons')}</li>
        <li>{t('超出约定天数的月子或住宿','Postpartum care or lodging beyond agreed days')}</li>
       </ul>
      </div>
      <div className="packages-detail-block">
       <h3>{t('常见加价参考（发生时）','Common add-ons if they occur')}</h3>
       <ul>
        <li>{t('双胎 / 多胎补偿：约 $4,000–$6,000','Twin / multiple compensation: about $4,000–$6,000')}</li>
        <li>{t('剖宫产相关：约 $2,000–$4,000','C-section related: about $2,000–$4,000')}</li>
        <li>{t('新生儿 NICU：约 $150–$300 / 天','Newborn NICU: about $150–$300 / day')}</li>
        <li>{t('以上为常见参考区间，非报价单；是否发生、最终金额以医院账单与书面确认为准。','Ranges are indicative, not a fixed quote; occurrence and final amounts follow hospital bills and written confirmation.')}</li>
       </ul>
      </div>
     </div>

     <div className="packages-detail-block packages-pay">
      <h3>{t('付款节点（示意）','Payment milestones (indicative)')}</h3>
      <p className="packages-pay-lead">{t('以中级套餐为例按比例拆分；基础/高级按总价同比。未达节点不提前收取该笔，最终以书面报价为准。','Example split for the Mid package by share of total. Basic/Advanced scale with their totals. Each instalment is due only when the milestone is met — final figures follow the written quote.')}</p>
      <ol className="packages-pay-list">
       <li><strong>{t('签约启动','Contract start')}</strong><span>$10,000</span><em>{t('约 14%','~14%')}</em></li>
       <li><strong>{t('周期启动 / 进入医疗','Cycle start')}</strong><span>$10,000</span><em>{t('约 14%','~14%')}</em></li>
       <li><strong>{t('确认妊娠约 12 周','Pregnancy ~12 weeks')}</strong><span>$14,000</span><em>{t('约 19%','~19%')}</em></li>
       <li><strong>{t('妊娠约 28 周','Pregnancy ~28 weeks')}</strong><span>$18,000</span><em>{t('约 25%','~25%')}</em></li>
       <li><strong>{t('出生后约定工作日内','After birth')}</strong><span>$20,000</span><em>{t('约 28%','~28%')}</em></li>
      </ol>
      <p className="packages-pay-note">{t('上表合计 $72,000，对应中级起价。供卵/供精、超出 PGS、双胎等另计项不在此五笔内。','Totals $72,000 for Mid starting price. Egg/sperm, extra PGS, twins and similar extras sit outside these five instalments.')}</p>
     </div>
    </div>
   </section>

   <section id="network" className="network-section">
    <div className="section-intro">
     <div><div className="eyebrow">PARTNER NETWORK</div><h2>{t('与诊所、月子与证件服务协作。','Coordinated with clinics, postpartum care and documents.')}</h2></div>
     <p>{t('我们协调合作方安排与进度记录；诊疗由医疗机构负责，具体休养与认证以合作方及当地要求为准。','We coordinate partner arrangements and progress records. Clinical care stays with medical providers; postpartum and certification details follow partners and local requirements.')}</p>
    </div>
    <div className="network-grid">
     {[[t('合作 IVF 诊所','Partner IVF clinics'),t('与合作诊所协调评估与治疗安排，报告与阶段按权限同步到你的案件空间。','Coordinate assessment and treatment arrangements with partner clinics. Reports and stages sync to your case space by permission.')],[t('月子中心协作','Postpartum care partners'),t('衔接产后休养与行程安排，重要节点记入服务进度，便于双语跟进。','Handoff postpartum rest and travel plans. Key milestones stay on your care timeline for bilingual follow-up.')],[t('公证与海牙认证','Notarisation & Apostille'),t('跟进出生、亲权等相关证件的公证与海牙认证进度，材料与状态可追溯。','Track notarisation and Apostille progress for birth and parentage documents, with a clear record of materials and status.')]].map((x,i)=><article key={i}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}
    </div>
   </section>
   <section className="journey-section" id="journey" ref={journeyRef}><div className="section-intro"><div><div className="eyebrow">YOUR JOURNEY</div><h2>{t('先了解，再从容决定。','Understand first. Decide with confidence.')}</h2></div><p>{t('每条代孕路径不同，流程会根据个案评估与诊所安排调整。','Every surrogacy path is different. Your plan follows individual assessment and clinical arrangements.')}</p></div><div className="journey-grid">{[[t('沟通与评估','Consultation & assessment'),t('了解需求与资料，初步确认服务是否适用——这不是法律结论。','Discuss needs and documents, and whether the service may apply — this is not a legal determination.')],[t('计划与协调','Planning & coordination'),t('说明诊所安排、费用范围归属与各方职责。','Clarify clinic arrangements, what fees cover, and each party’s responsibilities.')],[t('记录与随访','Records & follow-up'),t('记录周期、检查与沟通，交付经复核的报告。','Record cycles, checks and conversations; share independently reviewed reports.')],[t('出生后支持','Post-birth support'),t('跟进出生登记、亲权与旅行文件等手续（不提供法律意见）。','Follow birth registration, parentage and travel paperwork (we do not give legal opinions).')]].map((x,i)=><article key={i} className="reveal" style={{transitionDelay:`${i*90}ms`}}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div></section>
   <section id="boundaries" className="boundaries-section">
    <div className="section-intro">
     <div><div className="eyebrow">BOUNDARIES</div><h2>{t('我们做什么，不做什么。','What we do — and do not do.')}</h2></div>
     <p>{t('奈斯提供格鲁吉亚代孕相关协调与进度记录，并协调独立精卵资料库的授权查阅，不是医疗机构，也不是律师事务所。资料库服务于知情选择与协调，不构成医疗或法律意见。我们不提供医疗诊断、法律资格判断、紧急医疗联络或付款结算。诊疗由接诊医疗机构负责；法律事务由持牌专业人士确认。能否开展服务须个案评估，且不承诺结果。','Nesta provides Georgia surrogacy-related coordination and progress records, and coordinates authorised access to independent egg and sperm directories. We are not a medical provider or a law firm. Directories support informed choice and coordination — they are not medical or legal advice. We do not offer diagnosis, legal eligibility decisions, emergency medical contact, or payment processing. Clinics handle clinical care; licensed professionals handle legal matters. Whether a service proceeds requires individual assessment, and outcomes are not guaranteed.')}</p>
    </div>
   </section>
   <section id="contact" className="cta-band">
    <div>
     <h2>{t('从一次坦诚的沟通开始。','Begin with an honest conversation.')}</h2>
     <p>{t('登录或联系前，可先阅读服务边界；也可先电话或邮件咨询。','Before you sign in or write, you can read our service boundaries — or reach us by phone or email first.')}</p>
     <div className="cta-contact">
      <a href={`tel:${CONTACT_PHONE_TEL}`}><Phone size={16} strokeWidth={1.5}/><span>{CONTACT_PHONE}</span></a>
      <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={16} strokeWidth={1.5}/><span>{CONTACT_EMAIL}</span></a>
     </div>
     <ol className="consultation-steps"><li>{t('电话或邮件沟通基本需求，无需先注册。','Contact us by phone or email; registration is not required.')}</li><li>{t('团队说明资料要求、服务流程与费用范围。','The team explains information needed, the process and fee scope.')}</li><li>{t('确认继续后建立档案，按审核结果开放服务空间。','Create a profile when ready; access is granted after review.')}</li></ol>
    </div>
    <a href="/portal" className="primary-link on-dark">{t('建立我的档案','Create my profile')}<ArrowUpRight size={18}/></a>
   </section>
  </main>
  <footer className="site-footer"><Brand/><a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></footer>
 </div>;
}
