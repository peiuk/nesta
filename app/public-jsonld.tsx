import {headers} from 'next/headers';
import {PUBLIC_PACKAGES} from '@/lib/public-packages';
import {breadcrumbJsonLd,feeOfferJsonLd,jsonLdScript,PUBLIC_PAGES,publicOrigin,webPageJsonLd} from '@/lib/seo';

type PublicPath=(typeof PUBLIC_PAGES)[number]['path'];

export async function PublicJsonLd({path}:{path:Exclude<PublicPath,'/'>}){
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 const blocks:unknown[]=[breadcrumbJsonLd(origin,path),webPageJsonLd(origin,path)];
 if(path==='/fees')blocks.push(feeOfferJsonLd(origin,PUBLIC_PACKAGES.map(pkg=>({name:pkg.title[0],price:pkg.totalCny,description:pkg.summary[0]}))));
 return <>{blocks.map(block=>{const typed=block as {'@type':string};return <script key={typed['@type']} type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(block)}}/>})}</>;
}
