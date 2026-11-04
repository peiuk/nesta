import test from 'node:test';
import assert from 'node:assert/strict';
import * as plans from '../lib/case-plans.ts';

test('normalizes checkbox values to unique supported payment milestone keys',()=>{
 assert.equal(typeof plans.normalizePaidMilestoneKeys,'function');
 assert.deepEqual(plans.normalizePaidMilestoneKeys(['week28','contract','week28','unknown','']),['contract','week28']);
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

test('changing the contract total keeps paid milestone amount and date',()=>{
 const previous=[{key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'}];
 const next=plans.scheduleMilestones(previous,80000);
 const contract=next.find(m=>m.key==='contract');
 assert.equal(contract.amount_usd,10000);
 assert.equal(contract.paid_at,'2026-01-02T00:00:00.000Z');
 assert.equal(next.reduce((sum,m)=>sum+m.amount_usd,0),80000);
 assert.equal(next.filter(m=>m.key!=='contract').every(m=>m.paid_at==null),true);
});

test('a stored legacy plan still reads its original total and paid date',()=>{
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
 assert.equal(plan.milestones[0].amount_usd,10000);
 assert.equal(plan.milestones[0].paid_at,'2026-01-02T00:00:00.000Z');
 assert.equal(plan.paid_usd,15000);
});

test('plan draft does not rewrite receipts or paid dates',()=>{
 const previous=[{key:'contract',label_zh:'签约启动',label_en:'Contract start',amount_usd:10000,status:'paid',paid_at:'2026-01-02T00:00:00.000Z'}];
 const draft=plans.planDraft({tier:'mid',total:90000,previous});
 assert.equal(draft.currency,'USD');
 assert.equal(draft.package_version,'legacy-2026-09');
 assert.equal(draft.milestones.find(m=>m.key==='contract').paid_at,'2026-01-02T00:00:00.000Z');
 assert.equal('receipts' in draft,false);
 const fresh=plans.planDraft({tier:'b',total:520000,previous:[]});
 assert.equal(fresh.currency,'CNY');
 assert.equal(fresh.package_version,'abc-2026-10');
 assert.equal(fresh.pgs_included,4);
 assert.equal(fresh.milestones.every(m=>m.paid_at==null),true);
});
