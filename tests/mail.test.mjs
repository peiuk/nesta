import assert from 'node:assert/strict';
import {gmailConfigured,resendConfigured,sendMail} from '../lib/mail.ts';

assert.equal(gmailConfigured({}),false);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt'}),false);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt',GMAIL_USER:'a@b.c'}),true);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt',EMAIL_FROM:'Nesta <a@b.c>'}),true);
assert.equal(resendConfigured({}),false);
assert.equal(resendConfigured({RESEND_API_KEY:'k'}),false);
assert.equal(resendConfigured({RESEND_API_KEY:'k',EMAIL_FROM:'from'}),true);
// Without a provider, only an all-local SITE_ORIGIN may fall back to logging the message.
const mail={to:'a@example.invalid',subject:'s',text:'code 123456'};
for(const SITE_ORIGIN of [undefined,'','https://nestafamily.com','http://localhost:5173,https://nestafamily.com','https://localhost.evil.example']){
 await assert.rejects(sendMail({SITE_ORIGIN},mail),{code:'SERVICE_UNAVAILABLE'},String(SITE_ORIGIN));
}
const info=console.info;console.info=()=>{};
try{for(const SITE_ORIGIN of ['http://localhost:5173','http://127.0.0.1:8787/'])await sendMail({SITE_ORIGIN},mail)}finally{console.info=info}
console.log('mail helpers ok');
