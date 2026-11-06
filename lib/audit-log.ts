import {validDate} from './policy.ts';

type Row=Record<string,unknown>;
type Query={
 all:(sql:string,...params:string[])=>Promise<Row[]>;
};
export type AuditFilter={action?:string;actor?:string;target?:string;from?:string;to?:string;limit?:number;offset?:number};

function like(value:string){
 return '%'+value.trim().slice(0,80).replace(/[\\%_]/g,ch=>'\\'+ch)+'%';
}

const labeled=`SELECT a.id,a.action,a.reason,a.created_at,a.target,COALESCE(actor.name,a.actor_id) AS actor_name,COALESCE(tp.name,c.code,r.title,a.target) AS target_label FROM audit a LEFT JOIN profiles actor ON actor.id=a.actor_id LEFT JOIN profiles tp ON tp.id=a.target LEFT JOIN cases c ON c.id=a.target LEFT JOIN reports r ON r.id=a.target`;

/** Newest 100 rows after filters, so a date or action search can see past the latest page. */
export async function readAudit(query:Query,filter:AuditFilter={}){
 const clauses:string[]=[];
 const params:string[]=[];
 const action=filter.action?.trim()||'';
 const actor=filter.actor?.trim()||'';
 const target=filter.target?.trim()||'';
 if(action){clauses.push("action LIKE ? ESCAPE '\\'");params.push(like(action))}
 if(actor){clauses.push("actor_name LIKE ? ESCAPE '\\'");params.push(like(actor))}
 if(target){clauses.push("target_label LIKE ? ESCAPE '\\'");params.push(like(target))}
 if(filter.from&&validDate(filter.from)){clauses.push('substr(created_at,1,10)>=?');params.push(filter.from)}
 if(filter.to&&validDate(filter.to)){clauses.push('substr(created_at,1,10)<=?');params.push(filter.to)}
 const where=clauses.length?` WHERE ${clauses.join(' AND ')}`:'';
 params.push(String(filter.limit??100),String(filter.offset??0));
 return query.all(`SELECT * FROM (${labeled}) AS audit_rows${where} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,...params);
}
