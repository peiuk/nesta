'use client';
import {useState} from 'react';
import {Send,RefreshCw} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {scalarText} from '@/lib/text';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {useLocale} from './locale';
import {api,useResource,Panel,Empty,ErrorNotice,Modal,ActionForm,Field,Choice,FilterSelect,type Data} from './common';

const statusLabels:Record<string,[string,string]>={pending:['待审批','Awaiting review'],approved:['已通过 · 待机构确认','Approved · Clinic confirmation pending'],rejected:['未通过','Not approved'],withdrawn:['已撤回','Withdrawn']};
export function SelectionStatus({status}:{status:string}){const {t}=useLocale();return <Badge variant={status==='pending'?'outline':'secondary'}>{statusLabels[status]?t(...statusLabels[status]):status}</Badge>}

export function SubmitEggRequest({donor,existingStatus,disabled,refresh,onSubmitted}:{donor:Data;existingStatus?:string;disabled?:boolean;refresh:()=>void;onSubmitted?:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 if(existingStatus)return <SelectionStatus status={existingStatus}/>;
 return <><Button size="sm" disabled={disabled} onClick={()=>setOpen(true)}><Send size={15}/>{t('提交选卵申请','Request this egg donor')}</Button>
  {open&&<Modal title={`${t('提交选卵申请','Request egg donor')} · ${String(donor.code)}`} description={t('提交后由服务团队审批。审批通过后仍需合作机构确认，不代表已预留或医疗适配结论。','The service team reviews your request. Approval remains subject to clinic confirmation and does not reserve the donor or establish medical suitability.')} onClose={()=>setOpen(false)}>
   <ActionForm successMessage={null} submitLabel={t('确认提交','Submit request')} onSubmit={f=>api('egg-requests',{donor_id:String(donor.id),note:scalarText(f.get('note'))})} onDone={()=>{setOpen(false);refresh();onSubmitted?.()}}>
    <Field name="note" label={t('备注（可选）','Note (optional)')} type="textarea" required={false} max={1000}/>
    <p className="metadata">{t('可以说明希望进一步了解的问题；医疗资料请通过案件文件提交。','Describe any questions you have. Submit medical records through your case files.')}</p>
   </ActionForm>
  </Modal>}
 </>;
}

export function EggRequests({admin=false,onChanged,externalVersion=0}:{admin?:boolean;onChanged?:()=>void;externalVersion?:number}){
 const {t}=useLocale();const [version,setVersion]=useState(0);const [status,setStatus]=useState('all');const [query,setQuery]=useState('');const [saved,setSaved]=useState(false);
 const {data,error,loading}=useResource('egg-requests',version+externalVersion);
 const refresh=()=>{setVersion(v=>v+1);setSaved(true);onChanged?.()};
 const all=(data?.requests||[]) as Data[];
 const requests=all.filter(r=>(status==='all'||r.status===status)&&`${r.donor_code} ${r.client_name||''} ${r.client_email||''}`.toLowerCase().includes(query.trim().toLowerCase()));
 return <Panel title={admin?t('选卵申请 · 待审批优先，最多 200 条','Egg requests · pending first, up to 200'):t('我的选卵申请 · 最近 200 条','My egg requests · latest 200')} action={<Button size="sm" variant="outline" disabled={loading} onClick={()=>setVersion(v=>v+1)}><RefreshCw size={14}/>{t('刷新','Refresh')}</Button>}>
  <div className="notice">{t('申请获批表示服务团队同意继续协调，最终可用情况及安排以合作机构确认和医疗评估为准。','Approval means the service team will continue coordination. Availability and arrangements remain subject to clinic confirmation and medical assessment.')}</div>
  {saved&&<output className="success-banner" >{t('申请状态已更新。','Request status updated.')}</output>}
  <div className="row-actions mb-4 gap-3"><Input className="min-h-11 min-w-48 flex-1" value={query} onChange={e=>setQuery(e.target.value)} aria-label={t('搜索申请','Search requests')} placeholder={admin?t('搜索供者编号、客户姓名或邮箱','Search donor code, client name or email'):t('搜索供者编号','Search donor code')}/><FilterSelect label={t('申请状态','Request status')} value={status} onChange={setStatus} options={[["all",t('全部状态','All statuses')],...Object.entries(statusLabels).map(([key,pair])=>[key,t(...pair)] as [string,string])]}/></div>
  {loading?<output className="loading" >{t('正在载入申请…','Loading requests…')}</output>:error?<ErrorNotice code={error}/>:!requests.length?<Empty title={t('暂无符合条件的申请','No matching requests')}>{admin?t('已获卵子库授权的客户提交申请后，会显示在这里。','Requests appear here after clients with egg directory access submit them.'):t('进入卵子库，在可申请的档案上点击「提交选卵申请」。','Open the egg directory and select Request this egg donor on an available record.')}</Empty>:requests.map(r=><article key={String(r.id)} className="panel">
   <div className="panel-heading"><div><h3>{String(r.donor_code)}</h3>{admin&&<p className="metadata">{String(r.client_name)} · {String(r.client_email)}</p>}<p className="metadata">{t('提交时间','Submitted')} {String(r.created_at).slice(0,16).replace('T',' ')}</p></div><SelectionStatus status={String(r.status)}/></div>
   {r.note&&<p className="whitespace-pre-wrap mb-4">{t('客户备注','Client note')}: {String(r.note)}</p>}
   {r.reply&&<div className="notice"><strong>{t('审批回复','Review reply')}</strong><p className="whitespace-pre-wrap">{String(r.reply)}</p><p className="metadata">{String(r.updated_at).slice(0,16).replace('T',' ')}</p></div>}
   {r.status==='pending'&&(admin?<Decision request={r} refresh={refresh}/>:<Withdraw request={r} refresh={refresh}/>)}
  </article>)}
 </Panel>;
}

function Decision({request,refresh}:{request:Data;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <><Button size="sm" onClick={()=>setOpen(true)}>{t('审批申请','Review request')}</Button>{open&&<Modal title={`${t('审批选卵申请','Review egg request')} · ${String(request.donor_code)}`} description={t('客户将看到审批结果和回复。通过前请与合作机构核实；系统会再次检查账户、授权及可申请状态。','The client will see the decision and reply. Check with the clinic before approving; account access and donor availability are rechecked on submission.')} onClose={()=>setOpen(false)}>
  <ActionForm successMessage={null} submitLabel={t('保存审批结果','Save decision')} onSubmit={f=>api(`egg-requests/${String(request.id)}/decision`,{status:f.get('status'),reply:f.get('reply')})} onDone={()=>{setOpen(false);refresh()}}>
   <Choice name="status" label={t('审批结果','Decision')} options={[["approved",t('通过，继续协调','Approve for coordination')],["rejected",t('不通过','Do not approve')]]}/>
   <Field name="reply" label={t('客户可见的回复（必填）','Reply visible to the client (required)')} type="textarea" max={1000}/>
  </ActionForm>
 </Modal>}</>;
}
function Withdraw({request,refresh}:{request:Data;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <><Button size="sm" variant="outline" onClick={()=>setOpen(true)}>{t('撤回申请','Withdraw request')}</Button>{open&&<Modal title={t('撤回选卵申请','Withdraw egg request')} description={t('仅可撤回尚未审批的申请；之后可重新提交。','Only requests awaiting review can be withdrawn. You can submit a new request afterwards.')} onClose={()=>setOpen(false)}><ActionForm successMessage={null} submitLabel={t('确认撤回','Confirm withdrawal')} onSubmit={()=>api(`egg-requests/${String(request.id)}/withdraw`,{})} onDone={()=>{setOpen(false);refresh()}}><p>{String(request.donor_code)}</p></ActionForm></Modal>}</>;
}
