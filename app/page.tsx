import type {Metadata} from 'next';
import {headers} from 'next/headers';
import Home from './home-view';
import {CONTACT_EMAIL,CONTACT_PHONE} from '@/lib/public-contact';
import {HOME_DESCRIPTION,HOME_TITLE,jsonLdScript,organizationJsonLd,publicOrigin} from '@/lib/seo';

export async function generateMetadata():Promise<Metadata>{
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return {metadataBase:new URL(origin),title:{absolute:HOME_TITLE},description:HOME_DESCRIPTION,alternates:{canonical:'/'},robots:{index:true,follow:true},openGraph:{title:HOME_TITLE,description:HOME_DESCRIPTION,url:'/',siteName:'Nesta',locale:'zh_CN',type:'website',images:[{url:'/nesta-family.webp',width:1448,height:1086,alt:'父母轻抱婴儿的家庭主题配图'}]}};
}

export default async function Page(){
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(organizationJsonLd(origin,{email:CONTACT_EMAIL,telephone:CONTACT_PHONE}))}}/><Home/></>;
}
