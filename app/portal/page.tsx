import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {Portal} from '@/components/product/portal';
import {SignIn} from '@/components/product/registration';
export const dynamic='force-dynamic';
export default async function PortalPage(){const user=await getChatGPTUser();if(!user)return <SignIn href={chatGPTSignInPath('/portal')}/>;return <Portal/>}
