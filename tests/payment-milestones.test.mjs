import test from 'node:test';
import assert from 'node:assert/strict';
import * as plans from '../lib/case-plans.ts';

test('normalizes checkbox values to unique supported payment milestone keys',()=>{
 assert.equal(typeof plans.normalizePaidMilestoneKeys,'function');
 assert.deepEqual(plans.normalizePaidMilestoneKeys(['preg24','intent','preg24','week28','unknown','']),['intent','preg24']);
});

test('normalizes an empty payment selection to no paid milestones',()=>{
 assert.deepEqual(plans.normalizePaidMilestoneKeys([]),[]);
});

test('new plans use the homepage A/B/C catalogue with currency and version',()=>{
 assert.equal(plans.packageSpec('a').total,400000);
 assert.equal(plans.packageSpec('a').currency,'CNY');
 assert.equal(plans.packageSpec('a').version,'abc-2026-10');
 assert.equal(plans.packageSpec('a').pgsScope,'contract');
 assert.equal(plans.packageSpec('b').total,520000);
 assert.equal(plans.packageSpec('b').pgs,4);
 assert.equal(plans.packageSpec('c').total,580000);
 assert.equal(plans.packageSpec('c').pgsScope,'all');
 assert.equal(plans.packageSpec('c_plus').total,630000);
 assert.equal(plans.packageSpec('mid').total,72000);
 assert.equal(plans.packageSpec('mid').currency,'USD');
 assert.equal(plans.packageSpec('mid').version,'legacy-2026-09');
});

