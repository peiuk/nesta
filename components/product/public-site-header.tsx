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
 return <header className={headerClass}>
  <Brand/>
  <nav aria-label={t('主导航','Primary')}>
   {PUBLIC_NAV_LINKS.map(([href,zh,en])=><a key={href} className="nav-desk" href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}
   <details className="public-nav-mobile">
    <summary>{t('菜单','Menu')}</summary>
    <div className="public-nav-mobile-panel" role="list">
     {PUBLIC_NAV_LINKS.map(([href,zh,en])=><a key={href} role="listitem" href={href} aria-current={href===current?'page':undefined}>{t(zh,en)}</a>)}
    </div>
   </details>
   <LanguageButton/>
   <a className="primary-link nav-sign-in" href="/portal">{t('客户登录','Client sign-in')}</a>
  </nav>
 </header>;
}
