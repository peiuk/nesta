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
