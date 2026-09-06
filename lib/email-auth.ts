export const OTP_TTL_MS=10*60*1000;
export const SESSION_TTL_MS=14*24*60*60*1000;
export const COOKIE_NAME='firstleaf_session';
export const OTP_MAX_ATTEMPTS=5;
export const OTP_RESEND_MS=60*1000;

const emailRe=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw:string){
 const s=raw.trim().toLowerCase();
 if(!s||s.length>254||!emailRe.test(s)||s.includes('\u0000'))return null;
 return s;
}

function hex(buf:ArrayBuffer){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('')}

export async function emailProfileId(normalizedEmail:string){
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizedEmail));
 return 'email:'+hex(dig).slice(0,32);
}

export function generateOtpCode(){
 const n=crypto.getRandomValues(new Uint32Array(1))[0]%1000000;
 return String(n).padStart(6,'0');
}

export async function hashSecret(secret:string,pepper:string){
 const saltBytes=crypto.getRandomValues(new Uint8Array(16));
 const salt=hex(saltBytes.buffer);
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${pepper}:${salt}:${secret}`));
 return {salt,hash:hex(dig)};
}

export async function verifySecret(secret:string,pepper:string,salt:string,hash:string){
 const dig=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${pepper}:${salt}:${secret}`));
 const next=hex(dig);
 if(next.length!==hash.length)return false;
 let diff=0;for(let i=0;i<next.length;i++)diff|=next.charCodeAt(i)^hash.charCodeAt(i);
 return diff===0;
}

export function parseSessionCookie(header:string|null){
 if(!header)return null;
 const part=header.split(/;\s*/).find(x=>x.startsWith(COOKIE_NAME+'='));
 if(!part)return null;
 const raw=decodeURIComponent(part.slice(COOKIE_NAME.length+1));
 const i=raw.indexOf('.');
 if(i<=0)return null;
 const sessionId=raw.slice(0,i);const token=raw.slice(i+1);
 if(!sessionId||!token)return null;
 return {sessionId,token};
}

export function sessionCookieValue(sessionId:string,token:string,secure=false){
 const base=`${COOKIE_NAME}=${encodeURIComponent(`${sessionId}.${token}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS/1000)}`;
 return secure?base+'; Secure':base;
}

export function clearSessionCookie(secure=false){
 const base=`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
 return secure?base+'; Secure':base;
}
