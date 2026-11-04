'use client';
import {useLocale} from '@/components/product/locale';
import {PublicShell} from '@/components/product/public-shell';
import {CONTACT_EMAIL,CONTACT_PHONE,CONTACT_PHONE_TEL} from '@/lib/public-contact';
import '../home.css';

export type PublicFaq={id:string;question_zh:string;question_en:string;answer_zh:string;answer_en:string};

export function FaqView({items}:{items:PublicFaq[]}){
 const {t,lang}=useLocale();
 const visible=items.map(item=>({id:item.id,question:lang==='en'?item.question_en:item.question_zh,answer:lang==='en'?item.answer_en:item.answer_zh}));
 return <PublicShell>
  <main className="faq-main">
   <div className="eyebrow">QUESTIONS</div>
   <h1>{t('咨询前，先看这几件事。','Read this before you ask.')}</h1>
   <p className="faq-lead">{t('下面是客户最常问的问题，答案与首页套餐和职责说明一致。你的合同、书面报价和医疗机构的判断仍然优先。','These are the questions clients ask most often. The answers match the programmes and responsibilities on the homepage. Your contract, written quote and the clinic’s judgement still come first.')}</p>
   <div className="faq-list">{visible.length?visible.map(item=><details key={item.id} className="package-disclosure"><summary>{item.question}<span className="disclosure-plus" aria-hidden="true">+</span></summary><p>{item.answer}</p></details>):<p className="faq-lead">{t('暂时没有公开问答。','No questions are published yet.')}</p>}</div>
   <div className="faq-next">
    <a className="primary-link" href="/fees">{t('查看套餐','View programmes')}</a>
    <a className="hero-process-link" href={`tel:${CONTACT_PHONE_TEL}`}>{CONTACT_PHONE}</a>
    <a className="hero-process-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
   </div>
  </main>
 </PublicShell>;
}
