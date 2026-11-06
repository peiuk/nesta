import {canonicalUploadMime,classifyUpload} from './policy.ts';

type Actor={id:string;role:string;status:string};
type Row=Record<string,string|number|null>;
type Store={first:(sql:string,...params:string[])=>Promise<Row|null>;all:(sql:string,...params:string[])=>Promise<Row[]>;batch:(items:{sql:string;params:string[]}[])=>Promise<unknown>};
type Storage={put:(key:string,bytes:Uint8Array,mime:string)=>Promise<unknown>;delete:(key:string)=>Promise<unknown>};
export type DonorMediaKind='image'|'pdf'|'video';
export type PhotoInput={mime:string;bytes:Uint8Array};
export const DONOR_MEDIA_MAX_ITEMS=10;
export const DONOR_MEDIA_BATCH_MAX_BYTES=100*1024*1024;
const VIDEO_MP4_EXTENSIONS=['mp4','m4v','mov'];
const VIDEO_WEBM_EXTENSIONS=['webm'];

function maxBytesForKind(kind:DonorMediaKind){
 switch(kind){
  case 'image':return 5*1024*1024;
  case 'pdf':return 8*1024*1024;
  case 'video':return 50*1024*1024;
  default:{const missing:never=kind;return missing}
 }
}

function sniffVideoMime(name:string,bytes:Uint8Array){
 if(bytes.length<12)return null;
 const ext=name.split('.').pop()?.toLowerCase()??'';
 const webm=bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3;
 if(webm&&VIDEO_WEBM_EXTENSIONS.includes(ext))return 'video/webm';
 const ftyp=String.fromCharCode(...bytes.slice(4,8))==='ftyp';
 if(ftyp&&VIDEO_MP4_EXTENSIONS.includes(ext))return ext==='mov'?'video/quicktime':'video/mp4';
 return null;
}

export function classifyDonorMedia(name:string,mime:string,bytes:Uint8Array):{kind:DonorMediaKind;mime:string}|null{
 if(bytes.length<8)return null;
 const uploadKind=classifyUpload(name,mime,bytes);
 if(uploadKind)return {kind:uploadKind==='pdf'?'pdf':'image',mime:canonicalUploadMime(uploadKind)};
 const videoMime=sniffVideoMime(name,bytes);
 if(!videoMime)return null;
 const declared=mime.trim().toLowerCase();
 if(declared&&declared!=='application/octet-stream'){
  const allowed=new Set([videoMime,'video/mp4','video/webm','video/quicktime']);
  if(!allowed.has(declared))return null;
 }
 return {kind:'video',mime:videoMime};
}
export class PhotoError extends Error{
 status:number;code:string;
 constructor(status:number,code:string){super(code);this.status=status;this.code=code}
}
function fail(status:number,code:string):never{throw new PhotoError(status,code)}
function admin(actor:Actor){if(actor.role!=='admin'||actor.status!=='approved')fail(403,'FORBIDDEN')}
async function authorize(store:Store,actor:Actor,donorId:string){
 if(actor.status!=='approved')fail(403,'FORBIDDEN');
 const donor=await store.first('SELECT kind,status FROM donors WHERE id=?',donorId);
 if(!donor||(actor.role!=='admin'&&donor.status==='archived'))fail(404,'NOT_FOUND');
 if(actor.role!=='admin'){
  const grant=await store.first('SELECT expires_at,revoked_at FROM directory_grants WHERE user_id=? AND scope=?',actor.id,String(donor.kind));
  if(!grant||grant.revoked_at||!Number.isFinite(Date.parse(String(grant.expires_at)))||Date.parse(String(grant.expires_at))<=Date.now())fail(403,'DIRECTORY_LOCKED');
 }
}
export function validateDonorMedia(files:Array<{name:string;mime:string;bytes:Uint8Array}>){
 if(!files.length)fail(400,'PHOTO_REQUIRED');
 if(files.length>DONOR_MEDIA_MAX_ITEMS)fail(409,'PHOTO_LIMIT');
 let total=0;
 for(const {name,mime,bytes} of files){
  const classified=classifyDonorMedia(name,mime,bytes);
  if(!classified||bytes.length>maxBytesForKind(classified.kind))fail(400,'INVALID_PHOTO');
  total+=bytes.length;
 }
 if(total>DONOR_MEDIA_BATCH_MAX_BYTES)fail(413,'PHOTO_BATCH_TOO_LARGE');
}

