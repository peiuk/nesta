export const HOME_TITLE='格鲁吉亚代孕协调 · 流程、费用与合作诊所';
export const HOME_DESCRIPTION='奈斯是第比利斯 LeaderMed 医院的独家合作伙伴，协调格鲁吉亚代孕。配套为专业月子中心，持牌儿科医生 24 小时值班。须个别评估，不承诺医疗结果。';
export const FAQ_TITLE='格鲁吉亚代孕常见问题';
export const FAQ_DESCRIPTION='奈斯做什么、三种方案如何区分、费用币种、从咨询到返程的步骤，以及怎样开始。奈斯不是医疗机构或律师事务所，不承诺结果。';
export function publicOrigin(configured:string|undefined,host:string|null,proto:string|null){
 const fixed=configured?.trim().replace(/\/$/,'');
 if(fixed)return fixed;
 const name=host?.trim()||'localhost:3000';
 const scheme=proto?.trim()||(name.startsWith('localhost')||name.startsWith('127.')?'http':'https');
 return `${scheme}://${name}`;
}

export const SITEMAP_LASTMOD='2026-11-04';
export const OG_IMAGE={url:'/nesta-family.webp',width:1448,height:1086,alt:'父母轻抱婴儿的家庭主题配图'};

export function robotsTxt(origin:string){
 return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /portal\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export const PUBLIC_PAGES=[
 {path:'/',title:HOME_TITLE,description:HOME_DESCRIPTION},
 {path:'/services',title:'格鲁吉亚代孕服务',description:'代孕协调、独立卵子库与独立精子库。资料库经授权后查看，用于知情选择，不构成医疗建议。'},
 {path:'/process',title:'格鲁吉亚代孕流程',description:'从国内体检、行程与实地考察、书面签约、胚胎筛查、移植、产检，到证件办理和返程。顺序按个案评估与诊所安排调整。'},
 {path:'/fees',title:'格鲁吉亚代孕费用',description:'A、B、C 三种方案、包含项目与额外收费。金额按套餐原图展示，币种和条件以书面报价为准，不承诺医疗结果。'},
 {path:'/clinic',title:'LeaderMed 医院独家合作伙伴',description:'奈斯是第比利斯 LeaderMed 医院的独家合作伙伴。配套月子中心为专业机构，持牌儿科医生 24 小时值班。诊疗由医院负责。'},
 {path:'/faq',title:FAQ_TITLE,description:FAQ_DESCRIPTION},
] as const;

const SITEMAP_META:Record<string,{changefreq:string;priority:string}>={
 '/':{changefreq:'weekly',priority:'1.0'},
 '/services':{changefreq:'monthly',priority:'0.8'},
 '/process':{changefreq:'monthly',priority:'0.9'},
 '/fees':{changefreq:'monthly',priority:'0.9'},
 '/clinic':{changefreq:'monthly',priority:'0.8'},
 '/faq':{changefreq:'weekly',priority:'0.8'},
};

export function sitemapXml(origin:string){
 const urls=PUBLIC_PAGES.map(page=>{
  const loc=page.path==='/'?origin:origin+page.path;
  const meta=SITEMAP_META[page.path];
  return `  <url><loc>${loc}</loc><lastmod>${SITEMAP_LASTMOD}</lastmod><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority></url>`;
 }).join('\n');
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function jsonLdScript(data:unknown){
 return JSON.stringify(data).replace(/</g,'\\u003c');
}

export function organizationJsonLd(origin:string,contact:{email:string;telephone:string}){
 return {'@context':'https://schema.org','@type':'Organization',name:'Nesta',url:`${origin}/`,email:contact.email,telephone:contact.telephone,description:HOME_DESCRIPTION};
}

export function faqJsonLd(items:Array<{question_zh:string;answer_zh:string}>){
 return {'@context':'https://schema.org','@type':'FAQPage',mainEntity:items.map(item=>({'@type':'Question',name:item.question_zh,acceptedAnswer:{'@type':'Answer',text:item.answer_zh}}))};
}

export function breadcrumbJsonLd(origin:string,path:string){
 const page=PUBLIC_PAGES.find(item=>item.path===path);
 const items=[{name:'首页',path:'/'},...(path==='/'||!page?[]:[{name:page.title,path:page.path}])];
 return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:item.path==='/'?`${origin}/`:`${origin}${item.path}`}))};
}

export function webPageJsonLd(origin:string,path:string){
 const page=PUBLIC_PAGES.find(item=>item.path===path);
 if(!page)throw new Error('Unknown public page');
 const url=path==='/'?`${origin}/`:`${origin}${path}`;
 return {'@context':'https://schema.org','@type':'WebPage',name:page.title,description:page.description,url,inLanguage:'zh-CN',isPartOf:{'@type':'WebSite',name:'Nesta',url:`${origin}/`}};
}

export function feeOfferJsonLd(origin:string,offers:Array<{name:string;price:number;description:string}>){
 return {'@context':'https://schema.org','@type':'OfferCatalog',name:'格鲁吉亚代孕方案',url:`${origin}/fees`,itemListElement:offers.map(offer=>({'@type':'Offer',name:offer.name,description:offer.description,price:String(offer.price),priceCurrency:'CNY',url:`${origin}/fees`}))};
}
