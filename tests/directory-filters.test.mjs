import test from 'node:test';
import assert from 'node:assert/strict';
import {filterDonors} from '../lib/directory-filters.ts';

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
