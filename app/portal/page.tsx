import type {Metadata} from 'next';
import {chatGPTSignInPath} from '@/app/chatgpt-auth';
import {Portal} from '@/components/product/portal';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'客户服务空间 · Nesta'},robots:{index:false,follow:false}};
export default function PortalPage(){return <Portal signInHref={chatGPTSignInPath('/portal')}/>}
