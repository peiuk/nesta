'use client';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';

export const PUBLIC_NAV_LINKS=[['/services','服务','Services'],['/process','流程','Process'],['/fees','费用','Fees'],['/clinic','诊所','Clinic'],['/faq','问答','Questions']] as const;

type PublicSiteHeaderProps={
 current?:string;
 className?:string;
};

export function PublicSiteHeader({current,className}:PublicSiteHeaderProps){
 const {t}=useLocale();
 const headerClass=className??'site-header';
 return <header className={`${headerClass} public-site-header`}>
  <Brand/>
  <div className="public-header-actions">
   <a className="primary-link nav-sign-in" href="/portal"><span className="nav-sign-in-full">{t('客户登录','Client sign-in')}</span><span className="nav-sign-in-short">{t('登录','Sign in')}</span></a>
   <LanguageButton/>
  </div>
  <nav className="public-header-nav" aria-label={t('主导航','Primary')}>
   <a href="/" className="public-nav-link public-nav-home" aria-current={current==='/'?'page':undefined}>{t('首页','Home')}</a>
   {PUBLIC_NAV_LINKS.map(([href,zh,en])=><a key={href} className="public-nav-link" href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}
  </nav>
 </header>;
}
