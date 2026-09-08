import {chatGPTSignInPath} from '@/app/chatgpt-auth';
import {Portal} from '@/components/product/portal';
export const dynamic='force-dynamic';
export default function PortalPage(){return <Portal signInHref={chatGPTSignInPath('/portal')}/>}
