export type MailEnv={
 GOOGLE_CLIENT_ID?:string;GOOGLE_CLIENT_SECRET?:string;GMAIL_REFRESH_TOKEN?:string;GMAIL_USER?:string;
 RESEND_API_KEY?:string;EMAIL_FROM?:string;SITE_ORIGIN?:string;
};

export class MailError extends Error{
 status:number;code:string;
 constructor(status:number,code:string){super(code);this.name='MailError';this.status=status;this.code=code}
}

export function gmailConfigured(env:MailEnv){
 return Boolean(env.GOOGLE_CLIENT_ID?.trim()&&env.GOOGLE_CLIENT_SECRET?.trim()&&env.GMAIL_REFRESH_TOKEN?.trim()&&(env.GMAIL_USER?.trim()||env.EMAIL_FROM?.trim()))
}

export function resendConfigured(env:MailEnv){
 return Boolean(env.RESEND_API_KEY?.trim()&&env.EMAIL_FROM?.trim())
}

function failMail(status:number,code:string):never{throw new MailError(status,code)}

function base64url(bytes:Uint8Array){
 let bin='';for(let i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]!);
 return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')
}

function rfc822({from,to,subject,text}:{from:string;to:string;subject:string;text:string}){
 return[`From: ${from}`,`To: ${to}`,`Subject: ${subject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','',text].join('\r\n')
}

async function refreshGoogleAccessToken(env:MailEnv){
 const body=new URLSearchParams({
  client_id:env.GOOGLE_CLIENT_ID!.trim(),
  client_secret:env.GOOGLE_CLIENT_SECRET!.trim(),
  refresh_token:env.GMAIL_REFRESH_TOKEN!.trim(),
  grant_type:'refresh_token',
 });
 const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
 if(!res.ok){
  const detail=await res.text().catch(()=>'');
  console.error('[firstleaf-mail-google-token]',res.status,detail.slice(0,300));
  // Token endpoint often returns 400 invalid_grant for bad/revoked refresh tokens
  if(res.status===400||res.status===401||res.status===403)failMail(503,'EMAIL_AUTH_FAILED');
  failMail(503,'EMAIL_SEND_FAILED');
 }
 const json=await res.json() as {access_token?:string};
 if(!json.access_token)failMail(503,'EMAIL_AUTH_FAILED');
 return json.access_token;
}

async function sendViaGmail(env:MailEnv,mail:{to:string;subject:string;text:string}){
 const from=(env.EMAIL_FROM?.trim()||env.GMAIL_USER!.trim());
 const accessToken=await refreshGoogleAccessToken(env);
 const raw=base64url(new TextEncoder().encode(rfc822({from,to:mail.to,subject:mail.subject,text:mail.text})));
 const res=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{
  method:'POST',
  headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},
  body:JSON.stringify({raw}),
 });
 if(!res.ok){
  const detail=await res.text().catch(()=>'');
  console.error('[firstleaf-mail-gmail]',res.status,detail.slice(0,300));
  if(res.status===401||res.status===403)failMail(503,'EMAIL_AUTH_FAILED');
  failMail(503,'EMAIL_SEND_FAILED');
 }
}

async function sendViaResend(env:MailEnv,mail:{to:string;subject:string;text:string}){
 const res=await fetch('https://api.resend.com/emails',{
  method:'POST',
  headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
  body:JSON.stringify({from:env.EMAIL_FROM,to:[mail.to],subject:mail.subject,text:mail.text}),
 });
 if(!res.ok){
  const detail=await res.text().catch(()=>'');
  console.error('[firstleaf-mail-resend]',res.status,detail.slice(0,300));
  if(res.status===401)failMail(503,'EMAIL_AUTH_FAILED');
  if(res.status===403){
   try{
    const body=JSON.parse(detail) as {name?:string;message?:string};
    if(body.name==='validation_error'||/testing emails|verify a domain/i.test(body.message||''))failMail(503,'EMAIL_RECIPIENT_RESTRICTED');
   }catch{/* fall through */}
   failMail(503,'EMAIL_AUTH_FAILED');
  }
  failMail(503,'EMAIL_SEND_FAILED');
 }
}

export async function sendMail(env:MailEnv,mail:{to:string;subject:string;text:string}){
 if(gmailConfigured(env)){await sendViaGmail(env,mail);return}
 if(resendConfigured(env)){await sendViaResend(env,mail);return}
 const origin=env.SITE_ORIGIN||'';
 if(origin&&!/localhost|127\.0\.0\.1/.test(origin))failMail(503,'SERVICE_UNAVAILABLE');
 console.info('[firstleaf-otp]',mail.to,mail.text);
}
