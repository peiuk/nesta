'use client';
import type {ReactNode} from 'react';
import {PublicShell} from './public-shell';
import {useLocale} from './locale';
import {PartnerLeaderMed} from './partner-leadermed';

function Guide({eyebrow,title,lead,children}:{eyebrow:string;title:string;lead:string;children:ReactNode}){
 return <PublicShell>
  <main className="faq-main">
   <div className="eyebrow">{eyebrow}</div>
   <h1>{title}</h1>
   <p className="faq-lead">{lead}</p>
   {children}
  </main>
 </PublicShell>;
}

export function ServicesPage(){
 const {t}=useLocale();
 const items=[
  [t('代孕协调','Surrogacy coordination'),t('沟通与评估、诊所与行程对接、进度与报告、出生后手续跟进。','Consultation, clinic and travel coordination, progress and reports, post-birth paperwork follow-up.')],
  [t('独立卵子库','Independent egg bank'),t('经授权后查看与选择；用于知情选择与协调，不构成医疗建议。','View and choose after authorisation — for informed choice and coordination, not medical advice.')],
  [t('独立精子库','Independent sperm bank'),t('经授权后查看与选择；可与代孕或供卵方案按需组合。','View and choose after authorisation — combinable with surrogacy or egg-donor programmes as needed.')],
 ];
 return <Guide eyebrow="SERVICES" title={t('格鲁吉亚代孕服务','Georgia surrogacy services')} lead={t('代孕协调、独立卵子库与独立精子库并列可选。登录并获批后，资料库按授权开放。具体组合经个案评估后确认，本页不展示可供识别的供者资料。','Surrogacy coordination, an independent egg bank and an independent sperm bank sit side by side. After sign-in and approval, directories open by grant. Combinations are confirmed after individual assessment. Identifiable donor profiles are not shown here.')}>
  <ol className="public-steps">{items.map(([title,body],i)=><li key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></li>)}</ol>
  <p className="faq-lead">{t('奈斯不是医疗机构，也不是律师事务所，不承诺医疗结果。','Nesta is not a medical provider or a law firm, and does not guarantee medical outcomes.')} <a href="/process">{t('查看流程','See the process')}</a></p>
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
 return <Guide eyebrow="PROCESS" title={t('格鲁吉亚代孕流程','Georgia surrogacy process')} lead={t('每条路径不同。下面是通常经过的步骤，顺序和次数按个案评估与诊所安排调整。','Every path is different. These are the usual steps. Order and number follow individual assessment and the clinic’s schedule.')}>
  <ol className="public-steps">{steps.map(([title,body],i)=><li key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></li>)}</ol>
  <p className="faq-lead"><a href="/clinic">{t('合作诊所 LeaderMed','Partner clinic LeaderMed')}</a> · <a href="/fees">{t('查看费用','See fees')}</a></p>
 </Guide>;
}

export function FeesPage(){
 const {t}=useLocale();
 const programmes=[
  [t('A · 医疗协助','A · Medical assistance'),t('40万','USD 55,000'),t('自卵自精常规版。一次促排加三次移植，不含接娃期间住宿，不含 DNA 亲子鉴定。爱心版（MM 或 GG）另加 5,000 美元。','Own eggs and sperm, standard edition. One stimulation cycle plus three transfers. Accommodation during baby collection and DNA parentage testing are excluded. The care edition (MM or GG) adds USD 5,000.')],
  [t('B · 推荐无忧','B · Recommended care'),t('52万','USD 72,000'),t('自精供卵。含 4 个 PGS，不限次数促排及移植，含 DNA 亲子鉴定和宝宝健康保障条款。资料中的优选性别是合同约定，不保证结果。','Donor eggs and your sperm. Four PGS tests, unlimited stimulation and transfers, DNA parentage testing and baby health protection terms. Preferred sex selection is a contract term, not a guaranteed outcome.')],
  [t('C · 成功优选','C · Success selection'),t('58万','USD 80,000'),t('自精供卵。全部胚胎 PGS，不限次数促排及移植。常规版之外有 63 万升级大包，升级差异另行书面确认。单胎男宝保障以书面合同为准。','Donor eggs and your sperm. PGS for all embryos, unlimited stimulation and transfers. Beside the standard edition, the upgraded package is shown as 630,000; the differences are confirmed in writing. Singleton boy protection follows the written contract.')],
 ];
 const extras=[
  [t('双胎','Twins'),t('3,000美元','USD 3,000')],
  [t('剖腹产','Caesarean section'),t('2,000美元','USD 2,000')],
  [t('额外 PGS','Additional PGS'),t('500美元 / 颗','USD 500 / embryo')],
  [t('NICU','NICU'),t('约300美元 / 天','About USD 300 / day')],
  [t('梅毒','Syphilis'),t('3,000美元','USD 3,000')],
  [t('HIV','HIV'),t('5,000美元','USD 5,000')],
  [t('自卵方案二次促排加移植','Own-egg second stimulation plus transfer'),t('12,000美元','USD 12,000')],
  [t('加速包','Expedited package'),t('5,000美元','USD 5,000')],
 ];
 return <Guide eyebrow="FEES" title={t('格鲁吉亚代孕费用','Georgia surrogacy fees')} lead={t('以下按套餐原图整理。币种、是否含税和具体条件以书面报价与合同为准。网站标价不是要约，也不承诺医疗结果。','Figures follow the original package sheet. Currency, tax and specific terms follow the written quote and contract. A price on this site is not an offer, and medical outcomes are not guaranteed.')}>
  {programmes.map(([name,price,body])=><article key={name} className="public-fee"><h2>{name}</h2><p className="public-price">{price}</p><p>{body}</p></article>)}
  <h2>{t('额外收费','Additional fees')}</h2>
  <dl className="public-extras">{extras.map(([name,price])=><div key={name}><dt>{name}</dt><dd>{price}</dd></div>)}</dl>
  <p className="faq-lead">{t('加速包约定 12 个月内出生；未达约定则退还加速包费用，起算时间和退款规则以合同为准。包含明细与原图见首页费用一节。','The expedited package is for birth within an agreed 12 months. If that condition is missed, the expedited fee is refunded. The start date and refund rules follow the contract. Included items and the original sheet are in the fees section on the homepage.')} <a href="/#packages">{t('打开首页费用','Open homepage fees')}</a> · <a href="/faq">{t('常见问题','Common questions')}</a></p>
 </Guide>;
}

export function ClinicPage(){
 const {t}=useLocale();
 return <PublicShell>
  <main className="faq-main public-clinic-intro">
   <div className="eyebrow">CLINIC</div>
   <h1>{t('第比利斯合作诊所 LeaderMed','LeaderMed, the partner clinic in Tbilisi')}</h1>
   <p className="faq-lead">{t('奈斯协调评估与治疗安排。诊疗、医学判断和临床结果由诊所负责。本页不承诺活产或成功率。','Nesta coordinates assessment and treatment arrangements. Clinical care, medical judgement and clinical outcomes stay with the clinic. This page does not promise a live birth or a success rate.')}</p>
  </main>
  <PartnerLeaderMed/>
 </PublicShell>;
}
