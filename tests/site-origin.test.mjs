import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSiteOrigin,mutationOriginMatches,resolveExpectedOrigin} from '../lib/site-origin.ts';
import {validMutation} from '../lib/policy.ts';

test('normalizeSiteOrigin strips trailing slash and adds scheme',()=>{
 assert.equal(normalizeSiteOrigin('http://nestafamily.com/'),'http://nestafamily.com');
 assert.equal(normalizeSiteOrigin('https://nestafamily.com'),'https://nestafamily.com');
});

test('validMutation accepts normalized origins',()=>{
 assert.equal(validMutation('http://nestafamily.com/','http://nestafamily.com','firstleaf','same-origin'),true);
 assert.equal(validMutation('https://nestafamily.com','http://nestafamily.com','firstleaf','same-origin'),false);
});

test('mutationOriginMatches uses referer when origin header missing',()=>{
 const request=new Request('http://nestafamily.com/admin',{headers:{referer:'http://nestafamily.com/admin', 'x-firstleaf':'firstleaf'}});
 assert.equal(mutationOriginMatches(request,'http://nestafamily.com'),true);
 assert.equal(resolveExpectedOrigin(request,'http://nestafamily.com/'),'http://nestafamily.com');
});
