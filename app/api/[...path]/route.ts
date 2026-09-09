import {authenticate,handleAuth,read,write,response,AppError} from '@/lib/server';
import {SelectionError} from '@/lib/egg-requests';
import {PhotoError} from '@/lib/donor-photos';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context){
 try{
  const {path}=await context.params;
  if(path[0]==='auth')return await handleAuth(path.slice(1),request);
  const auth=await authenticate(request);
  return request.method==='GET'?await read(path,auth,request):await write(path,auth.profile,request);
 }catch(error){
  if(error instanceof AppError||error instanceof SelectionError||error instanceof PhotoError)return response({error:error.code},error.status);
  console.error('Firstleaf request failed',error instanceof Error?error.message:'Unknown error');
  return response({error:'SERVICE_UNAVAILABLE'},503);
 }
}
export const GET=handle;
export const POST=handle;
