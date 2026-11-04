import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {DEFAULT_FAQ} from '@/lib/faq';
import {listPublicFaq} from '@/lib/server';
import {FAQ_DESCRIPTION,FAQ_TITLE,OG_IMAGE,breadcrumbJsonLd,faqJsonLd,jsonLdScript,publicOrigin,webPageJsonLd} from '@/lib/seo';
import {FaqView,type PublicFaq} from './faq-view';

export async function generateMetadata():Promise<Metadata>{
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return {metadataBase:new URL(origin),title:FAQ_TITLE,description:FAQ_DESCRIPTION,alternates:{canonical:'/faq'},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1}},openGraph:{title:FAQ_TITLE,description:FAQ_DESCRIPTION,url:'/faq',siteName:'Nesta',locale:'zh_CN',type:'website',images:[OG_IMAGE]},twitter:{card:'summary_large_image',title:FAQ_TITLE,description:FAQ_DESCRIPTION,images:[OG_IMAGE.url]}};
}

function starterFaq():PublicFaq[]{
 return DEFAULT_FAQ.map(item=>({id:item.id,question_zh:item.question_zh,question_en:item.question_en,answer_zh:item.answer_zh,answer_en:item.answer_en}));
}

export default async function Page(){
 const headerList=await headers();
 let items:PublicFaq[];
 try{items=await listPublicFaq()}catch{items=starterFaq()}
 if(!items.length)items=starterFaq();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(breadcrumbJsonLd(origin,'/faq'))}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(webPageJsonLd(origin,'/faq'))}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(faqJsonLd(items))}}/><FaqView items={items}/></>;
}
