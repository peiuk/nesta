export type PartnerKind='ivf'|'postpartum';
export type PartnerSlot=PartnerKind;
const KINDS=new Set<PartnerKind>(['ivf','postpartum']);

export function assertPartnerKind(kind:string):PartnerKind{
 if(KINDS.has(kind as PartnerKind))return kind as PartnerKind;
 throw new Error('PARTNER_KIND_INVALID');
}

export function canBindPartner(partner:{kind:string;status:string}|null,slot:PartnerSlot):{ok:true}|{ok:false;code:string}{
 if(!partner)return {ok:true};
 if(partner.status!=='active')return {ok:false,code:'PARTNER_INACTIVE'};
 if(partner.kind!==slot)return {ok:false,code:'PARTNER_KIND_MISMATCH'};
 return {ok:true};
}

export function normalizePartnerId(value:unknown):string|null{
 if(value==null||value==='')return null;
 const s=String(value).trim();
 return s||null;
}
