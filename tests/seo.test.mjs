import test from 'node:test';
import assert from 'node:assert/strict';
import * as seo from '../lib/seo.ts';

test('public origin prefers the configured site and otherwise uses the request host',()=>{
 assert.equal(seo.publicOrigin('https://nesta.example/','preview.example','http'),'https://nesta.example');
 assert.equal(seo.publicOrigin(undefined,'localhost:3000',null),'http://localhost:3000');
 assert.equal(seo.publicOrigin('  ','www.example.com','https'),'https://www.example.com');
});

test('robots allows the public site, skips the api, and points at the sitemap',()=>{
 const text=seo.robotsTxt('https://nesta.example');
 assert.match(text,/Allow: \//);
 assert.match(text,/Disallow: \/api\//);
 assert.match(text,/Sitemap: https:\/\/nesta\.example\/sitemap\.xml/);
});

test('sitemap lists each public page once',()=>{
 const xml=seo.sitemapXml('https://nesta.example');
 for(const page of seo.PUBLIC_PAGES){
  const loc=page.path==='/'?'https://nesta.example':'https://nesta.example'+page.path;
  assert.equal(xml.includes(`<loc>${loc}</loc>`),true,page.path);
 }
 assert.equal(xml.match(/<loc>/g).length,seo.PUBLIC_PAGES.length);
 assert.equal(xml.includes('/privacy'),false);
 assert.equal(xml.includes('/portal'),false);
});

test('faq structured data uses the Chinese question and answer',()=>{
 const data=seo.faqJsonLd([{question_zh:'奈斯具体做什么？',answer_zh:'奈斯做协调。'}]);
 assert.equal(data['@type'],'FAQPage');
 assert.equal(data.mainEntity[0].name,'奈斯具体做什么？');
 assert.equal(data.mainEntity[0].acceptedAnswer.text,'奈斯做协调。');
 assert.equal(seo.jsonLdScript({a:'</script>'}).includes('<'),false);
});

test('public titles name the search phrase',()=>{
 assert.match(seo.HOME_TITLE,/格鲁吉亚代孕/);
 assert.match(seo.FAQ_TITLE,/格鲁吉亚代孕常见问题/);
 assert.match(seo.HOME_DESCRIPTION,/不承诺医疗结果/);
});
