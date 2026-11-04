'use client';
import type {ReactNode} from 'react';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';

const LINKS=[['/services','服务','Services'],['/process','流程','Process'],['/fees','费用','Fees'],['/clinic','诊所','Clinic'],['/faq','问答','Questions']] as const;

export function PublicShell({current,children}:{current:string;children:ReactNode}){
 const {t}=useLocale();
 return <div className="home-shell home-editorial">
  <header className="site-header faq-header"><Brand/><nav aria-label={t('主导航','Primary')}>
   {LINKS.map(([href,zh,en])=><a key={href} className="nav-desk" href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}
   <LanguageButton/>
   <a className="primary-link" href="/portal">{t('客户登录','Client sign-in')}</a>
  </nav></header>
  {children}
  <footer className="site-footer"><Brand/><span className="footer-links"><a href="/">{t('首页','Home')}</a>{LINKS.map(([href,zh,en])=><a key={href} href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}<a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></span></footer>
 </div>;
}
