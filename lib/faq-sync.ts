import {DEFAULT_FAQ} from './faq.ts';

export type FaqSyncSummary={updated:number;inserted:number};

export type FaqSyncStatement={sql:string;params:unknown[]};

export function summarizeDefaultFaqSync(existingIds:Iterable<string>):FaqSyncSummary{
 const set=new Set(existingIds);
 let updated=0,inserted=0;
 for(const item of DEFAULT_FAQ){
  if(set.has(item.id))updated++;
  else inserted++;
 }
 return {updated,inserted};
}

export function buildDefaultFaqSeedStatements(ts:string):FaqSyncStatement[]{
 return DEFAULT_FAQ.map((item,index)=>({
  sql:'INSERT INTO faq_entries (id,question_zh,question_en,answer_zh,answer_en,position,hidden,updated_at,updated_by) VALUES (?,?,?,?,?,?,0,?,NULL)',
  params:[item.id,item.question_zh,item.question_en,item.answer_zh,item.answer_en,index+1,ts],
 }));
}

export function buildDefaultFaqSyncStatements(opts:{ts:string;actorId:string;existing:Array<{id:string;position:number}>}):{statements:FaqSyncStatement[];summary:FaqSyncSummary}{
 const byId=new Map(opts.existing.map(row=>[row.id,row]));
 let maxPos=opts.existing.reduce((max,row)=>Math.max(max,row.position),0);
 const statements:FaqSyncStatement[]=[];
 const summary=summarizeDefaultFaqSync(byId.keys());
 for(const item of DEFAULT_FAQ){
  if(byId.has(item.id)){
   statements.push({
    sql:'UPDATE faq_entries SET question_zh=?,question_en=?,answer_zh=?,answer_en=?,updated_at=?,updated_by=? WHERE id=?',
    params:[item.question_zh,item.question_en,item.answer_zh,item.answer_en,opts.ts,opts.actorId,item.id],
   });
  }else{
   maxPos+=1;
   statements.push({
    sql:'INSERT INTO faq_entries (id,question_zh,question_en,answer_zh,answer_en,position,hidden,updated_at,updated_by) VALUES (?,?,?,?,?,?,0,?,?)',
    params:[item.id,item.question_zh,item.question_en,item.answer_zh,item.answer_en,maxPos,opts.ts,opts.actorId],
   });
  }
 }
 return {statements,summary};
}
