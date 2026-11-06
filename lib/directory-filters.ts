export type DonorFilter={status:string;favoriteOnly:boolean;blood:string;ageMin:string;ageMax:string;query?:string;sort?:'code'|'verified'};

export function validAgeRange(min:string,max:string){
 const valid=(value:string)=>value===''||(/^\d+$/.test(value)&&Number(value)>=18&&Number(value)<=65);
 return valid(min)&&valid(max)&&(min===''||max===''||Number(min)<=Number(max));
}

export function filterDonors<T extends {status?:unknown;favorite?:unknown;blood_group?:unknown;age?:unknown;code?:unknown;source?:unknown;verified_at?:unknown}>(
 donors:T[],f:DonorFilter
):T[]{
 if(!validAgeRange(f.ageMin,f.ageMax))return [];
 const query=(f.query||'').trim().toLowerCase();
 const result=donors.filter(d=>{
  if(query&&!`${scalarText(d.code)} ${scalarText(d.source)}`.toLowerCase().includes(query))return false;
  if(f.status!=='all'&&String(d.status)!==f.status)return false;
  if(f.favoriteOnly&&Number(d.favorite)!==1)return false;
  if(f.blood!=='all'&&scalarText(d.blood_group)!==f.blood)return false;
  const age=Number(d.age);
  if(f.ageMin!==''&&(!Number.isFinite(age)||age<Number(f.ageMin)))return false;
  if(f.ageMax!==''&&(!Number.isFinite(age)||age>Number(f.ageMax)))return false;
  return true;
 });
 if(f.sort==='verified')result.sort((a,b)=>scalarText(b.verified_at).localeCompare(scalarText(a.verified_at))||scalarText(a.code).localeCompare(scalarText(b.code)));
 if(f.sort==='code')result.sort((a,b)=>scalarText(a.code).localeCompare(scalarText(b.code),undefined,{numeric:true}));
 return result;
}
import {scalarText} from './text.ts';
