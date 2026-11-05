export type AddonStatus='none'|'quoted'|'included'|'occurred';
export type PayStatus='pending'|'paid';
export type Tier='a'|'b'|'c'|'c_plus'|'basic'|'mid'|'advanced';
export type PgsScope='count'|'all'|'contract';
export type Milestone={key:string;label_zh:string;label_en:string;amount_usd:number;status:PayStatus;paid_at?:string|null};
export type PlanSpec={tier:Tier;total:number;currency:'CNY'|'USD';version:string;pgs:number;pgsScope:PgsScope};

const CATALOG:Record<Tier,PlanSpec>={
 a:{tier:'a',total:400000,currency:'CNY',version:'abc-2026-10',pgs:0,pgsScope:'contract'},
 b:{tier:'b',total:520000,currency:'CNY',version:'abc-2026-10',pgs:4,pgsScope:'count'},
 c:{tier:'c',total:580000,currency:'CNY',version:'abc-2026-10',pgs:0,pgsScope:'all'},
 c_plus:{tier:'c_plus',total:630000,currency:'CNY',version:'abc-2026-10',pgs:0,pgsScope:'all'},
 basic:{tier:'basic',total:58000,currency:'USD',version:'legacy-2026-09',pgs:0,pgsScope:'count'},
 mid:{tier:'mid',total:72000,currency:'USD',version:'legacy-2026-09',pgs:6,pgsScope:'count'},
 advanced:{tier:'advanced',total:84000,currency:'USD',version:'legacy-2026-09',pgs:6,pgsScope:'count'},
};

export const TIER_TOTAL:Record<'basic'|'mid'|'advanced',number>={basic:58000,mid:72000,advanced:84000};
export const TIER_PGS:Record<'basic'|'mid'|'advanced',number>={basic:0,mid:6,advanced:6};

export function packageSpec(tier:Tier):PlanSpec{return CATALOG[tier]}

// Official client schedule approved by Rio on 2026-11-05. `amount_usd` here is a percentage
// weight of the package total, scaled to each plan's total and currency (CNY for A/B/C/C+,
// USD for legacy basic/mid/advanced). Each installment is due only after the matching checkup
// report or deliverable. Twins, caesarean, NICU, extra PGS and the expedite package sit outside
// these percentages. Do not charge the heartbeat installment if there is no heartbeat. If agreed
// attempts are exhausted without pregnancy, that 20% is not charged, and surrogate matching costs
// already incurred are settled separately. There is no 28-week payment node.
// Own-egg programme A uses a different visible label on match_lab; the key and 10% weight stay.
// Paid legacy keys (contract, cycle, week12, week28, birth) keep their recorded amounts.
// Pending schedules use these seven nodes; the unpaid remainder is split by the weights below.
const PAYMENT_SPLIT=[
 {key:'intent',label_zh:'签约意向',label_en:'Signing intent',amount_usd:2},
 {key:'setup',label_zh:'合同生效并建档完成',label_en:'Contract and file setup',amount_usd:8},
 {key:'match_lab',label_zh:'供卵匹配或实验室启动',label_en:'Donor match or lab start',amount_usd:10},
 {key:'heartbeat',label_zh:'见到胎心',label_en:'Heartbeat confirmed',amount_usd:20},
 {key:'preg12',label_zh:'孕 12 周',label_en:'Pregnancy ~12 weeks',amount_usd:15},
 {key:'preg24',label_zh:'孕 24 周',label_en:'Pregnancy ~24 weeks',amount_usd:15},
 {key:'handover',label_zh:'出生并完成约定交接后',label_en:'After birth and agreed handover',amount_usd:30},
];

const MILESTONE_KEYS=PAYMENT_SPLIT.map(m=>m.key);

function paymentTemplate(tier?:Tier){
 if(tier!=='a')return PAYMENT_SPLIT;
 return PAYMENT_SPLIT.map(m=>m.key==='match_lab'?{...m,label_zh:'促排或实验室启动',label_en:'Stimulation or lab start'}:m);
}

export function normalizePaidMilestoneKeys(values:unknown):string[]{
 const source=Array.isArray(values)?values:String(values||'').split(',');
 const selected=new Set(source.map(value=>String(value).trim()).filter(Boolean));
 return MILESTONE_KEYS.filter(key=>selected.has(key));
}

export function isTier(v:unknown):v is Tier{return typeof v==='string'&&v in CATALOG}
export function isAddon(v:unknown):v is AddonStatus{return v==='none'||v==='quoted'||v==='included'||v==='occurred'}

