import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {DEFAULT_FAQ} from '@/lib/faq';
import {listPublicFaq} from '@/lib/server';
import {FAQ_DESCRIPTION,FAQ_TITLE,faqJsonLd,jsonLdScript,publicOrigin} from '@/lib/seo';
import {FaqView,type PublicFaq} from './faq-view';

export async function generateMetadata():Promise<Metadata>{
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return {metadataBase:new URL(origin),title:FAQ_TITLE,description:FAQ_DESCRIPTION,alternates:{canonical:'/faq'},robots:{index:true,follow:true},openGraph:{title:FAQ_TITLE,description:FAQ_DESCRIPTION,url:'/faq',siteName:'Nesta',locale:'zh_CN',type:'website'}};
}

function starterFaq():PublicFaq[]{
 return DEFAULT_FAQ.map(item=>({id:item.id,question_zh:item.question_zh,question_en:item.question_en,answer_zh:item.answer_zh,answer_en:item.answer_en}));
}

export default async function Page(){
 let items:PublicFaq[];
 try{items=await listPublicFaq()}catch{items=starterFaq()}
 if(!items.length)items=starterFaq();
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(faqJsonLd(items))}}/><FaqView items={items}/></>;
}