export function validatePhotos(photos:PhotoInput[]){
 validateDonorMedia(photos.map((photo,i)=>{
  let name=`upload-${i}.png`;
  if(photo.mime==='application/pdf')name=`upload-${i}.pdf`;
  else if(photo.mime==='image/jpeg'||photo.mime==='image/jpg')name=`upload-${i}.jpg`;
  return {name,mime:photo.mime,bytes:photo.bytes};
 }));
}
export async function listDonorPhotos(store:Store,actor:Actor,donorId:string){
 await authorize(store,actor,donorId);
 return store.all('SELECT id,mime,created_at FROM donor_photos WHERE donor_id=? ORDER BY created_at,id',donorId);
}
export async function readDonorPhoto(store:Store,actor:Actor,photoId:string){
 const photo=await store.first('SELECT * FROM donor_photos WHERE id=?',photoId);
 if(!photo)fail(404,'NOT_FOUND');
 await authorize(store,actor,String(photo.donor_id));
 return {...photo,object_key:String(photo.object_key),mime:String(photo.mime),donor_id:String(photo.donor_id)};
}
function audit(actor:Actor,action:string,target:string,reason:string){return {sql:'INSERT INTO audit(id,actor_id,action,target,reason,created_at) VALUES(?,?,?,?,?,?)',params:[crypto.randomUUID(),actor.id,action,target,reason,new Date().toISOString()]}}
export async function uploadDonorPhotos(store:Store,storage:Storage,actor:Actor,donorId:string,photos:PhotoInput[],names?:string[]){
 admin(actor);await authorize(store,actor,donorId);
 const files=photos.map((photo,i)=>{
  let name=names?.[i]?.trim()||'';
  if(!name.includes('.')){
   if(photo.mime==='image/png')name='upload.png';
   else if(photo.mime==='image/jpeg'||photo.mime==='image/jpg')name='upload.jpg';
   else if(photo.mime==='application/pdf')name='upload.pdf';
   else if(photo.mime.startsWith('video/'))name='upload.mp4';
   else name=`upload-${i}.png`;
  }
  return {name,mime:photo.mime,bytes:photo.bytes};
 });
 validateDonorMedia(files);
 const existing=await store.first('SELECT COUNT(*) AS count,MAX(created_at) AS latest FROM donor_photos WHERE donor_id=?',donorId);
 if(Number(existing?.count)+photos.length>10)fail(409,'PHOTO_LIMIT');
 const firstTime=Math.max(Date.now(),(Date.parse(String(existing?.latest))||0)+1);
 const entries=files.map((file,i)=>{
  const classified=classifyDonorMedia(file.name,file.mime,file.bytes)!;
  return {mime:classified.mime,bytes:file.bytes,id:crypto.randomUUID(),key:'donor-photos/'+crypto.randomUUID(),createdAt:new Date(firstTime+i).toISOString()};
 });
 const attempted:string[]=[];
 try{
  for(const p of entries){attempted.push(p.key);await storage.put(p.key,p.bytes,p.mime)}
  await store.batch([...entries.map(p=>({sql:'INSERT INTO donor_photos(id,donor_id,object_key,mime,size,uploaded_by,created_at) VALUES(?,?,?,?,?,?,?)',params:[p.id,donorId,p.key,p.mime,String(p.bytes.length),actor.id,p.createdAt]})),audit(actor,'donor.photos.upload',donorId,String(entries.length))]);
 }catch(error){
  const cleanup=await Promise.allSettled(attempted.map(key=>storage.delete(key)));
  if(cleanup.some(r=>r.status==='rejected'))console.error('Donor photo upload cleanup requires retry');
  if(error instanceof Error&&error.message.includes('PHOTO_LIMIT'))fail(409,'PHOTO_LIMIT');
  throw error;
 }
 return {ok:true,count:entries.length};
}
export async function deleteDonorPhoto(store:Store,storage:Storage,actor:Actor,photoId:string){
 admin(actor);const photo=await readDonorPhoto(store,actor,photoId);
 // Deleting storage first makes retries safe if the database write fails.
 await storage.delete(photo.object_key);
 await store.batch([{sql:'DELETE FROM donor_photos WHERE id=?',params:[photoId]},audit(actor,'donor.photo.delete',photo.donor_id,photoId)]);
 return {ok:true};
}