test('an old paid milestone is replaced by the seven-node schedule for the full total',()=>{
 const previous=[{key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'}];
 const next=plans.scheduleMilestones(previous,80000);
 assert.equal(next.find(m=>m.key==='contract'),undefined);
 assert.equal(next.some(m=>m.status==='paid'||m.paid_at),false);
 assert.deepEqual(next.map(m=>m.key),['intent','setup','match_lab','heartbeat','preg12','preg24','handover']);
 assert.deepEqual(next.map(m=>m.amount_usd),[1600,6400,8000,16000,12000,12000,24000]);
 assert.equal(next.reduce((sum,m)=>sum+m.amount_usd,0),80000);
});

test('a stored legacy plan keeps its total and receipt but replaces the old schedule',()=>{
 const plan=plans.publicPlan({
  case_id:'c1',tier:'mid',total_usd:72000,pgs_included:6,pgs_extra_usd:500,
  currency:'USD',package_version:'legacy-2026-09',pgs_scope:'count',
  milestones_json:JSON.stringify([{key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'}]),
  receipts:[{amount:5000,currency:'USD',paid_on:'2026-03-01',voucher:'R-1'}],
 });
 assert.equal(plan.tier,'mid');
 assert.equal(plan.total_usd,72000);
 assert.equal(plan.currency,'USD');
 assert.equal(plan.package_version,'legacy-2026-09');
 assert.deepEqual(plan.milestones.map(m=>m.key),['intent','setup','match_lab','heartbeat','preg12','preg24','handover']);
 assert.deepEqual(plan.milestones.map(m=>m.amount_usd),[1440,5760,7200,14400,10800,10800,21600]);
 assert.equal(plan.milestones.some(m=>m.status==='paid'||m.paid_at),false);
 assert.equal(plan.milestones.some(m=>['contract','cycle','week12','week28','birth'].includes(m.key)),false);
 assert.equal(plan.receipts[0].amount,5000);
 assert.equal(plan.receipts[0].paid_on,'2026-03-01');
 assert.equal(plan.paid_usd,5000);
 assert.equal(plan.pending_usd,67000);
});

test('plan draft replaces an old schedule and does not invent receipts',()=>{
 const previous=[{key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'}];
 const draft=plans.planDraft({tier:'mid',total:90000,previous});
 assert.equal(draft.currency,'USD');
 assert.equal(draft.package_version,'legacy-2026-09');
 assert.equal(draft.milestones.find(m=>m.key==='contract'),undefined);
 assert.equal(draft.milestones.every(m=>m.paid_at==null&&m.status==='pending'),true);
 assert.deepEqual(draft.milestones.map(m=>m.amount_usd),[1800,7200,9000,18000,13500,13500,27000]);
 assert.equal('receipts' in draft,false);
 const fresh=plans.planDraft({tier:'b',total:520000,previous:[]});
 assert.equal(fresh.currency,'CNY');
 assert.equal(fresh.package_version,'abc-2026-10');
 assert.equal(fresh.pgs_included,4);
 assert.equal(fresh.milestones.every(m=>m.paid_at==null),true);
 assert.deepEqual(fresh.milestones.map(m=>m.key),['intent','setup','match_lab','heartbeat','preg12','preg24','handover']);
 assert.equal(fresh.milestones.some(m=>m.key==='week28'||m.key==='birth'),false);
 assert.equal(fresh.milestones.reduce((sum,m)=>sum+m.amount_usd,0),520000);
});

test('new schedules use the seven-milestone percentages for each package total',()=>{
 const expectScaled=(tier,total,amounts)=>{
  const milestones=plans.defaultMilestones(tier);
  assert.equal(milestones.reduce((sum,m)=>sum+m.amount_usd,0),total);
  assert.deepEqual(milestones.map(m=>m.amount_usd),amounts);
  const cumulative=[];
  for(const amount of amounts)cumulative.push((cumulative.at(-1)||0)+amount);
  assert.deepEqual(cumulative.map(amount=>Math.round(amount/total*100)),[2,10,20,40,55,70,100]);
 };
 expectScaled('a',400000,[8000,32000,40000,80000,60000,60000,120000]);
 expectScaled('b',520000,[10400,41600,52000,104000,78000,78000,156000]);
 expectScaled('c',580000,[11600,46400,58000,116000,87000,87000,174000]);
 expectScaled('c_plus',630000,[12600,50400,63000,126000,94500,94500,189000]);
 expectScaled('basic',58000,[1160,4640,5800,11600,8700,8700,17400]);
 expectScaled('mid',72000,[1440,5760,7200,14400,10800,10800,21600]);
 expectScaled('advanced',84000,[1680,6720,8400,16800,12600,12600,25200]);
});

test('own-egg programme A labels the lab milestone as stimulation',()=>{
 const ownEgg=plans.defaultMilestones('a').find(m=>m.key==='match_lab');
 const donor=plans.planDraft({tier:'c_plus',total:630000,previous:[]}).milestones.find(m=>m.key==='match_lab');
 const legacy=plans.defaultMilestones('mid').find(m=>m.key==='match_lab');
 assert.equal(ownEgg.label_zh,'促排或实验室启动');
 assert.equal(ownEgg.label_en,'Stimulation or lab start');
 assert.equal(ownEgg.amount_usd,40000);
 assert.equal(donor.label_zh,'供卵匹配或实验室启动');
 assert.equal(donor.label_en,'Donor match or lab start');
 assert.equal(legacy.label_zh,'供卵匹配或实验室启动');
 assert.deepEqual(plans.defaultMilestones('b').map(m=>[m.label_zh,m.label_en]),[
  ['签约意向','Signing intent'],
  ['合同生效并建档完成','Contract and file setup'],
  ['供卵匹配或实验室启动','Donor match or lab start'],
  ['见到胎心','Heartbeat confirmed'],
  ['孕 12 周','Pregnancy ~12 weeks'],
  ['孕 24 周','Pregnancy ~24 weeks'],
  ['出生并完成约定交接后','After birth and agreed handover'],
 ]);
});

test('a stored five-step schedule is replaced outright, including paid legacy nodes',()=>{
 const previous=[
  {key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'},
  {key:'cycle',label_zh:'周期启动 / 进入医疗',label_en:'Cycle start',amount_usd:10000,status:'pending',paid_at:null},
  {key:'week12',label_zh:'确认妊娠约 12 周',label_en:'Pregnancy ~12 weeks',amount_usd:14000,status:'pending',paid_at:null},
  {key:'week28',label_zh:'妊娠约 28 周',label_en:'Pregnancy ~28 weeks',amount_usd:18000,status:'paid',paid_at:'2026-04-01T00:00:00.000Z'},
  {key:'birth',label_zh:'出生后约定工作日内',label_en:'After birth',amount_usd:20000,status:'pending',paid_at:null},
 ];
 const next=plans.scheduleMilestones(previous,72000,'mid');
 assert.deepEqual(next.map(m=>m.key),['intent','setup','match_lab','heartbeat','preg12','preg24','handover']);
 assert.equal(next.some(m=>['contract','cycle','week12','week28','birth'].includes(m.key)),false);
 assert.equal(next.some(m=>m.status==='paid'||m.paid_at||m.label_zh.includes('28')),false);
 assert.deepEqual(next.map(m=>m.amount_usd),[1440,5760,7200,14400,10800,10800,21600]);
 assert.equal(next.reduce((sum,m)=>sum+m.amount_usd,0),72000);
 const again=plans.scheduleMilestones(next,72000,'mid');
 assert.deepEqual(again.map(m=>({key:m.key,amount_usd:m.amount_usd,status:m.status,paid_at:m.paid_at})),next.map(m=>({key:m.key,amount_usd:m.amount_usd,status:m.status,paid_at:m.paid_at})));
});

test('a paid current node keeps its amount and the remainder follows unpaid weights',()=>{
 const previous=plans.defaultMilestones('mid').map(m=>m.key==='heartbeat'?{...m,status:'paid',paid_at:'2026-06-01T00:00:00.000Z'}:m);
 const next=plans.scheduleMilestones(previous,90000,'mid');
 const heartbeat=next.find(m=>m.key==='heartbeat');
 assert.equal(heartbeat.amount_usd,14400);
 assert.equal(heartbeat.status,'paid');
 assert.equal(heartbeat.paid_at,'2026-06-01T00:00:00.000Z');
 assert.equal(next.filter(m=>m.key!=='heartbeat').every(m=>m.status==='pending'),true);
 assert.equal(next.reduce((sum,m)=>sum+m.amount_usd,0),90000);
 assert.deepEqual(next.filter(m=>m.status==='pending').map(m=>m.amount_usd),[1890,7560,9450,14175,14175,28350]);
});

test('five paid legacy nodes are dropped instead of appended to the new schedule',()=>{
 const previous=['contract','cycle','week12','week28','birth'].map((key,index)=>({
  key,label_zh:'旧'+key,label_en:key,amount_usd:1000*(index+1),status:'paid',paid_at:`2026-01-0${index+1}T00:00:00.000Z`,
 }));
 const next=plans.scheduleMilestones(previous,72000,'a');
 assert.equal(next.length,7);
 assert.deepEqual(plans.parseMilestones(JSON.stringify(next)).filter(m=>m.status==='paid'),[]);
 assert.equal(next.find(m=>m.key==='match_lab').label_zh,'促排或实验室启动');
 assert.equal(next.reduce((sum,m)=>sum+m.amount_usd,0),72000);
});

test('an official seven-step schedule keeps a customized amount on later reads',()=>{
 const stored=plans.defaultMilestones('b').map(m=>m.key==='heartbeat'?{...m,amount_usd:1,status:'paid',paid_at:'2026-06-01T00:00:00.000Z',label_zh:'胎心已改'}:m);
 const row={
  case_id:'c2',tier:'b',total_usd:520000,pgs_included:4,pgs_extra_usd:500,
  currency:'CNY',package_version:'abc-2026-10',pgs_scope:'count',
  milestones_json:JSON.stringify(stored),
  receipts:[{amount:50,currency:'CNY',paid_on:'2026-07-01',voucher:'R-2'}],
 };
 const plan=plans.publicPlan(row);
 assert.equal(plan.milestones.find(m=>m.key==='heartbeat').amount_usd,1);
 assert.equal(plan.milestones.find(m=>m.key==='heartbeat').label_zh,'胎心已改');
 assert.equal(plan.milestones.find(m=>m.key==='heartbeat').paid_at,'2026-06-01T00:00:00.000Z');
 assert.equal(plan.milestones.find(m=>m.key==='intent').amount_usd,10400);
 assert.equal(plan.paid_usd,51);
 const again=plans.publicPlan(row);
 assert.equal(again.milestones.find(m=>m.key==='heartbeat').amount_usd,1);
 assert.deepEqual(plans.milestoneRewrites([{case_id:'c2',tier:'b',total_usd:520000,milestones_json:row.milestones_json}]),[]);
});

test('stored plans that are not the official seven keys are rewritten once',()=>{
 const legacy={case_id:'c1',tier:'mid',total_usd:72000,milestones_json:JSON.stringify([{key:'week28',label_zh:'妊娠约 28 周',label_en:'Pregnancy ~28 weeks',amount_usd:18000,status:'paid',paid_at:'2026-04-01T00:00:00.000Z'}])};
 const ownEgg={case_id:'c3',tier:'a',total_usd:400000,milestones_json:'not-json'};
 const official=plans.defaultMilestones('c').map(m=>m.key==='handover'?{...m,amount_usd:10}:m);
 const updates=plans.milestoneRewrites([
  legacy,
  ownEgg,
  {case_id:'c4',tier:'c',total_usd:580000,milestones_json:JSON.stringify(official)},
 ]);
 assert.deepEqual(updates.map(row=>row.case_id),['c1','c3']);
 const mid=plans.parseMilestones(updates[0].milestones_json);
 assert.deepEqual(mid.map(m=>m.key),['intent','setup','match_lab','heartbeat','preg12','preg24','handover']);
 assert.deepEqual(mid.map(m=>m.amount_usd),[1440,5760,7200,14400,10800,10800,21600]);
 assert.equal(mid.some(m=>m.status==='paid'||m.key==='week28'),false);
 assert.equal(mid.find(m=>m.key==='match_lab').label_zh,'供卵匹配或实验室启动');
 const egg=plans.parseMilestones(updates[1].milestones_json);
 assert.equal(egg.find(m=>m.key==='match_lab').label_zh,'促排或实验室启动');
 assert.equal(egg.find(m=>m.key==='match_lab').amount_usd,40000);
 assert.deepEqual(plans.milestoneRewrites(updates.map(row=>({case_id:row.case_id,tier:row.case_id==='c3'?'a':'mid',total_usd:row.case_id==='c3'?400000:72000,milestones_json:row.milestones_json}))),[]);
});
