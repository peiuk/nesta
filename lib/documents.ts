export const DOCUMENT_KINDS=['birth_certificate','parentage','notarisation','apostille'] as const;
export type DocumentKind=typeof DOCUMENT_KINDS[number];
export const DOCUMENT_STATUSES=['not_started','in_progress','complete','blocked'] as const;
export type DocumentStatus=typeof DOCUMENT_STATUSES[number];

const KINDS=new Set<string>(DOCUMENT_KINDS);
const STATUSES=new Set<string>(DOCUMENT_STATUSES);
const KIND_ORDER=new Map(DOCUMENT_KINDS.map((kind,i)=>[kind,i]));

export type DocumentRow={kind:string;status:string;status_date:string|null;notes:string;updated_at:string};

export function assertDocumentKind(kind:string):DocumentKind{
 if(KINDS.has(kind))return kind as DocumentKind;
 throw new Error('DOCUMENT_KIND_INVALID');
}

export function assertDocumentStatus(status:string):DocumentStatus{
 if(STATUSES.has(status))return status as DocumentStatus;
 throw new Error('DOCUMENT_STATUS_INVALID');
}

function isDay(s:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const date=new Date(s+'T00:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s;
}

export function normalizeStatusDate(value:unknown):string|null{
 if(value==null)return null;
 const s=String(value).trim();
 if(!s)return null;
 if(!isDay(s))throw new Error('INVALID_DATE');
 return s;
}

export function projectDocument(row:DocumentRow,includeInternal:boolean){
 const base={kind:row.kind,status:row.status,status_date:row.status_date};
 if(!includeInternal)return base;
 return {...base,notes:row.notes,updated_at:row.updated_at};
}

export function sortDocuments<T extends {kind:string}>(rows:T[]){
 return [...rows].sort((a,b)=>(KIND_ORDER.get(a.kind as DocumentKind)??99)-(KIND_ORDER.get(b.kind as DocumentKind)??99));
}

export function documentSeedRows(caseId:string,ts:string){
 return DOCUMENT_KINDS.map(kind=>({case_id:caseId,kind,status:'not_started' as const,status_date:null,notes:'',updated_at:ts,updated_by:null}));
}
