import {gmailConfigured,resendConfigured,type MailEnv} from './mail.ts';

export function emailSignInAvailable(env:MailEnv&{SESSION_SECRET?:string}){
 return Boolean(env.SESSION_SECRET?.trim()&&(gmailConfigured(env)||resendConfigured(env)))
}
