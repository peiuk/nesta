import {normalizeSiteOrigin} from './site-origin.ts';

export type ActorPolicy={id:string;role:string;status:string};
export type ReportPolicy={status:string;uploaded_by:string;reviewed_by:string|null};
export const ACTIVE_STAFF=['admin','coordinator','reviewer'];
export function canManageCase(a:ActorPolicy,m:string|null){return a.status==='approved'&&['admin','coordinator'].includes(a.role)&&m==='coordinator'}
/** Mirrors profile update: a new role drops case membership; any non-approved status, or a role change, revokes directory grants. */
export function accountChangeEffects(current:{role:string;status:string},next:{role:string;status:string}){
 const dropMemberships=current.role!==next.role;
 return {dropMemberships,revokeGrants:dropMemberships||next.status!=='approved'};
}
export function canReadReport(a:ActorPolicy,m:string|null,r:ReportPolicy,recipient:boolean){if(a.status!=='approved'||!m)return false;if(ACTIVE_STAFF.includes(a.role)&&['coordinator','reviewer'].includes(m))return true;return a.role==='client'&&m==='client'&&recipient&&r.status==='published'}
export function canReviewReport(a:ActorPolicy,m:string|null,r:ReportPolicy){return a.status==='approved'&&a.role==='reviewer'&&m==='reviewer'&&r.status==='draft'&&r.uploaded_by!==a.id}
export function canPublishReport(a:ActorPolicy,m:string|null,r:ReportPolicy){return canManageCase(a,m)&&r.status==='reviewed'&&!!r.reviewed_by&&r.reviewed_by!==r.uploaded_by}
export function canUseDirectory(a:ActorPolicy,g:{scope:string;expires_at:string;revoked_at:string|null}|null,scope:string,now=new Date().toISOString()){return a.status==='approved'&&!!g&&!g.revoked_at&&g.scope===scope&&Number.isFinite(Date.parse(g.expires_at))&&Date.parse(g.expires_at)>Date.parse(now)}
export function grantIsActive(grant:{revoked_at:string|null;expires_at:string},now=Date.now()){return !grant.revoked_at&&Date.parse(grant.expires_at)>now}
export function canPostQuestion(actor:{role:string;status:string},membership:string|null){return actor.status==='approved'&&actor.role==='client'&&membership==='client'}
export function validDate(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const date=new Date(s+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s}
export function validMutation(origin:string|null,expected:string,marker:string|null,fetchSite:string|null){
 const normExpected=normalizeSiteOrigin(expected);
 const normOrigin=origin?normalizeSiteOrigin(origin):null;
 return normOrigin===normExpected&&marker==='firstleaf'&&fetchSite!=='cross-site';
}
export type UploadMediaKind='pdf'|'jpeg'|'png';
const PNG_SIGNATURE=[137,80,78,71,13,10,26,10] as const;
function sniffUploadKind(bytes:Uint8Array):UploadMediaKind|null{
 if(bytes.length<8)return null;
 if(String.fromCharCode(...bytes.slice(0,5))==='%PDF-')return 'pdf';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'jpeg';
 if(PNG_SIGNATURE.every((n,i)=>bytes[i]===n))return 'png';
 return null;
}
function extensionForKind(kind:UploadMediaKind){switch(kind){case 'pdf':return ['pdf'];case 'jpeg':return ['jpg','jpeg'];case 'png':return ['png'];default:{const missing:never=kind;return missing}}}
function mimeAliasesForKind(kind:UploadMediaKind){switch(kind){case 'pdf':return ['application/pdf'];case 'jpeg':return ['image/jpeg','image/jpg','image/pjpeg'];case 'png':return ['image/png'];default:{const missing:never=kind;return missing}}}
export function canonicalUploadMime(kind:UploadMediaKind){switch(kind){case 'pdf':return 'application/pdf';case 'jpeg':return 'image/jpeg';case 'png':return 'image/png';default:{const missing:never=kind;return missing}}}
export function classifyUpload(name:string,mime:string,bytes:Uint8Array):UploadMediaKind|null{
 if(bytes.length<8||bytes.length>8*1024*1024)return null;
 const kind=sniffUploadKind(bytes);if(!kind)return null;
 const ext=name.split('.').pop()?.toLowerCase()??'';
 if(!extensionForKind(kind).includes(ext))return null;
 const declared=mime.trim().toLowerCase();
 if(declared&&declared!=='application/octet-stream'&&!mimeAliasesForKind(kind).includes(declared))return null;
 return kind;
}
export function validateUpload(name:string,mime:string,bytes:Uint8Array){return classifyUpload(name,mime,bytes)!==null}
export function hasDirectoryAccess(a:ActorPolicy,grants:Array<{scope:string;expires_at:string;revoked_at:string|null}>,now=new Date().toISOString()){return grants.some(g=>canUseDirectory(a,g,g.scope,now))}
