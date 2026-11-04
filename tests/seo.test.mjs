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
 assert.match(text,/Disallow: \/portal/);
 assert.match(text,/Disallow: \/admin/);
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
 assert.match(xml,/lastmod>2026-11-04</);
});

test('public pages expose breadcrumb and webpage structured data',()=>{
 const crumbs=seo.breadcrumbJsonLd('https://nesta.example','/fees');
 assert.equal(crumbs.itemListElement.length,2);
 assert.equal(crumbs.itemListElement[1].item,'https://nesta.example/fees');
 const page=seo.webPageJsonLd('https://nesta.example','/fees');
 assert.equal(page.inLanguage,'zh-CN');
 assert.match(page.name,/费用|格鲁吉亚/);
 const offers=seo.feeOfferJsonLd('https://nesta.example',[{name:'推荐无忧',price:520000,description:'人民币'}]);
 assert.equal(offers.itemListElement[0].priceCurrency,'CNY');
 assert.equal(offers.itemListElement[0].price,'520000');
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
