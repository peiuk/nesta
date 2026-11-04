import type {Metadata} from 'next';
import {headers} from 'next/headers';
import Home from './home-view';
import {CONTACT_EMAIL,CONTACT_PHONE} from '@/lib/public-contact';
import {HOME_DESCRIPTION,HOME_TITLE,OG_IMAGE,breadcrumbJsonLd,jsonLdScript,organizationJsonLd,publicOrigin,webPageJsonLd} from '@/lib/seo';

export async function generateMetadata():Promise<Metadata>{
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return {metadataBase:new URL(origin),title:{absolute:HOME_TITLE},description:HOME_DESCRIPTION,alternates:{canonical:'/'},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1}},openGraph:{title:HOME_TITLE,description:HOME_DESCRIPTION,url:'/',siteName:'Nesta',locale:'zh_CN',type:'website',images:[OG_IMAGE]},twitter:{card:'summary_large_image',title:HOME_TITLE,description:HOME_DESCRIPTION,images:[OG_IMAGE.url]}};
}

export default async function Page(){
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(organizationJsonLd(origin,{email:CONTACT_EMAIL,telephone:CONTACT_PHONE}))}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(webPageJsonLd(origin,'/'))}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLdScript(breadcrumbJsonLd(origin,'/'))}}/><Home/></>;
}
