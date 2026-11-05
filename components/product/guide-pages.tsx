'use client';
import type {ReactNode} from 'react';
import {PublicShell} from './public-shell';
import {useLocale} from './locale';
import {PartnerLeaderMed} from './partner-leadermed';
import {PackageFeeDisclosures} from './package-fee-disclosures';
import {formatPackageMainPrice,formatPackageMainPriceCaption,PACKAGE_DISCLAIMER,PACKAGE_STRIP,PUBLIC_PACKAGES} from '@/lib/public-packages';

function Guide({path,crumb,title,lead,wide,children}:{path:'/services'|'/process'|'/fees'|'/clinic';crumb:[string,string];title:string;lead:string;wide?:boolean;children:ReactNode}){
 const {t}=useLocale();
 return <PublicShell current={path} wideMeasure={wide}>
  <main className={wide?'faq-main fees-page':'faq-main'}>
   <nav className="public-crumbs" aria-label={t('面包屑','Breadcrumb')}><ol><li><a href="/">{t('首页','Home')}</a></li><li aria-current="page">{t(...crumb)}</li></ol></nav>
   <h1>{title}</h1>
   <p className="faq-lead">{lead}</p>
   {children}
  </main>
 </PublicShell>;
}

function Related({links}:{links:Array<[string,string,string]>}){
 const {t}=useLocale();
 return <nav className="public-related" aria-label={t('继续阅读','Continue reading')}>{links.map(([href,zh,en])=><a key={href} href={href}><span>{t('下一页','Next')}</span><strong>{t(zh,en)}</strong></a>)}</nav>;
}

export function ServicesPage(){
 const {t}=useLocale();
 const items=[
  [t('代孕协调','Surrogacy coordination'),t('沟通与评估、诊所与行程对接、进度与报告、出生后手续跟进。','Consultation, clinic and travel coordination, progress and reports, post-birth paperwork follow-up.')],
  [t('独立卵子库','Independent egg bank'),t('经授权后查看与选择；用于知情选择与协调，不构成医疗建议。','View and choose after authorisation — for informed choice and coordination, not medical advice.')],
  [t('独立精子库','Independent sperm bank'),t('经授权后查看与选择；可与代孕或供卵方案按需组合。','View and choose after authorisation — combinable with surrogacy or egg-donor programmes as needed.')],
 ];
 return <Guide path="/services" crumb={['服务','Services']} title={t('格鲁吉亚代孕服务','Georgia surrogacy services')} lead={t('代孕协调、独立卵子库与独立精子库并列可选。登录并获批后，资料库按授权开放。具体组合经个案评估后确认，本页不展示可供识别的供者资料。','Surrogacy coordination, an independent egg bank and an independent sperm bank sit side by side. After sign-in and approval, directories open by grant. Combinations are confirmed after individual assessment. Identifiable donor profiles are not shown here.')}>
  <ol className="public-steps">{items.map(([title,body],i)=><li key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></li>)}</ol>
  <p className="faq-lead">{t('奈斯不是医疗机构，也不是律师事务所，不承诺医疗结果。','Nesta is not a medical provider or a law firm, and does not guarantee medical outcomes.')}</p>
  <Related links={[['/process','查看流程','See the process'],['/fees','查看费用','See fees']]}/>
 </Guide>;
}

