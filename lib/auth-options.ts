import {gmailConfigured,resendConfigured,type MailEnv} from './mail.ts';

function isLocalDevOrigin(origin?:string){
 if(!origin?.trim())return false;
 try{
  const host=new URL(origin.trim()).hostname;
  return host==='localhost'||host==='127.0.0.1';
 }catch{
  return false;
 }
}

export function emailSignInAvailable(env:MailEnv&{SESSION_SECRET?:string}){
 if(!env.SESSION_SECRET?.trim())return false;
 if(gmailConfigured(env)||resendConfigured(env))return true;
 return isLocalDevOrigin(env.SITE_ORIGIN);
}
