import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDonors} from '../lib/directory-filters.ts';

const defaults={status:'all',favoriteOnly:false,blood:'all',ageMin:'',ageMax:''};
test('search matches code and source without case or surrounding whitespace sensitivity',()=>{
 const data=[{code:'EG-021',source:'Tbilisi Partner',age:28},{code:'SP-010',source:'Another clinic',age:30}];
 assert.deepEqual(filterDonors(data,{...defaults,query:' eg-021 '}).map(d=>d.code),['EG-021']);
 assert.deepEqual(filterDonors(data,{...defaults,query:'TBILISI'}).map(d=>d.code),['EG-021']);
});
test('sort uses most recent verification and does not mutate original list',()=>{
 const data=[{code:'A',verified_at:'2026-01-01'},{code:'B',verified_at:'2026-09-01'}];
 assert.deepEqual(filterDonors(data,{...defaults,sort:'verified'}).map(d=>d.code),['B','A']);
 assert.deepEqual(data.map(d=>d.code),['A','B']);
});
test('reversed or invalid age ranges never silently return all donors',()=>{
 for(const ageMin of ['40','NaN','18.5'])assert.equal(filterDonors([{age:28}],{...defaults,ageMin,ageMax:'30'}).length,0);
});

const sample=[
 {id:'1',status:'available',favorite:1,blood_group:'A',age:28},
 {id:'2',status:'matching',favorite:0,blood_group:'B',age:32},
 {id:'3',status:'unavailable',favorite:1,blood_group:'A',age:40},
 {id:'4',status:'archived',favorite:0,blood_group:'O',age:25},
];

test('filters by status favorite blood and age',()=>{
 const out=filterDonors(sample,{status:'available',favoriteOnly:true,blood:'A',ageMin:'20',ageMax:'30'});
 assert.deepEqual(out.map(d=>d.id),['1']);
});

test('all empty means no filter',()=>{
 assert.equal(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'',ageMax:''}).length,4);
});

test('age bounds are inclusive at endpoints',()=>{
 assert.deepEqual(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'28',ageMax:'28'}).map(d=>d.id),['1']);
 assert.deepEqual(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'25',ageMax:'40'}).map(d=>d.id),['1','2','3','4']);
});

test('ageMin alone filters lower bound',()=>{
 assert.deepEqual(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'32',ageMax:''}).map(d=>d.id),['2','3']);
});

test('ageMax alone filters upper bound',()=>{
 assert.deepEqual(filterDonors(sample,{status:'all',favoriteOnly:false,blood:'all',ageMin:'',ageMax:'28'}).map(d=>d.id),['1','4']);
});
