export type FaqEntry={id:string;question_zh:string;question_en:string;answer_zh:string;answer_en:string;position:number;hidden:boolean};

export const DEFAULT_FAQ:Array<Omit<FaqEntry,'position'|'hidden'>>=[
 {id:'faq-01',question_zh:'奈斯具体做什么？',question_en:'What does Nesta do?',answer_zh:'奈斯做格鲁吉亚代孕相关协调：沟通与评估、诊所和行程对接、进度与报告、出生后手续跟进。奈斯不是医疗机构，也不是律师事务所。',answer_en:'Nesta coordinates Georgia surrogacy: consultation and assessment, clinic and travel arrangements, progress and reports, and post-birth paperwork follow-up. Nesta is not a medical provider or a law firm.'},
 {id:'faq-02',question_zh:'诊疗和法律意见由谁负责？',question_en:'Who handles medical and legal advice?',answer_zh:'诊疗由第比利斯合作诊所 LeaderMed 负责。法律资格、亲权与证件结论由持牌专业人士确认。奈斯负责沟通、安排和进度记录，不提供诊断、法律资格判断或紧急医疗联络。',answer_en:'Clinical care stays with the partner clinic, LeaderMed in Tbilisi. Legal eligibility, parentage and document conclusions are confirmed by licensed professionals. Nesta handles communication, arrangements and progress records, and does not diagnose, decide legal eligibility, or provide emergency medical contact.'},
 {id:'faq-03',question_zh:'三种方案怎么区分？',question_en:'How do the three programmes differ?',answer_zh:'A 是自卵自精的医疗协助：一次促排加三次移植，不含接娃期间住宿，不含 DNA 亲子鉴定。资料另列爱心版（MM 或 GG），加 5,000 美元。B 是自精供卵：含 4 个 PGS，不限次数促排及移植，含 DNA 和宝宝健康保障条款。C 也是自精供卵：全部胚胎 PGS，不限次数促排及移植；常规版之外有升级大包，升级差异另行书面确认。具体范围以所选套餐、合同和医疗评估为准。',answer_en:'A is medical assistance with your own eggs and sperm: one stimulation cycle plus three transfers. It excludes accommodation during baby collection and DNA parentage testing. The sheet also lists a care edition (MM or GG) at an extra USD 5,000. B uses donor eggs and your sperm: four PGS tests, unlimited stimulation and transfers, DNA testing, and baby health protection terms. C also uses donor eggs: PGS for all embryos and unlimited stimulation and transfers. Beside the standard edition there is an upgraded package; the differences are confirmed in writing. Scope follows the selected programme, the contract and clinical assessment.'},
 {id:'faq-04',question_zh:'标价是什么币种，含税吗？',question_en:'What currency are the prices, and is tax included?',answer_zh:'首页金额按套餐原图展示。币种、是否含税、发票和当地费用，以书面报价和签约合同为准。网站标价不是要约。额外收费里写明美元的项目，按所标美元理解，仍以书面报价为准。',answer_en:'Homepage amounts follow the original package sheet. Currency, tax, invoices and local fees follow the written quote and signed contract. A price on the site is not an offer. Extras marked in US dollars are read as US dollars, and still follow the written quote.'},
 {id:'faq-05',question_zh:'哪些费用不在套餐里？',question_en:'Which fees sit outside the package?',answer_zh:'页面列出的另计项目包括：双胎 3,000 美元，剖腹产 2,000 美元，额外 PGS 500 美元/颗，NICU 约 300 美元/天，梅毒 3,000 美元，HIV 5,000 美元，自卵方案的二次促排加移植 12,000 美元。加速包为 5,000 美元，约定 12 个月内出生；未达约定则退还加速包费用，起算时间和退款规则以合同为准。未列出的特殊医疗另行确认。',answer_en:'Listed extras include twins at USD 3,000, caesarean section at USD 2,000, additional PGS at USD 500 per embryo, NICU at about USD 300 per day, syphilis at USD 3,000, HIV at USD 5,000, and a second own-egg stimulation plus transfer at USD 12,000. The expedited package is USD 5,000 for birth within an agreed 12 months; if that condition is missed, the expedited fee is refunded. The start date and refund rules follow the contract. Other specialised care is quoted separately.'},
 {id:'faq-06',question_zh:'会保证怀孕、活产或性别吗？',question_en:'Do you guarantee pregnancy, a live birth, or sex?',answer_zh:'不保证医疗结果。B 资料中的「优选性别」、C 资料中的「单胎男宝保障」和宝宝健康保障条款，都是合同里的约定，适用条件和补偿范围以书面合同为准。',answer_en:'Medical outcomes are not guaranteed. “Preferred sex selection” on B, and “singleton boy protection” plus baby health protection terms on the donor-egg programmes, are contract terms. Eligibility and compensation follow the written contract.'},
 {id:'faq-07',question_zh:'从咨询到返程，大概经过哪些步骤？',question_en:'What are the steps from enquiry to return travel?',answer_zh:'通常包括：国内体检、行程与实地考察、书面签约、胚胎培育与筛查储存、移植、妊娠确认和产检跟进、分娩与新生儿检查、出生证和护照及返程安排。顺序和次数按个案评估与诊所安排调整。',answer_en:'The usual path is domestic medical checks, travel and a site visit, a written contract, embryo development with screening and storage, transfer, pregnancy confirmation and prenatal follow-up, delivery and newborn checks, then birth certificate, passport and return travel. Order and number of steps follow individual assessment and the clinic’s schedule.'},
 {id:'faq-08',question_zh:'怎样开始？必须先注册吗？',question_en:'How do I start? Must I register first?',answer_zh:'不用先注册。可以先打电话或发邮件说明基本情况。团队会说明需要的资料、流程和费用范围。确认继续后才建立档案，审核通过后开放服务空间。',answer_en:'No. You can phone or email first. The team explains the information needed, the process and the fee range. A profile is created only after you decide to continue, and the care space opens after review.'},
 {id:'faq-09',question_zh:'卵子库和精子库可以直接看吗？',question_en:'Can I browse the egg and sperm banks immediately?',answer_zh:'首页不展示可供识别的供者资料。登录并获批、取得相应授权后才能查看。资料用于知情选择和协调，不构成医疗建议。',answer_en:'Identifiable donor profiles are not shown on the homepage. You can view them after sign-in, approval and the relevant grant. The directories support informed choice and coordination; they are not medical advice.'},
 {id:'faq-10',question_zh:'进度和报告在哪里看？',question_en:'Where do I see progress and reports?',answer_zh:'获准后进入客户服务空间。阶段、协调员和已发布报告按权限显示。报告保留来源、日期、版本和复核状态。',answer_en:'After approval, use your care space. Stages, your coordinator and published reports appear according to permission. Reports keep their source, date, version and review status.'},
 {id:'faq-11',question_zh:'住宿、出生证和公证怎么算？',question_en:'How do accommodation, the birth certificate and notarisation work?',answer_zh:'资料写明全程 30 天住宿、可自由分配；A 方案不含接娃期间住宿。套餐包含公证、海牙认证及法务服务的跟进，以及出生证和护照办理的跟进。DNA 亲子鉴定在 B、C 包含，A 不包含。奈斯记录进度，不替代持牌人士的法律意见，也不承诺证件或国籍结果。',answer_en:'The sheet includes 30 days of accommodation, which can be allocated freely. Programme A excludes accommodation during baby collection. Packages include follow-up for notarisation, Apostille and legal services, and for the birth certificate and passport. DNA parentage testing is included in B and C, and excluded from A. Nesta records progress. It does not replace advice from a licensed professional, and it does not promise a document or nationality outcome.'},
 {id:'faq-12',question_zh:'可以在网站上付款吗？',question_en:'Can I pay on the website?',answer_zh:'不可以。网站不办理付款。应付金额、节点和凭证以签约合同为准；签约后的收款记录在你的服务空间里查看。',answer_en:'No. The site does not take payment. Amounts due, milestones and proof follow the signed contract. After you sign, receipts appear in your care space.'},
];

export function visibleFaq(rows:FaqEntry[]){
 return [...rows].filter(row=>!row.hidden).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
}

export function publicFaq(rows:FaqEntry[],lang:'zh'|'en'){
 return visibleFaq(rows).map(row=>({
  id:row.id,
  question:lang==='en'?row.question_en:row.question_zh,
  answer:lang==='en'?row.answer_en:row.answer_zh,
 }));
}

export function moveFaq(rows:Array<{id:string;position:number}>,id:string,direction:'up'|'down'){
 const ordered=[...rows].sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 const index=ordered.findIndex(row=>row.id===id);
 const swap=direction==='up'?index-1:index+1;
 if(index<0||swap<0||swap>=ordered.length)return null;
 return [
  {id:ordered[index].id,position:ordered[swap].position},
  {id:ordered[swap].id,position:ordered[index].position},
 ];
}
