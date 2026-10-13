import assert from 'node:assert/strict';
import {gmailConfigured,resendConfigured} from '../lib/mail.ts';

assert.equal(gmailConfigured({}),false);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt'}),false);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt',GMAIL_USER:'a@b.c'}),true);
assert.equal(gmailConfigured({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'sec',GMAIL_REFRESH_TOKEN:'rt',EMAIL_FROM:'Nesta <a@b.c>'}),true);
assert.equal(resendConfigured({}),false);
assert.equal(resendConfigured({RESEND_API_KEY:'k'}),false);
assert.equal(resendConfigured({RESEND_API_KEY:'k',EMAIL_FROM:'from'}),true);
console.log('mail helpers ok');