export function ProcessPage(){
 const {t}=useLocale();
 const steps=[
  [t('国内体检','Domestic medical checks'),t('按方案要求准备体检与相关资料。','Prepare medical checks and documents required by the programme.')],
  [t('行程安排及实地考察','Travel & site visit'),t('协调出行安排，实地了解服务。','Coordinate travel and visit service providers.')],
  [t('签约与方案确认','Contract & programme confirmation'),t('书面确认方案、费用与服务条件。','Confirm the programme, fees and service terms in writing.')],
  [t('胚胎培育、筛查及储存','Embryo development, screening & storage'),t('由医疗机构按所选方案安排。','Arranged by the clinic according to the selected programme.')],
  [t('体检与移植','Medical checks & transfer'),t('根据医疗评估与所选套餐安排移植。','Schedule transfers according to clinical assessment and the programme.')],
  [t('妊娠确认及产检','Pregnancy confirmation & prenatal checks'),t('跟进妊娠确认及孕期检查安排。','Follow pregnancy confirmation and prenatal appointments.')],
  [t('分娩与新生儿检查','Delivery & newborn checks'),t('衔接分娩、新生儿体检与护理。','Coordinate delivery, newborn examinations and care.')],
  [t('证件办理及返程','Documents & return travel'),t('跟进出生证、护照及返程安排。','Follow birth certificate, passport and return-travel arrangements.')],
 ];
 return <Guide path="/process" crumb={['流程','Process']} title={t('格鲁吉亚代孕流程','Georgia surrogacy process')} lead={t('每条路径不同。下面是通常经过的步骤，顺序和次数按个案评估与诊所安排调整。','Every path is different. These are the usual steps. Order and number follow individual assessment and the clinic’s schedule.')}>
  <ol className="public-steps">{steps.map(([title,body],i)=><li key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></li>)}</ol>
  <Related links={[['/clinic','合作诊所 LeaderMed','Partner clinic LeaderMed'],['/fees','查看费用','See fees']]}/>
 </Guide>;
}

export function FeesPage(){
 const {t,lang}=useLocale();
 return <Guide path="/fees" crumb={['费用','Fees']} wide title={t('格鲁吉亚代孕费用','Georgia surrogacy fees')} lead={t('三档主价为人民币，与套餐原图一致，不做美元换算。另计项目按原图以美元标注。','The three programme prices are RMB, matching the sheet, and are not converted to US dollars. Extras stay in USD where the sheet shows USD.')}>
  <p className="package-strip">{PACKAGE_STRIP.map(item=>t(...item)).join(' · ')}</p>
  <div className="packages-grid">
   {PUBLIC_PACKAGES.map(pkg=><article key={pkg.id} className={pkg.featured?'is-featured':undefined}>
    <span className="pkg-tag">{t(...pkg.tag)}</span>
    <h2>{t(...pkg.title)}</h2>
    <div className="pkg-price"><strong>{formatPackageMainPrice(pkg.totalCny,lang)}</strong><small className="pkg-currency">{lang==='en'?`${formatPackageMainPriceCaption(lang)} · `:''}{t(...pkg.edition)}</small></div>
    <p className="package-highlight">{t(...pkg.highlight)}</p>
    <ul>{pkg.points.map(point=><li key={point[0]}>{t(...point)}</li>)}</ul>
    <a className="quiet-link" href="/#contact">{t('咨询此方案','Discuss this programme')}</a>
   </article>)}
  </div>
  <PackageFeeDisclosures showCurrencyNote/>
  <p className="package-terms">{t(...PACKAGE_DISCLAIMER)}</p>
  <Related links={[['/#packages','首页套餐','Homepage programmes'],['/faq','常见问题','Common questions']]}/>
 </Guide>;
}

export function ClinicPage(){
 const {t}=useLocale();
 return <PublicShell current="/clinic">
  <main className="faq-main public-clinic-intro">
   <nav className="public-crumbs" aria-label={t('面包屑','Breadcrumb')}><ol><li><a href="/">{t('首页','Home')}</a></li><li aria-current="page">{t('诊所','Clinic')}</li></ol></nav>
   <h1>{t('合作诊所 LeaderMed','Partner clinic LeaderMed')}</h1>
   <p className="faq-lead">{t('诊疗由 LeaderMed 负责；奈斯协调评估、行程与进度记录。','Clinical care stays with LeaderMed; Nesta coordinates assessment, travel and progress records.')}</p>
  </main>
  <PartnerLeaderMed skipIntro/>
  <main className="faq-main"><Related links={[['/process','查看流程','See the process'],['/fees','查看费用','See fees']]}/></main>
 </PublicShell>;
}
