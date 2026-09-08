export type DonorFilter={status:string;favoriteOnly:boolean;blood:string;ageMin:string;ageMax:string};

export function filterDonors<T extends {status?:unknown;favorite?:unknown;blood_group?:unknown;age?:unknown}>(
 donors:T[],f:DonorFilter
):T[]{
 return donors.filter(d=>{
  if(f.status!=='all'&&String(d.status)!==f.status)return false;
  if(f.favoriteOnly&&Number(d.favorite)!==1)return false;
  if(f.blood!=='all'&&String(d.blood_group||'')!==f.blood)return false;
  const age=Number(d.age);
  if(f.ageMin!==''&&(!Number.isFinite(age)||age<Number(f.ageMin)))return false;
  if(f.ageMax!==''&&(!Number.isFinite(age)||age>Number(f.ageMax)))return false;
  return true;
 });
}
