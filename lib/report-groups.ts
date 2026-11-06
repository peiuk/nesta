export function groupReports<T extends {cycle?:unknown;report_date?:unknown}>(rows:T[]){
 const groups=new Map<number,T[]>();
 for(const row of rows){const cycle=Number(row.cycle)||1;groups.set(cycle,[...(groups.get(cycle)||[]),row])}
 return [...groups.entries()].sort(([a],[b])=>b-a).map(([cycle,reports])=>({cycle,reports:reports.sort((a,b)=>scalarText(b.report_date).localeCompare(scalarText(a.report_date)))}));
}
import {scalarText} from './text.ts';
