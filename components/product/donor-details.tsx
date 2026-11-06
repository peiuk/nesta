/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- the labeled scroll region is focusable so keyboard users can scroll the wide comparison table. */
'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {useLocale} from './locale';
import {Modal,Status,type Data} from './common';
import {DonorGallery} from './donor-photos';

export function DonorDetails({donor}:{donor:Data}){
 const {t,lang}=useLocale();const [open,setOpen]=useState(false);
 return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}>{t('查看详情','View details')}</Button>{open&&<Modal title={String(donor.code)} description={t('合作方提供的匿名资料，供本次服务评估使用。','Anonymous partner information for this service assessment.')} onClose={()=>setOpen(false)}><Status value={String(donor.status)}/><DonorGallery donor={donor}/><dl className="donor-detail-fields">{[[t('年龄','Age'),donor.age],[t('身高','Height'),donor.height?donor.height+' cm':'—'],[t('血型','Blood group'),donor.blood_group||'—'],[t('核实日期','Verified'),donor.verified_at],[t('来源机构','Source'),donor.source]].map(([key,value])=><div key={String(key)}><dt>{String(key)}</dt><dd>{String(value)}</dd></div>)}</dl><h3>{t('资料摘要','Profile summary')}</h3><p className="whitespace-pre-wrap mt-3">{String(lang==='zh'?donor.summary_zh:donor.summary_en)}</p>{donor.status_reason&&<p className="notice mt-4">{String(donor.status_reason)}</p>}</Modal>}</>;
}

export function DonorComparison({donors,onClose}:{donors:Data[];onClose:()=>void}){
 const {t,lang}=useLocale();const fields:Array<[string,(d:Data)=>string]>=[[t('年龄','Age'),d=>String(d.age)],[t('身高','Height'),d=>d.height?d.height+' cm':'—'],[t('血型','Blood group'),d=>String(d.blood_group||'—')],[t('核实日期','Verified'),d=>String(d.verified_at)],[t('来源机构','Source'),d=>String(d.source)],[t('资料摘要','Summary'),d=>String(lang==='zh'?d.summary_zh:d.summary_en)]];
 return <Modal title={t('供者档案对比','Compare donor records')} description={t('仅对比你已获准查看的资料，不作医学适配判断。手机上可左右滑动表格。','Compare records you are authorized to view. This does not assess medical suitability. Scroll sideways on smaller screens.')} onClose={onClose}><section className="table-wrap donor-comparison" tabIndex={0} aria-label={t('供者资料对比表','Donor comparison table')}><Table><TableHeader><TableRow><TableHead>{t('项目','Attribute')}</TableHead>{donors.map(d=><TableHead key={String(d.id)}>{String(d.code)}</TableHead>)}</TableRow></TableHeader><TableBody><TableRow><TableCell>{t('状态','Status')}</TableCell>{donors.map(d=><TableCell key={String(d.id)}><Status value={String(d.status)}/></TableCell>)}</TableRow>{fields.map(([name,value])=><TableRow key={name}><TableCell>{name}</TableCell>{donors.map(d=><TableCell key={String(d.id)}>{value(d)}</TableCell>)}</TableRow>)}</TableBody></Table></section></Modal>;
}
