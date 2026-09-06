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
     <p className="hero-rise delay-2">{t('从初步了解到治疗协调、孕期随访与出生后手续——每一次沟通、每一份报告，都有清楚记录。','From first questions to treatment coordination, pregnancy follow-up and post-birth paperwork — every conversation and report stays clearly recorded.')}</p>
     <div className="hero-actions hero-rise delay-3"><a href="/portal" className="primary-link">{t('开始保密咨询','Start a private consultation')}<ArrowRight size={17}/></a><a href="#journey" className="quiet-link">{t('了解服务流程','Explore the journey')}<ArrowUpRight size={17}/></a></div>
     <small className="hero-rise delay-3">{t('私密试用版 · 具体服务须经个别法律与医疗评估。','Private pilot · Services are subject to individual legal and clinical assessment.')}</small>
    </div>
   </section>
   <section id="care" className="service-strip">{[[ShieldCheck,t('私密的服务空间','A private care space'),t('身份验证后建立档案；阶段与负责人按人、按案件可见。','Create your profile after sign-in. Stages and a named coordinator stay visible by person and case.')],[FileHeart,t('可追溯的报告','Traceable reports'),t('原件与复核译稿按权限交付；来源、日期、版本与复核状态完整记录。','Originals and reviewed translations shared privately — source, date, version and review status recorded together.')],[MessagesSquare,t('持续的双语沟通','Ongoing bilingual support'),t('专属协调员跟进问题，让下一步更明确。','A named coordinator follows your questions and next steps.')]].map(([Icon,title,description],i)=>{const I=Icon as typeof ShieldCheck;return <article key={i}><span className="service-index">0{i+1}</span><I size={22} strokeWidth={1.5}/><h3>{title as string}</h3><p>{description as string}</p></article>})}</section>
   <section className="journey-section" id="journey" ref={journeyRef}><div className="section-intro"><div><div className="eyebrow">YOUR JOURNEY</div><h2>{t('先了解，再从容决定。','Understand first. Decide with confidence.')}</h2></div><p>{t('每个家庭的路径不同，流程会根据实际评估与医院安排调整。','Every family’s path is different. Your plan follows individual assessment and clinical arrangements.')}</p></div><div className="journey-grid">{[[t('沟通与评估','Consultation & assessment'),t('了解需求，确认所需资料及服务适用范围。','Discuss your needs, documents and applicable service scope.')],[t('计划与协调','Planning & coordination'),t('明确医院安排、费用范围和各方责任。','Clarify clinic arrangements, fee scope and responsibilities.')],[t('记录与随访','Records & follow-up'),t('逐次记录治疗、检查和沟通，及时交付报告。','Record treatment, checks and conversations; share reviewed reports.')],[t('出生后支持','Post-birth support'),t('分别跟进出生登记、亲权和旅行文件。','Track birth registration, parentage and travel documentation.')]].map((x,i)=><article key={i} className="reveal" style={{transitionDelay:`${i*90}ms`}}><span>0{i+1}</span><h3>{x[0]}</h3><p>{x[1]}</p></article>)}</div></section>
   <section id="contact" className="cta-band">
    <div>
     <h2>{t('从一次坦诚的沟通开始。','Begin with an honest conversation.')}</h2>
     <p>{t('登录后填写基本意向；也可以先电话或邮件联系我们。','Sign in to share your initial interests, or reach us by phone or email first.')}</p>
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
