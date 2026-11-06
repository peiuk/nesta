import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeEmail,emailProfileId,hashSecret,verifySecret,generateOtpCode,ipThrottleWindow} from '../lib/email-auth.ts';

test('normalizeEmail trims and lowercases valid addresses',()=>{
 assert.equal(normalizeEmail('  Ada@Example.COM '),'ada@example.com');
 assert.equal(normalizeEmail('not-an-email'),null);
 assert.equal(normalizeEmail(''),null);
});

test('emailProfileId is stable and prefixed',async()=>{
 const a=await emailProfileId('ada@example.com');
 const b=await emailProfileId('ada@example.com');
 assert.equal(a,b);
 assert.match(a,/^email:[0-9a-f]{32}$/);
 assert.notEqual(a,await emailProfileId('bob@example.com'));
});

test('hashSecret verifies and rejects wrong codes',async()=>{
 const pepper='test-pepper';
 const {salt,hash}=await hashSecret('123456',pepper);
 assert.equal(await verifySecret('123456',pepper,salt,hash),true);
 assert.equal(await verifySecret('000000',pepper,salt,hash),false);
});

test('generateOtpCode is six digits',()=>{
 for(let i=0;i<20;i++)assert.match(generateOtpCode(),/^\d{6}$/);
});
test('IP throttle permits five requests per hour and blocks the sixth',()=>{
 assert.equal(ipThrottleWindow(4,60*60*1000-1),true);
 assert.equal(ipThrottleWindow(5,60*60*1000-1),false);
 assert.equal(ipThrottleWindow(5,60*60*1000),true);
});
