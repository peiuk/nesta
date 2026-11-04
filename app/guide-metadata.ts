import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {OG_IMAGE,PUBLIC_PAGES,publicOrigin} from '@/lib/seo';

export async function guideMetadata(path:(typeof PUBLIC_PAGES)[number]['path']):Promise<Metadata>{
 const page=PUBLIC_PAGES.find(item=>item.path===path);
 if(!page)throw new Error('Unknown public page');
 const headerList=await headers();
 const origin=publicOrigin(process.env.SITE_ORIGIN,headerList.get('x-forwarded-host')||headerList.get('host'),headerList.get('x-forwarded-proto'));
 return {metadataBase:new URL(origin),title:page.title,description:page.description,alternates:{canonical:page.path},robots:{index:true,follow:true,googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1}},openGraph:{title:page.title,description:page.description,url:page.path,siteName:'Nesta',locale:'zh_CN',type:'website',images:[OG_IMAGE]},twitter:{card:'summary_large_image',title:page.title,description:page.description,images:[OG_IMAGE.url]}};
}
