type Actor={id:string;role:string;status:string};
type Row=Record<string,string|number|null>;
type Statement={sql:string;params:string[]};
export type SelectionStore={first:(sql:string,...params:string[])=>Promise<Row|null>;all:(sql:string,...params:string[])=>Promise<Row[]>;batch:(items:Statement[])=>Promise<{changes:number}[]>};
export class SelectionError extends Error{
 status:number;code:string;
 constructor(status:number,code:string){super(code);this.status=status;this.code=code}
}
function fail(status:number,code:string):never{throw new SelectionError(status,code)}
function requireRole(actor:Actor,role:string){if(actor.status!=='approved'||actor.role!==role)fail(403,'FORBIDDEN')}
function noteText(value:string,required=false){const text=value.trim();if(text.length>1000||(required&&!text)||text.includes('\u0000'))fail(400,'INVALID_INPUT');return text}
const eligibleFrom="FROM profiles p JOIN directory_grants g ON g.user_id=p.id AND g.scope='egg' JOIN donors d ON d.id=? WHERE p.id=? AND p.role='client' AND p.status='approved' AND g.revoked_at IS NULL AND g.expires_at>? AND d.kind='egg' AND d.status='available'";
const eligible=(store:SelectionStore,donorId:string,userId:string,now:string)=>store.first('SELECT 1 '+eligibleFrom,donorId,userId,now);
function audit(actor:Actor,action:string,id:string,reason:string,now:string,token:string):Statement{return {sql:'INSERT INTO audit(id,actor_id,action,target,reason,created_at) SELECT ?,?,?,?,?,? FROM egg_requests WHERE id=? AND transition_token=?',params:[crypto.randomUUID(),actor.id,action,id,reason,now,id,token]}}

export async function listEggRequests(store:SelectionStore,actor:Actor){
 if(actor.status!=='approved'||!['client','admin'].includes(actor.role))fail(403,'FORBIDDEN');
 const columns='r.id,r.donor_code,r.status,r.note,r.reply,r.created_at,r.updated_at';
 if(actor.role==='admin')return store.all(`SELECT ${columns},p.name AS client_name,p.email AS client_email,d.status AS donor_status FROM egg_requests r JOIN profiles p ON p.id=r.user_id JOIN donors d ON d.id=r.donor_id ORDER BY CASE WHEN r.status='pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 200`);
 return store.all(`SELECT ${columns} FROM egg_requests r WHERE r.user_id=? ORDER BY r.created_at DESC LIMIT 200`,actor.id);
}

export async function submitEggRequest(store:SelectionStore,actor:Actor,donorId:string,note:string,now=new Date().toISOString()){
 requireRole(actor,'client');note=noteText(note);
 if(!await eligible(store,donorId,actor.id,now))fail(409,'SELECTION_NOT_ELIGIBLE');
 const id=crypto.randomUUID(),token=crypto.randomUUID();
 let results;
 try{results=await store.batch([
  {sql:`INSERT INTO egg_requests(id,user_id,donor_id,donor_code,status,note,created_at,updated_at,transition_token) SELECT ?,p.id,d.id,d.code,'pending',?,?,?,? ${eligibleFrom}`,params:[id,note,now,now,token,donorId,actor.id,now]},
  audit(actor,'egg_request.submit',id,'Client submitted egg donor selection',now,token),
 ])}catch(e){if(e instanceof Error&&/UNIQUE constraint failed.*egg_requests/i.test(e.message))fail(409,'REQUEST_EXISTS');throw e}
 if(!results[0].changes)fail(409,'SELECTION_NOT_ELIGIBLE');
 return {id};
}

export async function decideEggRequest(store:SelectionStore,actor:Actor,id:string,status:'approved'|'rejected',reply:string,now=new Date().toISOString()){
 requireRole(actor,'admin');if(!['approved','rejected'].includes(status))fail(400,'INVALID_INPUT');reply=noteText(reply,true);
 const current=await store.first('SELECT user_id,donor_id,status FROM egg_requests WHERE id=?',id);
 if(!current||current.status!=='pending'||typeof current.donor_id!=='string'||typeof current.user_id!=='string')fail(409,'STALE_RECORD');
 if(status==='approved'&&!await eligible(store,current.donor_id,current.user_id,now))fail(409,'SELECTION_NOT_ELIGIBLE');
 const token=crypto.randomUUID();
 const guard=status==='approved'?` AND EXISTS(SELECT 1 ${eligibleFrom})`:'';
 const params=[status,reply,actor.id,now,token,id,...(status==='approved'?[current.donor_id,current.user_id,now]:[])];
 const result=await store.batch([
  {sql:`UPDATE egg_requests SET status=?,reply=?,reviewed_by=?,updated_at=?,transition_token=? WHERE id=? AND status='pending'${guard}`,params},
  audit(actor,'egg_request.'+status,id,reply,now,token),
 ]);
 if(!result[0].changes){const latest=await store.first('SELECT status FROM egg_requests WHERE id=?',id);fail(409,status==='approved'&&latest?.status==='pending'?'SELECTION_NOT_ELIGIBLE':'STALE_RECORD')}
 return {ok:true};
}

export async function withdrawEggRequest(store:SelectionStore,actor:Actor,id:string,now=new Date().toISOString()){
 requireRole(actor,'client');const token=crypto.randomUUID();
 const result=await store.batch([
  {sql:"UPDATE egg_requests SET status='withdrawn',updated_at=?,transition_token=? WHERE id=? AND user_id=? AND status='pending'",params:[now,token,id,actor.id]},
  audit(actor,'egg_request.withdraw',id,'Client withdrew pending selection',now,token),
 ]);
 if(!result[0].changes)fail(409,'STALE_RECORD');
 return {ok:true};
}
