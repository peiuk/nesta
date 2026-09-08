import test from 'node:test';
import assert from 'node:assert/strict';
import {filterCases} from '../lib/case-filters.ts';
const cases=[{id:'a',code:'FL-001',title:'Family One',stage:'pregnancy',membership_role:'coordinator'},{id:'b',code:'FL-002',title:'Family Two',stage:'assessment',membership_role:null}];
test('case search combines query, stage and assignment without changing source records',()=>{
 assert.deepEqual(filterCases(cases,{query:'  family ',stage:'pregnancy',assignedOnly:true}).map(c=>c.id),['a']);
 assert.deepEqual(filterCases(cases,{query:'fl-002',stage:'all',assignedOnly:false}).map(c=>c.id),['b']);
 assert.deepEqual(filterCases(cases,{query:'fl-002',stage:'all',assignedOnly:true}),[]);
 assert.equal(cases.length,2);
});
