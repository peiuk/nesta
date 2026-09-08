import {chatGPTSignInPath} from '@/app/chatgpt-auth';
import {AdminPortal} from '@/components/product/admin-workspace';

export const dynamic='force-dynamic';
export const metadata={title:'管理后台 · 初禾 FIRSTLEAF',robots:{index:false,follow:false}};
export default function AdminPage(){return <AdminPortal signInHref={chatGPTSignInPath('/admin')}/>}
