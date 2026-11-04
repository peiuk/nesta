import test from 'node:test';
import assert from 'node:assert/strict';
import * as faq from '../lib/faq.ts';

const rows=[
 {id:'b',question_zh:'乙',question_en:'B',answer_zh:'答乙',answer_en:'Ans B',position:2,hidden:false},
 {id:'a',question_zh:'甲',question_en:'A',answer_zh:'答甲',answer_en:'Ans A',position:1,hidden:false},
 {id:'c',question_zh:'丙',question_en:'C',answer_zh:'答丙',answer_en:'Ans C',position:3,hidden:true},
];

test('public faq keeps visible entries in order and in the requested language',()=>{
 assert.deepEqual(faq.publicFaq(rows,'zh'),[
  {id:'a',question:'甲',answer:'答甲'},
  {id:'b',question:'乙',answer:'答乙'},
 ]);
 assert.equal(faq.publicFaq(rows,'en')[0].question,'A');
});

test('moving an entry swaps it with the neighbour and stops at the ends',()=>{
 const order=[{id:'a',position:1},{id:'b',position:2},{id:'c',position:3}];
 assert.deepEqual(faq.moveFaq(order,'b','up'),[{id:'b',position:1},{id:'a',position:2}]);
 assert.equal(faq.moveFaq(order,'a','up'),null);
 assert.equal(faq.moveFaq(order,'c','down'),null);
});

test('the starter list is the twelve published questions',()=>{
 assert.equal(faq.DEFAULT_FAQ.length,12);
 const published=faq.publicFaq(faq.DEFAULT_FAQ.map((item,index)=>({...item,position:index+1,hidden:false})),'zh');
 assert.equal(published[0].question,'奈斯具体做什么？');
 assert.equal(published.at(-1).question,'可以在网站上付款吗？');
});
