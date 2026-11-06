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
 const configuredOrigins=(configured||'').split(',').map(normalizeSiteOrigin).filter(Boolean);
 const requestOrigin=new URL(request.url).origin;
 // SITE_ORIGIN may list explicitly configured host aliases, comma-separated.
 // Only accept one of those hosts; unknown Host values fall back to the
 // canonical first origin and therefore fail the same-origin comparison.
 if(configuredOrigins.includes(requestOrigin))return requestOrigin;
 return configuredOrigins[0]||requestOrigin;
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
