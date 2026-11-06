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

test('configured host aliases are accepted while unknown request hosts fail closed',()=>{
 const aliasRequest=new Request('https://www.nestafamily.com/api/cases/case/documents',{headers:{origin:'https://www.nestafamily.com'}});
 const allowed='https://nestafamily.com,https://www.nestafamily.com';
 assert.equal(resolveExpectedOrigin(aliasRequest,allowed),'https://www.nestafamily.com');
 assert.equal(mutationOriginMatches(aliasRequest,resolveExpectedOrigin(aliasRequest,allowed)),true);
 const unknownRequest=new Request('https://unexpected.example/api/cases/case/documents',{headers:{origin:'https://unexpected.example'}});
 assert.equal(resolveExpectedOrigin(unknownRequest,allowed),'https://nestafamily.com');
 assert.equal(mutationOriginMatches(unknownRequest,resolveExpectedOrigin(unknownRequest,allowed)),false);
});
