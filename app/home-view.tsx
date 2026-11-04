'use client';
import {useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowRight,Download,FileText,ShieldCheck,FileHeart,MessagesSquare,Phone,Mail} from 'lucide-react';
import './home.css';
import {Brand} from '@/components/product/brand';
import {LanguageButton,useLocale} from '@/components/product/locale';
import {PartnerLeaderMed} from '@/components/product/partner-leadermed';
import {CONTACT_EMAIL,CONTACT_PHONE,CONTACT_PHONE_TEL} from '@/lib/public-contact';
import {formatPackageMainPrice,formatPackageMainPriceCaption,PACKAGE_DISCLAIMER,PACKAGE_EXPEDITE,PACKAGE_EXTRAS,PACKAGE_INCLUSIONS,PACKAGE_SHEET_VERSION,PACKAGE_STRIP,PUBLIC_PACKAGES} from '@/lib/public-packages';

export default function Home(){
 const {t,lang}=useLocale();
 const journeyRef=useRef<HTMLElement>(null);
 useEffect(()=>{
  const root=journeyRef.current;if(!root)return;
  const items=[...root.querySelectorAll('.reveal')];
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){items.forEach(el=>el.classList.add('is-in'));return}
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:.2});
  items.forEach(el=>io.observe(el));
  return ()=>io.disconnect();
 },[]);
 return <div className="home-shell home-editorial">
  <main>
   <section className="home-hero home-hero-family">
  <header className="site-header"><Brand/><nav>
   <a className="nav-desk" href="/services">{t('服务','Services')}</a>
   <a className="nav-desk" href="/process">{t('流程','Process')}</a>
   <a className="nav-desk" href="/fees">{t('费用','Fees')}</a>
   <a className="nav-desk" href="/clinic">{t('诊所','Clinic')}</a>
   <a className="nav-desk" href="/faq">{t('问答','Questions')}</a>
   <LanguageButton/>
   <a className="primary-link" href="/portal">{t('客户登录','Client sign-in')}<ArrowUpRight size={17}/></a>
  </nav></header>
    <div className="family-hero-layout">
    <div className="hero-copy">
     <div className="hero-eyebrow hero-rise"><span aria-hidden="true"/>{t('格鲁吉亚代孕服务协调','SURROGACY COORDINATION · GEORGIA')}</div>
     <h1 className="hero-rise">{t('用心陪伴，','Thoughtful care.')}<br/><em>{t('迈向家的新篇。','A new chapter.')}</em></h1>
     <p className="hero-rise delay-1">{t('从最初的咨询，到每一次孕期跟进。奈斯以中英双语，协助你对接诊所、了解供者资料，让每一步都有清晰的安排。','From your first conversation to pregnancy follow-up. nesta helps you coordinate with clinics, explore donor profiles and understand each next step, in Chinese and English.')}</p>
     <div className="hero-actions hero-rise delay-2"><a href="#contact" className="primary-link">{t('预约咨询','Book a consultation')}<ArrowRight size={17}/></a><a href="#journey" className="hero-process-link">{t('了解服务流程','Explore the process')}<ArrowUpRight size={17}/></a></div>
     <small className="hero-rise delay-3">{t('具体服务须经个别法律与医疗评估，不承诺结果。','Services require individual legal and clinical assessment. Outcomes are not guaranteed.')}</small>
    </div>
    <div className="hero-visual"><div className="photo-edition" aria-hidden="true">FAMILY · CARE · CONNECTION</div><figure className="family-hero-photo"><img src="/nesta-family.webp" width="1448" height="1086" fetchPriority="high" alt={t('父母轻抱婴儿的家庭主题配图','Family illustration: parents gently holding their baby')}/></figure><div className="hero-care-note"><span className="care-note-icon"><FileHeart size={26} strokeWidth={1.4}/></span><div><strong>{t('每个阶段，清楚可见','Your journey, clearly documented')}</strong><p>{t('专属服务空间 · 进度与报告随时查阅','Your care space · progress and reports together')}</p></div></div></div>
    </div>
   </section>
   <section id="care" className="service-strip">{[[ShieldCheck,t('私密的服务空间','A private care space'),t('身份验证后建立代孕协调档案；阶段与负责人按人、按案件可见。','Create your surrogacy-coordination profile after sign-in. Stages and a named coordinator stay visible by person and case.')],[FileHeart,t('可追溯的报告','Traceable reports'),t('原件与复核译稿按权限交付；来源、日期、版本与复核状态完整记录。','Originals and reviewed translations shared privately — source, date, version and review status recorded together.')],[MessagesSquare,t('持续的双语沟通','Ongoing bilingual support'),t('专属协调员跟进代孕行程中的问题，让下一步更明确。','A named coordinator follows questions through your surrogacy journey so next steps stay clear.')]].map(([Icon,title,description],i)=>{const I=Icon as typeof ShieldCheck;return <article key={i}><span className="service-index">0{i+1}</span><I size={22} strokeWidth={1.5}/><h3>{title as string}</h3><p>{description as string}</p></article>})}</section>
   <section id="options" className="options-section">
    <div className="section-intro">
     <div><div className="eyebrow">01 / OUR SERVICES</div><h2>{t('你的需求，是方案的起点。','A programme shaped around you.')}</h2></div>
     <p>{t('代孕协调、独立卵子库与独立精子库并列可选；登录并获批后，资料库按授权开放。','Surrogacy coordination, an independent egg bank and an independent sperm bank sit side by side. After sign-in and approval, directories open by grant.')}</p>
    </div>
    <div className="options-grid">
     {[[t('代孕协调','Surrogacy coordination'),t('沟通与评估、诊所与行程对接、进度与报告、出生后手续跟进。','Consultation, clinic and travel coordination, progress and reports, post-birth paperwork follow-up.')],[t('独立卵子库','Independent egg bank'),t('经授权后查看与选择；用于知情选择与协调，不构成医疗建议。','View and choose after authorisation — for informed choice and coordination, not medical advice.')],[t('独立精子库','Independent sperm bank'),t('经授权后查看与选择；可与代孕或供卵方案按需组合。','View and choose after authorisation — combinable with surrogacy or egg-donor programmes as needed.')]].map((x,i)=><article key={i}><div className="option-card-top"><span>0{i+1}</span><ArrowUpRight size={24} strokeWidth={1.2}/></div><h3>{x[0]}</h3><p>{x[1]}</p><a href={i===0?'#contact':'/portal'}>{i===0?t('咨询服务','Discuss your needs'):t('申请查阅','Request access')}<ArrowRight size={16}/></a></article>)}
    </div>
    <p className="options-note">{t('具体组合经个案评估后确认；首页不展示可供识别的供者样本。','Specific combinations are confirmed after individual assessment. Identifiable donor samples are not shown on this page.')}</p>
   </section>

   <section className="journey-section" id="journey" ref={journeyRef}><div className="section-intro"><div><div className="eyebrow">02 / YOUR JOURNEY</div><h2>{t('先了解，再从容决定。','Understand first. Decide with confidence.')}</h2></div><p>{t('每条代孕路径不同，流程会根据个案评估与诊所安排调整。','Every surrogacy path is different. Your plan follows individual assessment and clinical arrangements.')}</p></div><div className="journey-grid">{[
    [t('国内体检','Domestic medical checks'),t('按方案要求准备体检与相关资料。','Prepare medical checks and documents required by the programme.')],
    [t('行程安排及实地考察','Travel & site visit'),t('协调出行安排，实地了解服务。','Coordinate travel and visit service providers.')],
    [t('签约与方案确认','Contract & programme confirmation'),t('书面确认方案、费用与服务条件。','Confirm the programme, fees and service terms in writing.')],
    [t('胚胎培育、筛查及储存','Embryo development, screening & storage'),t('由医疗机构按所选方案安排。','Arranged by the clinic according to the selected programme.')],
    [t('体检与移植','Medical checks & transfer'),t('根据医疗评估与所选套餐安排移植。','Schedule transfers according to clinical assessment and the programme.')],
    [t('妊娠确认及产检','Pregnancy confirmation & prenatal checks'),t('跟进妊娠确认及孕期检查安排。','Follow pregnancy confirmation and prenatal appointments.')],
    [t('分娩与新生儿检查','Delivery & newborn checks'),t('衔接分娩、新生儿体检与护理。','Coordinate delivery, newborn examinations and care.')],
    [t('证件办理及返程','Documents & return travel'),t('跟进出生证、护照及返程安排。','Follow birth certificate, passport and return-travel arrangements.')],
   ].map((x,i)=><article key={i} className="reveal" style={{transitionDelay:`${i*90}ms`}}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div></section>
   <section id="network" className="network-section">
    <div className="section-intro">
     <div><div className="eyebrow">03 / COORDINATED CARE</div><h2>{t('把不同环节，连接成一段旅程。','Connected care, from one stage to the next.')}</h2></div>
     <p>{t('我们协调合作方安排与进度记录；诊疗由医疗机构负责，具体休养与认证以合作方及当地要求为准。','We coordinate partner arrangements and progress records. Clinical care stays with medical providers; postpartum and certification details follow partners and local requirements.')}</p>
    </div>
    <div className="network-grid">
     {[[t('LeaderMed 独家合作','Exclusive LeaderMed partner'),t('奈斯是第比利斯 LeaderMed 医院的独家合作伙伴，协调评估与治疗安排。诊疗由医院负责。','Nesta is the exclusive partner of LeaderMed hospital in Tbilisi, and coordinates assessment and treatment arrangements. Clinical care stays with the hospital.')],[t('专业月子中心','Professional postpartum centre'),t('配套月子中心为专业机构，持牌儿科医生实行 24 小时值班。休养与行程节点记入服务进度。','The accompanying postpartum centre is a professional facility, with licensed paediatricians on 24-hour duty. Rest and travel milestones stay on the care timeline.')],[t('公证与海牙认证','Notarisation & Apostille'),t('跟进出生、亲权等相关证件的公证与海牙认证进度，材料与状态可追溯。','Track notarisation and Apostille progress for birth and parentage documents, with a clear record of materials and status.')]].map((x,i)=><article key={i}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p>{i===0?<a className="network-more" href="/clinic">{t('查看合作医院 LeaderMed','See partner clinic LeaderMed')}<ArrowUpRight size={14}/></a>:null}</article>)}
    </div>
   </section>
   <PartnerLeaderMed/>

   <section id="packages" className="packages-section">
    <div className="section-intro">
     <div><div className="eyebrow">04 / PLANS & FEES</div><h2>{t('三种方案，清楚选择。','Three programmes. A clear choice.')}</h2></div>
     <p>{t('套餐价格、费用明细与办理流程（与下方原图一致）。三档主价为人民币，不做美元换算；另计项按原图以美元标注。具体范围以所选套餐、合同及医疗评估为准。','Programme prices, inclusions and process match the sheet below. The three main prices are in RMB (Chinese yuan) exactly as on the sheet — not converted to US dollars. Listed extras stay in USD where the sheet shows USD. Scope follows your programme, contract and clinical assessment.')}</p>
    </div>
    <p className="package-strip">{PACKAGE_STRIP.map(item=>t(...item)).join(' · ')}</p>
    <div className="packages-grid">
     {PUBLIC_PACKAGES.map(pkg=><article key={pkg.id} className={pkg.featured?'is-featured':undefined}>
      <span className="pkg-tag">{t(...pkg.tag)}</span><h3>{t(...pkg.title)}</h3>
      <div className="pkg-price"><strong>{formatPackageMainPrice(pkg.totalCny,lang)}</strong><small className="pkg-currency">{lang==='en'?`${formatPackageMainPriceCaption(lang)} · `:''}{t(...pkg.edition)}</small></div>
      <p className="package-highlight">{t(...pkg.highlight)}</p>
      <ul>{pkg.points.map(pt=><li key={pt[0]}>{t(...pt)}</li>)}</ul>
      <a href="#contact" className="quiet-link">{t('咨询此套餐','Discuss this programme')}<ArrowUpRight size={16}/></a>
     </article>)}
    </div>
    <p className="package-terms"><ShieldCheck size={20} aria-hidden="true"/>{t(...PACKAGE_DISCLAIMER)} <a href="/faq">{t('常见问题','Common questions')}</a></p>
    <div className="package-inclusions">
     <div className="section-intro"><div><div className="eyebrow">INCLUDED SERVICES</div><h3>{t('费用包含明细','What the fees include')}</h3></div><p>{t('具体范围对应所选套餐。','The precise scope follows the selected programme.')}</p></div>
     <ol className="package-inclusion-list">
      {PACKAGE_INCLUSIONS.map((item,i)=><li key={item.title[0]}><span className="inclusion-number">{String(i+1).padStart(2,'0')}</span><div><strong>{t(...item.title)}</strong>{item.note&&<p>{t(...item.note)}</p>}</div></li>)}
     </ol>
    </div>
    <div className="package-extras">
     <div className="section-intro"><div><div className="eyebrow">ADDITIONAL FEES</div><h3>{t('额外收费 · 不包含在上述套餐内','Additional fees · outside the packages')}</h3></div><p>{t('按适用条件另计。','Charged separately where they apply.')}</p></div>
     <dl className="package-extra-list">
      {PACKAGE_EXTRAS.map(item=><div key={item.title[0]}><dt>{t(...item.title)}</dt><dd>{t(...item.price)}</dd></div>)}
     </dl>
     <aside className="package-expedite"><h4>{t(...PACKAGE_EXPEDITE.title)}</h4><p>{t(...PACKAGE_EXPEDITE.body)}</p></aside>
     <p className="packages-note">{t('另计项中原图“$”为美元；套餐主价为人民币。计费单位及具体条件以书面报价为准。','“$” on listed extras means US dollars. Main programme prices are RMB. Billing units and specific terms follow your written quote.')}</p>
    </div>
    <aside className="packages-download-card" aria-label={t('套餐资料下载','Package sheet download')}>
     <div className="packages-download-icon" aria-hidden="true"><FileText size={22}/></div>
     <div className="packages-download-copy"><h3>{t('套餐原图，一页查看','The original package sheet')}</h3><p>{t('三种套餐、费用明细与办理流程，保存后随时对照。','Save the three programmes, fee details and process for reference.')}</p><span className="packages-download-meta">{t(`中文 · JPG · ${PACKAGE_SHEET_VERSION}`,`Chinese · JPG · ${PACKAGE_SHEET_VERSION}`)}</span></div>
     <a className="primary-link packages-download-btn" href="/nesta-packages.jpg" download>{t('下载套餐原图','Download package sheet')}<Download size={16}/></a>
    </aside>
   </section>

   <section id="boundaries" className="boundaries-section">
    <div className="section-intro">
     <div><div className="eyebrow">OUR RESPONSIBILITY</div><h2>{t('清晰的职责，认真对待的托付。','Clear responsibilities. Thoughtful coordination.')}</h2></div>
     <p>{t('奈斯提供格鲁吉亚代孕相关协调与进度记录，并协调独立精卵资料库的授权查阅，不是医疗机构，也不是律师事务所。资料库服务于知情选择与协调，不构成医疗或法律意见。我们不提供医疗诊断、法律资格判断、紧急医疗联络或付款结算。诊疗由接诊医疗机构负责；法律事务由持牌专业人士确认。能否开展服务须个案评估，且不承诺结果。','Nesta provides Georgia surrogacy-related coordination and progress records, and coordinates authorised access to independent egg and sperm directories. We are not a medical provider or a law firm. Directories support informed choice and coordination — they are not medical or legal advice. We do not offer diagnosis, legal eligibility decisions, emergency medical contact, or payment processing. Clinics handle clinical care; licensed professionals handle legal matters. Whether a service proceeds requires individual assessment, and outcomes are not guaranteed.')}</p>
    </div>
   </section>
   <section id="contact" className="cta-band">
    <div><div className="eyebrow">LET’S TALK</div>
     <h2>{t('从一次坦诚的沟通开始。','Begin with an honest conversation.')}</h2>
     <p>{t('登录或联系前，可先看问答说明；也可先电话或邮件咨询。','Before you sign in or write, you can read the questions — or reach us by phone or email first.')} <a className="cta-inline-link" href="/faq">{t('打开问答','Open questions')}</a></p>
     <div className="cta-contact">
      <a href={`tel:${CONTACT_PHONE_TEL}`}><Phone size={16} strokeWidth={1.5}/><span>{CONTACT_PHONE}</span></a>
      <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={16} strokeWidth={1.5}/><span>{CONTACT_EMAIL}</span></a>
     </div>
     <ol className="consultation-steps"><li>{t('电话或邮件沟通基本需求，无需先注册。','Contact us by phone or email; registration is not required.')}</li><li>{t('团队说明资料要求、服务流程与费用范围。','The team explains information needed, the process and fee scope.')}</li><li>{t('确认继续后建立档案，按审核结果开放服务空间。','Create a profile when ready; access is granted after review.')}</li></ol>
    </div>
    <a href="/portal" className="primary-link on-dark">{t('建立我的档案','Create my profile')}<ArrowUpRight size={18}/></a>
   </section>
  </main>
  <footer className="site-footer"><Brand/><span className="footer-links"><a href="/services">{t('服务','Services')}</a><a href="/process">{t('流程','Process')}</a><a href="/fees">{t('费用','Fees')}</a><a href="/clinic">{t('诊所','Clinic')}</a><a href="/faq">{t('问答','Questions')}</a><a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></span></footer>
 </div>;
}
