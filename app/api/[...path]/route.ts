import {actor,read,write,response,AppError} from '@/lib/server';
export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(request:Request,context:Context){try{const {path}=await context.params;const a=await actor();return request.method==='GET'?await read(path,a,request):await write(path,a,request)}catch(error){if(error instanceof AppError)return response({error:error.code},error.status);console.error('Firstleaf request failed',error instanceof Error?error.message:'Unknown error');return response({error:'SERVICE_UNAVAILABLE'},503)}}
export const GET=handle;
export const POST=handle;
