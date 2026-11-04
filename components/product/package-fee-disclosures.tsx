'use client';
import {useLocale} from './locale';
import {PACKAGE_EXPEDITE,PACKAGE_EXTRAS,PACKAGE_INCLUSIONS} from '@/lib/public-packages';

export function PackageFeeDisclosures({showCurrencyNote}:{showCurrencyNote?:boolean}){
 const {t}=useLocale();
 return <>
  <details className="package-disclosure package-disclosure-block">
   <summary><span>{t('费用包含明细','What the fees include')}</span><span className="disclosure-plus" aria-hidden="true">+</span></summary>
   <div className="package-inclusions package-inclusions-collapsed">
    <p className="package-disclosure-lead">{t('具体范围对应所选套餐。','The precise scope follows the selected programme.')}</p>
    <ol className="package-inclusion-list">
     {PACKAGE_INCLUSIONS.map((item,i)=><li key={item.title[0]}><span className="inclusion-number">{String(i+1).padStart(2,'0')}</span><div><strong>{t(...item.title)}</strong>{item.note&&<p>{t(...item.note)}</p>}</div></li>)}
    </ol>
   </div>
  </details>
  <details className="package-disclosure package-disclosure-block">
   <summary><span>{t('额外收费 · 不包含在上述套餐内','Additional fees · outside the packages')}</span><span className="disclosure-plus" aria-hidden="true">+</span></summary>
   <div className="package-extras package-extras-collapsed">
    <p className="package-disclosure-lead">{t('按适用条件另计。','Charged separately where they apply.')}</p>
    <dl className="package-extra-list">
     {PACKAGE_EXTRAS.map(item=><div key={item.title[0]}><dt>{t(...item.title)}</dt><dd>{t(...item.price)}</dd></div>)}
    </dl>
    <aside className="package-expedite"><h4>{t(...PACKAGE_EXPEDITE.title)}</h4><p>{t(...PACKAGE_EXPEDITE.body)}</p></aside>
    {showCurrencyNote?<p className="packages-note">{t('另计项中原图“$”为美元；套餐主价为人民币。计费单位及具体条件以书面报价为准。','“$” on listed extras means US dollars. Main programme prices are RMB. Billing units and specific terms follow your written quote.')}</p>:null}
   </div>
  </details>
 </>;
}
