export type ActorPolicy={id:string;role:string;status:string};
export type ReportPolicy={status:string;uploaded_by:string;reviewed_by:string|null};
export const ACTIVE_STAFF=['admin','coordinator','reviewer'];
export function canManageCase(a:ActorPolicy,m:string|null){return a.status==='approved'&&['admin','coordinator'].includes(a.role)&&m==='coordinator'}
export function canReadReport(a:ActorPolicy,m:string|null,r:ReportPolicy,recipient:boolean){if(a.status!=='approved'||!m)return false;if(ACTIVE_STAFF.includes(a.role)&&['coordinator','reviewer'].includes(m))return true;return a.role==='client'&&m==='client'&&recipient&&r.status==='published'}
export function canReviewReport(a:ActorPolicy,m:string|null,r:ReportPolicy){return a.status==='approved'&&a.role==='reviewer'&&m==='reviewer'&&r.status==='draft'&&r.uploaded_by!==a.id}
export function canPublishReport(a:ActorPolicy,m:string|null,r:ReportPolicy){return canManageCase(a,m)&&r.status==='reviewed'&&!!r.reviewed_by&&r.reviewed_by!==r.uploaded_by}
export function canUseDirectory(a:ActorPolicy,g:{scope:string;expires_at:string;revoked_at:string|null}|null,scope:string,now=new Date().toISOString()){return a.status==='approved'&&!!g&&!g.revoked_at&&g.scope===scope&&Number.isFinite(Date.parse(g.expires_at))&&Date.parse(g.expires_at)>Date.parse(now)}
export function validDate(s:string){return /^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s}
export function validMutation(origin:string|null,expected:string,marker:string|null,fetchSite:string|null){return origin===expected&&marker==='firstleaf'&&fetchSite!=='cross-site'}
export function validateUpload(name:string,mime:string,bytes:Uint8Array){if(bytes.length<8||bytes.length>8*1024*1024)return false;const extension=name.split('.').pop()?.toLowerCase();if(extension==='pdf'&&mime==='application/pdf')return String.fromCharCode(...bytes.slice(0,5))==='%PDF-';if(['jpg','jpeg'].includes(extension??'')&&mime==='image/jpeg')return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;if(extension==='png'&&mime==='image/png')return [137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);return false}