export function scheduleMilestones(previous:Milestone[],total:number,tier?:Tier):Milestone[]{
 const template=paymentTemplate(tier);
 const prevByKey=new Map(previous.map(m=>[m.key,m]));
 const paid=previous.filter(m=>m.status==='paid');
 const paidSum=paid.reduce((s,m)=>s+m.amount_usd,0);
 if(paidSum>total)throw new Error('PAID_EXCEEDS_TOTAL');
 const pendingTemplate=template.filter(m=>prevByKey.get(m.key)?.status!=='paid');
 const weight=pendingTemplate.reduce((s,m)=>s+m.amount_usd,0)||1;
 const remain=total-paidSum;
 let acc=0;
 const pendingAmounts=new Map<string,number>();
 pendingTemplate.forEach((m,i)=>{
  if(i===pendingTemplate.length-1)pendingAmounts.set(m.key,remain-acc);
  else{const amount=Math.round(m.amount_usd/weight*remain);acc+=amount;pendingAmounts.set(m.key,amount)}
 });
 const known=new Set(MILESTONE_KEYS);
 return [
  ...template.map(m=>{
   const prev=prevByKey.get(m.key);
   if(prev?.status==='paid')return {...m,amount_usd:prev.amount_usd,status:'paid' as const,paid_at:prev.paid_at??null};
   return {...m,amount_usd:pendingAmounts.get(m.key)??0,status:'pending' as const,paid_at:null};
  }),
  ...paid.filter(m=>!known.has(m.key)).map(m=>({...m,paid_at:m.paid_at??null})),
 ];
}

export function planDraft(input:{tier:Tier;total:number;previous:Milestone[];pgsIncluded?:number;pgsExtra?:number}){
 const spec=packageSpec(input.tier);
 return {
  tier:input.tier,
  total:input.total,
  currency:spec.currency,
  package_version:spec.version,
  pgs_included:input.pgsIncluded??spec.pgs,
  pgs_scope:spec.pgsScope,
  pgs_extra:input.pgsExtra??500,
  milestones:scheduleMilestones(input.previous,input.total,input.tier),
 };
}

export function defaultMilestones(tier:Tier,paidKeys:string[]=[]):Milestone[]{
 const paid=new Set(paidKeys);
 return scheduleMilestones([],packageSpec(tier).total,tier).map(m=>paid.has(m.key)?{...m,status:'paid' as const,paid_at:null}:m);
}

export function parseMilestones(raw:string):Milestone[]{
 const v=JSON.parse(raw);
 if(!Array.isArray(v)||v.length<1||v.length>12)throw new Error('INVALID_MILESTONES');
 return v.map((m:any)=>{
  if(!m||typeof m!=='object')throw new Error('INVALID_MILESTONES');
  const key=String(m.key||'').slice(0,40);
  const label_zh=String(m.label_zh||'').slice(0,80);
  const label_en=String(m.label_en||'').slice(0,80);
  const amount_usd=Number(m.amount_usd);
  const status:PayStatus=m.status==='paid'?'paid':'pending';
  if(!key||!label_zh||!Number.isFinite(amount_usd)||amount_usd<0||amount_usd>1000000)throw new Error('INVALID_MILESTONES');
  return {key,label_zh,label_en,amount_usd,status,paid_at:m.paid_at?String(m.paid_at):null};
 });
}

export function publicPlan(row:any){
 if(!row)return null;
 let milestones:Milestone[];
 try{milestones=parseMilestones(String(row.milestones_json))}catch{milestones=[]}
 const legacyPaid=milestones.filter(m=>m.status==='paid').reduce((s,m)=>s+m.amount_usd,0);
 const receipts=Array.isArray(row.receipts)?row.receipts.map((r:any)=>({id:r.id?String(r.id):'',amount:Number(r.amount)||0,currency:String(r.currency||''),paid_on:String(r.paid_on||''),voucher:String(r.voucher||''),note:String(r.note||'')})):[];
 const spec=isTier(row.tier)?packageSpec(row.tier):null;
 const currency=row.currency||spec?.currency||'USD';
 const receiptPaid=receipts.filter((r:any)=>r.currency===currency).reduce((s:number,r:any)=>s+r.amount,0);
 const total=Number(row.total_usd);
 return {
  case_id:row.case_id,
  case_code:row.case_code,
  case_title:row.case_title,
  tier:row.tier,
  currency,
  package_version:row.package_version||spec?.version||'legacy-2026-09',
  pgs_scope:row.pgs_scope||spec?.pgsScope||'count',
  total_usd:total,
  pgs_included:Number(row.pgs_included),
  pgs_extra_usd:Number(row.pgs_extra_usd),
  egg_status:row.egg_status,
  sperm_status:row.sperm_status,
  twin_status:row.twin_status,
  csection_status:row.csection_status,
  nicu_status:row.nicu_status,
  note:row.note||'',
  milestones,
  receipts,
  paid_usd:legacyPaid+receiptPaid,
  pending_usd:Math.max(0,total-(legacyPaid+receiptPaid)),
  updated_at:row.updated_at,
 };
}
