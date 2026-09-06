'use client';
import {useEffect,useRef} from 'react';
import {ArrowUpRight,ArrowRight,ShieldCheck,FileHeart,MessagesSquare,Sprout,Phone,Mail} from 'lucide-react';
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
  <div className="pilot-strip">{t('私密试用版 · 请使用测试资料','Private pilot · Please use test data')}</div>
  <header className="site-header"><Brand/><nav>
   <a className="nav-desk" href="#journey">{t('服务旅程','The journey')}</a>
   <a className="nav-desk" href="#care">{t('我们的服务','Our care')}</a>
   <a className="nav-desk" href="#boundaries">{t('服务边界','Boundaries')}</a>
   <a href="#contact">{t('联系我们','Contact')}</a>
   <LanguageButton/>
   <a className="primary-link" href="/portal">{t('客户登录','Client sign-in')}<ArrowUpRight size={17}/></a>
  </nav></header>
  <main>
   <section className="home-hero">
    <div className="hero-media" aria-hidden="true"/>
    <div className="hero-shade" aria-hidden="true"/>
    <div className="hero-copy">
     <div className="hero-brand hero-rise" aria-label="初禾 FIRSTLEAF"><span className="hero-mark"><Sprout size={28}/></span><div><strong>初禾 <span>FIRSTLEAF</span></strong><small>FAMILY CARE COORDINATION · GEORGIA</small></div></div>
     <h1 className="hero-rise delay-1">{t('迈向家庭的每一步，','Each step toward family,')}<br/><em>{t('都有清晰的陪伴。','with care and clarity.')}</em></h1>
     <p className="hero-rise delay-2">{t('初禾提供格鲁吉亚代孕相关协调：从初步沟通与评估，到诊所与行程对接、进度与报告记录，以及出生后手续跟进——每一次沟通都有清楚留存。','Firstleaf coordinates Georgia surrogacy-related care: from early consultation and assessment, through clinic and travel coordination, progress and report records, to post-birth paperwork follow-up — every conversation stays clearly recorded.')}</p>
     <div className="hero-actions hero-rise delay-3"><a href="/portal" className="primary-link">{t('开始保密咨询','Start a private consultation')}<ArrowRight size={17}/></a><a href="#journey" className="quiet-link">{t('了解服务流程','Explore the journey')}<ArrowUpRight size={17}/></a></div>
     <small className="hero-rise delay-3">{t('私密试用版 · 具体服务须经个别法律与医疗评估，不承诺结果。','Private pilot · Services require individual legal and clinical assessment. Outcomes are not guaranteed.')}</small>
    </div>
   </section>
   <section id="care" className="service-strip">{[[ShieldCheck,t('私密的服务空间','A private care space'),t('身份验证后建立代孕协调档案；阶段与负责人按人、按案件可见。','Create your surrogacy-coordination profile after sign-in. Stages and a named coordinator stay visible by person and case.')],[FileHeart,t('可追溯的报告','Traceable reports'),t('原件与复核译稿按权限交付；来源、日期、版本与复核状态完整记录。','Originals and reviewed translations shared privately — source, date, version and review status recorded together.')],[MessagesSquare,t('持续的双语沟通','Ongoing bilingual support'),t('专属协调员跟进代孕行程中的问题，让下一步更明确。','A named coordinator follows questions through your surrogacy journey so next steps stay clear.')]].map(([Icon,title,description],i)=>{const I=Icon as typeof ShieldCheck;return <article key={i}><span className="service-index">0{i+1}</span><I size={22} strokeWidth={1.5}/><h3>{title as string}</h3><p>{description as string}</p></article>})}</section>
   <section className="journey-section" id="journey" ref={journeyRef}><div className="section-intro"><div><div className="eyebrow">YOUR JOURNEY</div><h2>{t('先了解，再从容决定。','Understand first. Decide with confidence.')}</h2></div><p>{t('每条代孕路径不同，流程会根据个案评估与诊所安排调整。','Every surrogacy path is different. Your plan follows individual assessment and clinical arrangements.')}</p></div><div className="journey-grid">{[[t('沟通与评估','Consultation & assessment'),t('了解需求与资料，初步确认服务是否适用——这不是法律结论。','Discuss needs and documents, and whether the service may apply — this is not a legal determination.')],[t('计划与协调','Planning & coordination'),t('说明诊所安排、费用范围归属与各方职责。','Clarify clinic arrangements, what fees cover, and each party’s responsibilities.')],[t('记录与随访','Records & follow-up'),t('记录周期、检查与沟通，交付经复核的报告。','Record cycles, checks and conversations; share independently reviewed reports.')],[t('出生后支持','Post-birth support'),t('跟进出生登记、亲权与旅行文件等手续（不提供法律意见）。','Follow birth registration, parentage and travel paperwork (we do not give legal opinions).')]].map((x,i)=><article key={i} className="reveal" style={{transitionDelay:`${i*90}ms`}}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div></section>
   <section id="boundaries" className="boundaries-section">
    <div className="section-intro">
     <div><div className="eyebrow">BOUNDARIES</div><h2>{t('我们做什么，不做什么。','What we do — and do not do.')}</h2></div>
     <p>{t('初禾提供格鲁吉亚代孕相关协调与进度记录，不是医疗机构，也不是律师事务所。我们不提供医疗诊断、法律资格判断、紧急医疗联络或付款结算。诊疗由接诊医疗机构负责；法律事务由持牌专业人士确认。能否开展服务须个案评估，且不承诺结果。','Firstleaf provides Georgia surrogacy-related coordination and progress records. We are not a medical provider or a law firm. We do not offer diagnosis, legal eligibility decisions, emergency medical contact, or payment processing. Clinics handle clinical care; licensed professionals handle legal matters. Whether a service proceeds requires individual assessment, and outcomes are not guaranteed.')}</p>
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
    </div>
    <a href="/portal" className="primary-link on-dark">{t('建立我的档案','Create my profile')}<ArrowUpRight size={18}/></a>
   </section>
  </main>
  <footer className="site-footer"><Brand/><a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></footer>
 </div>;
}
