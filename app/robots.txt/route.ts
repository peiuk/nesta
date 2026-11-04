import {publicOrigin,robotsTxt} from '@/lib/seo';

export function GET(request:Request){
 const url=new URL(request.url);
 const origin=publicOrigin(process.env.SITE_ORIGIN,request.headers.get('x-forwarded-host')||url.host,request.headers.get('x-forwarded-proto'));
 return new Response(robotsTxt(origin),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
}
