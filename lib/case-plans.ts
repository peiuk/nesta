export type AddonStatus='none'|'quoted'|'included'|'occurred';
export type PayStatus='pending'|'paid';
export type Tier='basic'|'mid'|'advanced';
export type Milestone={key:string;label_zh:string;label_en:string;amount_usd:number;status:PayStatus;paid_at?:string|null};

export const TIER_TOTAL:Record<Tier,number>={basic:58000,mid:72000,advanced:84000};
export const TIER_PGS:Record<Tier,number>={basic:0,mid:6,advanced:6};

const MID_SPLIT=[
 {key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000},
 {key:'cycle',label_zh:'周期启动 / 进入医疗',label_en:'Cycle start',amount_usd:10000},
 {key:'week12',label_zh:'确认妊娠约 12 周',label_en:'Pregnancy ~12 weeks',amount_usd:14000},
 {key:'week28',label_zh:'妊娠约 28 周',label_en:'Pregnancy ~28 weeks',amount_usd:18000},
 {key:'birth',label_zh:'出生后约定工作日内',label_en:'After birth',amount_usd:20000},
];

export function isTier(v:unknown):v is Tier{return v==='basic'||v==='mid'||v==='advanced'}
export function isAddon(v:unknown):v is AddonStatus{return v==='none'||v==='quoted'||v==='included'||v==='occurred'}

export function defaultMilestones(tier:Tier,paidKeys:string[]=[]):Milestone[]{
 const total=TIER_TOTAL[tier];
 const paid=new Set(paidKeys);
 return MID_SPLIT.map(m=>{
  const amount_usd=Math.round(m.amount_usd*(total/72000));
  const status:PayStatus=paid.has(m.key)?'paid':'pending';
  return {...m,amount_usd,status,paid_at:status==='paid'?new Date().toISOString():null};
 });
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
 const paid=milestones.filter(m=>m.status==='paid').reduce((s,m)=>s+m.amount_usd,0);
 const pending=milestones.filter(m=>m.status==='pending').reduce((s,m)=>s+m.amount_usd,0);
 return {
  case_id:row.case_id,
  case_code:row.case_code,
  case_title:row.case_title,
  tier:row.tier,
  total_usd:Number(row.total_usd),
  pgs_included:Number(row.pgs_included),
  pgs_extra_usd:Number(row.pgs_extra_usd),
  egg_status:row.egg_status,
  sperm_status:row.sperm_status,
  twin_status:row.twin_status,
  csection_status:row.csection_status,
  nicu_status:row.nicu_status,
  note:row.note||'',
  milestones,
  paid_usd:paid,
  pending_usd:pending,
  updated_at:row.updated_at,
 };
}
