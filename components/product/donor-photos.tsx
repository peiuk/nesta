'use client';
/* oxlint-disable next/no-img-element -- Private images must use authenticated requests without shared image optimization. */
import {useEffect,useState,useRef} from 'react';
import {ImagePlus,Trash2,ChevronLeft,ChevronRight} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useLocale} from './locale';
import {api,useResource,ErrorNotice,Modal,type Data} from './common';

const photoUrl=(id:string)=>'/api/donor-photos/'+encodeURIComponent(id);
function PrivateImage({src,alt,className}:{src:string;alt:string;className?:string}){
 const {t}=useLocale();const [failedSrc,setFailedSrc]=useState('');
 return failedSrc===src?<output className="photo-unavailable">{t('照片暂不可用','Photo unavailable')}</output>:<img className={className} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailedSrc(src)}/>;
}
export function DonorCover({donor}:{donor:Data}){
 const {t}=useLocale();
 return donor.cover_photo_id?<div className="donor-photo-cover"><PrivateImage src={photoUrl(donor.cover_photo_id)} alt={t('档案照片 ','Profile photo ')+donor.code}/><span>{t(`${donor.photo_count} 张照片`,`${donor.photo_count} photos`)}</span></div>:null;
}
export function DonorGallery({donor}:{donor:Data}){
 const {t}=useLocale();const [version,setVersion]=useState(0),[selected,setSelected]=useState(0);
 const {data,error,loading}=useResource('donors/'+donor.id+'/photos',version);const photos:Data[]=data?.photos||[];
 const current=photos[Math.min(selected,photos.length-1)];
 return <section className="donor-gallery" aria-label={t('档案相册','Profile gallery')}>
  {loading&&<output>{t('正在读取照片…','Loading photos…')}</output>}
  <ErrorNotice code={error}/>{error&&<Button variant="outline" onClick={()=>setVersion(v=>v+1)}>{t('重新加载','Retry')}</Button>}
  {!loading&&!error&&!photos.length&&<p className="photo-empty">{t('此档案尚未上传照片','No photos uploaded for this record')}</p>}
  {current&&<><div className="donor-photo-stage"><PrivateImage src={photoUrl(current.id)} alt={`${donor.code} · ${selected+1}`}/></div>
   <div className="photo-navigation"><Button size="sm" variant="outline" disabled={selected===0} onClick={()=>setSelected(n=>n-1)} aria-label={t('上一张','Previous photo')}><ChevronLeft size={16}/></Button><span aria-live="polite">{selected+1} / {photos.length}</span><Button size="sm" variant="outline" disabled={selected>=photos.length-1} onClick={()=>setSelected(n=>n+1)} aria-label={t('下一张','Next photo')}><ChevronRight size={16}/></Button></div>
   <div className="photo-thumbnails">{photos.map((p,i)=><button key={p.id} type="button" className={i===selected?'is-selected':''} aria-pressed={i===selected} aria-label={t(`查看第 ${i+1} 张照片`,`View photo ${i+1}`)} onClick={()=>setSelected(i)}><PrivateImage src={photoUrl(p.id)} alt=""/></button>)}</div>
  </>}
 </section>;
}
export function DonorPhotoManager({donor,refresh}:{donor:Data;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}><ImagePlus size={15}/>{t('管理照片','Manage photos')}</Button>{open&&<PhotoEditor donor={donor} onClose={changed=>{setOpen(false);if(changed)refresh()}}/>}</>;
}
function PhotoEditor({donor,onClose}:{donor:Data;onClose:(changed:boolean)=>void}){
 const {t}=useLocale();const [version,setVersion]=useState(0),[files,setFiles]=useState<File[]>([]),[previews,setPreviews]=useState<string[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[deleting,setDeleting]=useState('');
 const changed=useRef(false),input=useRef<HTMLInputElement>(null),previewUrls=useRef<string[]>([]);
 const {data,error:loadError,loading}=useResource('donors/'+donor.id+'/photos',version);const photos:Data[]=data?.photos||[];
 useEffect(()=>()=>previewUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
 function replaceFiles(next:File[]){previewUrls.current.forEach(url=>URL.revokeObjectURL(url));previewUrls.current=next.map(file=>URL.createObjectURL(file));setFiles(next);setPreviews(previewUrls.current)}
 function select(selected:File[]){
  setError('');setSuccess('');replaceFiles([]);
  if(selected.length+photos.length>10){setError('PHOTO_LIMIT');return}
  if(selected.some(f=>!['image/jpeg','image/png'].includes(f.type)||f.size>5*1024*1024||f.size<8)){setError('INVALID_PHOTO');return}
  if(selected.reduce((n,f)=>n+f.size,0)>20*1024*1024){setError('PHOTO_BATCH_TOO_LARGE');return}
  replaceFiles(selected);
 }
 async function upload(){
  if(busy||!files.length)return;setBusy(true);setError('');setSuccess('');
  try{const form=new FormData();files.forEach(f=>form.append('photos',f));const result=await api('donors/'+donor.id+'/photos',form);changed.current=true;replaceFiles([]);if(input.current)input.current.value='';setVersion(v=>v+1);setSuccess(t(`已上传 ${result.count} 张照片。`,`Uploaded ${result.count} photos.`))}catch(e){setError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}finally{setBusy(false)}
 }
 async function remove(){
  if(busy||!deleting)return;setBusy(true);setError('');setSuccess('');
  try{await api('donor-photos/'+deleting+'/delete',{});changed.current=true;setDeleting('');setVersion(v=>v+1);setSuccess(t('照片已删除。','Photo deleted.'))}catch(e){setError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}finally{setBusy(false)}
 }
 return <Modal title={t('管理档案照片 · ','Manage photos · ')+donor.code} description={t('最多 10 张，JPG / PNG，单张不超过 5 MB，每批不超过 20 MB。第一张自动作为封面。','Up to 10 JPG / PNG photos, 5 MB each and 20 MB per batch. The first photo is the cover.')} onClose={()=>{if(!busy)onClose(changed.current)}}>
  <ErrorNotice code={loadError||error}/>{success&&<output className="success-banner">{success}</output>}
  {loading?<output>{t('正在读取照片…','Loading photos…')}</output>:loadError?<Button variant="outline" onClick={()=>setVersion(v=>v+1)}>{t('重新加载','Retry')}</Button>:<>
   <p className="photo-section-label">{t(`已上传 ${photos.length} / 10 张`,`Uploaded ${photos.length} / 10`)}</p>
   {!photos.length&&<p className="photo-empty">{t('暂无照片，请在下方选择上传。','No photos yet. Choose photos below.')}</p>}
   <div className="photo-editor-grid">{photos.map((p,i)=><div className="photo-editor-item" key={p.id}><PrivateImage src={photoUrl(p.id)} alt={`${donor.code} · ${i+1}`}/><div><span>{i===0?t('封面','Cover'):t(`照片 ${i+1}`,`Photo ${i+1}`)}</span><Button size="sm" variant="ghost" disabled={busy} aria-label={t(`删除第 ${i+1} 张照片`,`Delete photo ${i+1}`)} onClick={()=>setDeleting(p.id)}><Trash2 size={16}/></Button></div></div>)}</div>
   {deleting&&<fieldset className="photo-delete-confirm" aria-label={t('确认删除照片','Confirm photo deletion')}><p>{t('确定删除这张照片？删除后客户将无法再读取。','Delete this photo? Clients will no longer be able to load it.')}</p><div className="row-actions"><Button size="sm" disabled={busy} onClick={remove}>{busy?t('处理中…','Working…'):t('确认删除','Delete photo')}</Button><Button size="sm" variant="outline" disabled={busy} onClick={()=>setDeleting('')}>{t('取消','Cancel')}</Button></div></fieldset>}
   <fieldset disabled={busy||photos.length>=10} className="photo-upload-box"><label className="field"><span>{t('选择多张照片','Choose multiple photos')}</span><Input ref={input} type="file" multiple accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={e=>select(Array.from(e.target.files||[]))}/></label><p>{t('可一次多选；上传后，拥有该资料库授权的客户即可查看。','Select several at once. Uploaded photos are visible to clients with access to this directory.')}</p>
    {files.length>0&&<><div className="photo-editor-grid">{files.map((file,i)=><div className="photo-editor-item" key={i}>{previews[i]&&<img src={previews[i]} alt={t(`待上传照片 ${i+1}`,`Selected photo ${i+1}`)}/>}<div><span>{t('待上传','Selected')}</span><Button size="sm" variant="ghost" aria-label={t(`移除待上传照片 ${i+1}`,`Remove selected photo ${i+1}`)} onClick={()=>replaceFiles(files.filter((_,n)=>n!==i))}><Trash2 size={16}/></Button></div></div>)}</div><Button disabled={busy} onClick={upload}>{busy?t('上传中，请稍候…','Uploading, please wait…'):t(`上传 ${files.length} 张照片`,`Upload ${files.length} photos`)}</Button></>}
   </fieldset>
  </>}
  <Button variant="outline" className="mt-4" disabled={busy} onClick={()=>onClose(changed.current)}>{t('完成','Done')}</Button>
 </Modal>;
}
