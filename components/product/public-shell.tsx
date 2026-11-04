'use client';
import type {ReactNode} from 'react';
import {Brand} from './brand';
import {useLocale} from './locale';
import {PUBLIC_NAV_LINKS,PublicSiteHeader} from './public-site-header';

export function PublicShell({current,children}:{current:string;children:ReactNode}){
 const {t}=useLocale();
 return <div className="home-shell home-editorial">
  <PublicSiteHeader current={current} className="site-header faq-header"/>
  {children}
  <footer className="site-footer"><Brand/><span className="footer-links"><a href="/">{t('首页','Home')}</a>{PUBLIC_NAV_LINKS.map(([href,zh,en])=><a key={href} href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}<a href="/privacy">{t('隐私与试用说明','Privacy & pilot information')}</a></span></footer>
 </div>;
}
