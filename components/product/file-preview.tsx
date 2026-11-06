'use client';
import {useEffect,useRef,useState} from 'react';
import Image from 'next/image';
import {ArrowLeft,Download,Eye} from 'lucide-react';
import {useLocale} from './locale';

export function FilePreview({href,label}:{href:string;label:string}){
 const [open,setOpen]=useState(false);
 return <>
  <button type="button" className="quiet-link" onClick={()=>setOpen(true)}><Eye size={16}/>{label}</button>
  {open&&<FileStage href={href} title={label} onClose={()=>setOpen(false)}/>}
 </>;
}

function previewKind(type:string){
 const mime=type.split(';')[0].trim().toLowerCase();
 if(mime==='application/pdf')return 'pdf';
 if(mime==='image/jpeg'||mime==='image/png')return 'image';
 return 'other';
}

function FileStage({href,title,onClose}:{href:string;title:string;onClose:()=>void}){
 const {t}=useLocale();
 const [url,setUrl]=useState('');
 const [kind,setKind]=useState('');
 const [error,setError]=useState('');
 const closeRef=useRef(onClose);
 useEffect(()=>{closeRef.current=onClose},[onClose]);
 useEffect(()=>{
  let objectUrl='';
  let gone=false;
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')closeRef.current()};
  document.addEventListener('keydown',onKey);
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  (async()=>{
   const res=await fetch(href,{credentials:'same-origin',cache:'no-store'});
   if(!res.ok){if(!gone)setError('unavailable');return}
   const type=(res.headers.get('content-type')||'').split(';')[0].trim();
   const kind=previewKind(type);
   if(kind==='pdf'){await res.body?.cancel();if(!gone){setKind(kind);setUrl(href+(href.includes('?')?'&':'?')+'view=1')}return}
   const blob=await res.blob();
   const fileType=type||blob.type;
   const file=blob.type===fileType?blob:new Blob([blob],{type:fileType});
   objectUrl=URL.createObjectURL(file);
   if(gone){URL.revokeObjectURL(objectUrl);return}
   setKind(kind);
   setUrl(objectUrl);
  })().catch(()=>{if(!gone)setError('unavailable')});
  return ()=>{gone=true;document.removeEventListener('keydown',onKey);document.body.style.overflow=previous;if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[href]);
 return <dialog open className="file-view"  aria-modal="true" aria-label={title}>
  <header className="file-view-bar">
   <button type="button" className="quiet-link" autoFocus onClick={onClose}><ArrowLeft size={16}/>{t('返回','Back')}</button>
   <strong>{title}</strong>
   <a className="quiet-link" href={href}><Download size={16}/>{t('下载','Download')}</a>
  </header>
  <div className="file-view-stage">
   {!url&&!error&&<p>{t('正在打开…','Opening…')}</p>}
   {error&&<p>{t('这份文件暂时无法在线打开。可以下载后查看。','This file cannot be opened here right now. You can download it instead.')}</p>}
   {kind==='image'&&url&&<Image unoptimized src={url} width={1200} height={900} alt={title}/>}
   {kind==='pdf'&&url&&<iframe src={url} title={title}/>}
   {kind==='other'&&url&&<p>{t('此格式请下载后查看。','Download this format to view it.')}</p>}
  </div>
 </dialog>;
}
