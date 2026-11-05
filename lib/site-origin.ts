export function normalizeSiteOrigin(value:string){
 const s=value.trim().replace(/\/+$/,'');
 if(!s)return '';
 try{
  const u=s.includes('://')?new URL(s):new URL(`https://${s}`);
  return u.origin;
 }catch{
  return s;
 }
}

export function resolveExpectedOrigin(request:Request,configured?:string){
 const fromEnv=normalizeSiteOrigin(configured||'');
 if(fromEnv)return fromEnv;
 return new URL(request.url).origin;
}

export function mutationOriginMatches(request:Request,expected:string){
 const origin=request.headers.get('origin');
 if(origin)return normalizeSiteOrigin(origin)===expected;
 const referer=request.headers.get('referer');
 if(referer){
  try{return new URL(referer).origin===expected}catch{return false}
 }
 return false;
}
