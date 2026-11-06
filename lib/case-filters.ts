export function filterCases<T extends {code?:unknown;title?:unknown;stage?:unknown;membership_role?:unknown}>(cases:T[],filter:{query:string;stage:string;assignedOnly:boolean}):T[]{
 const query=filter.query.trim().toLowerCase();
 return cases.filter(c=>(!query||`${scalarText(c.code)} ${scalarText(c.title)}`.toLowerCase().includes(query))&&(filter.stage==='all'||c.stage===filter.stage)&&(!filter.assignedOnly||Boolean(c.membership_role)));
}
import {scalarText} from './text.ts';
