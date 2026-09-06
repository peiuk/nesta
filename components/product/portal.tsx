'use client';
import {useState,type ReactNode} from 'react';
import {ArrowLeft,Download,LogOut,Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';
import {Registration} from './registration';
import {api,useResource,ErrorNotice,Empty,Panel,Status,Field,Choice,ActionForm,Modal,formObject,useLabels,type Data} from './common';
import {canUseDirectory,hasDirectoryAccess} from '@/lib/policy';

export const STAGES=['assessment','treatment','transfer','pregnancy','birth','paperwork','paused','loss','closed'];
const SIGN_OUT='/signout-with-chatgpt?return_to=%2F';

function Shell({nav,children}:{nav?:ReactNode;children:ReactNode}){const {t}=useLocale();return <div className="workspace"><header className="workspace-header"><Brand/><nav>{nav}<LanguageButton/><a className="quiet-link" href={SIGN_OUT} target="_top"><LogOut size={16}/>{t('退出','Sign out')}</a></nav></header><main className="workspace-main">{children}</main></div>}

export function Portal(){
 const {t}=useLocale();const [version,setVersion]=useState(0);const {data,error,loading}=useResource('me',version);
 if(loading)return <Shell><div className="loading">{t('正在载入…','Loading…')}</div></Shell>;
 if(error||!data)return <Shell><ErrorNotice code={error||'SERVICE_UNAVAILABLE'}/></Shell>;
 const profile=data.profile as Data;
 if(!profile.registered_at)return <Shell><Registration profile={profile} done={()=>setVersion(v=>v+1)}/></Shell>;
 if(profile.status!=='approved')return <Shell><div className="notice">{profile.status==='suspended'?t('账户已暂停，请联系协调员。','Your account is suspended. Contact your coordinator.'):t('档案已提交，等待管理员批准后即可查看案件与报告。','Your profile is submitted. A coordinator will approve access before cases and reports appear.')}</div></Shell>;
 return <Workspace profile={profile}/>;
}

function Workspace({profile}:{profile:Data}){
 const {t}=useLocale();const [view,setView]=useState<'overview'|'directory'|'admin'>('overview');const [caseId,setCaseId]=useState<string|null>(null);const [version,setVersion]=useState(0);
 const refresh=()=>setVersion(v=>v+1);
 const overview=useResource('overview',version);
 const grants=(overview.data?.grants||[]) as Array<{scope:string;expires_at:string;revoked_at:string|null}>;
 const showDirectory=profile.role==='admin'||hasDirectoryAccess({id:String(profile.id),role:String(profile.role),status:String(profile.status)},grants);
 const go=(next:'overview'|'directory'|'admin')=>{setCaseId(null);setView(next)};
 const item=(key:'overview'|'directory'|'admin',label:string)=><Button key={key} variant={view===key?'secondary':'ghost'} size="sm" onClick={()=>go(key)}>{label}</Button>;
 const nav=<>{item('overview',t('概览','Overview'))}{showDirectory&&item('directory',t('资料库','Directory'))}{profile.role==='admin'&&item('admin',t('管理','Administration'))}</>;
 return <Shell nav={nav}>
  {view==='overview'&&(caseId
   ?<CaseDetail caseId={caseId} profile={profile} back={()=>setCaseId(null)}/>
   :overview.loading?<div className="loading">{t('正在载入…','Loading…')}</div>
   :overview.error?<ErrorNotice code={overview.error}/>
   :<Overview profile={profile} data={overview.data||{}} open={setCaseId} refresh={refresh}/>)}
  {view==='directory'&&<Directory profile={profile}/>}
  {view==='admin'&&<Admin/>}
 </Shell>;
}

function Overview({profile,data,open,refresh}:{profile:Data;data:Data;open:(id:string)=>void;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const cases=(data.cases||[]) as Data[];const grants=(data.grants||[]) as Array<{scope:string;expires_at:string;revoked_at:string|null}>;
 const actor={id:String(profile.id),role:String(profile.role),status:String(profile.status)};
 const live=grants.filter(g=>canUseDirectory(actor,g,g.scope));
 return <>
  <div className="page-title"><div><h1>{t('我的服务空间','Your care space')}</h1><p>{t('私密试用版：请仅使用测试资料。','Private pilot: use test data only.')}</p></div>{profile.role==='admin'&&<NewCase refresh={refresh}/>}</div>
  <div className="summary-grid">
   <div className="summary-item"><span className="metadata">{t('我的案件','My cases')}</span><strong>{cases.length}</strong></div>
   <div className="summary-item"><span className="metadata">{t('当前阶段','Current stage')}</span><strong className="text-lg">{cases.length?label(String(cases[0]?.stage)):t('暂无','None')}</strong></div>
   <div className="summary-item"><span className="metadata">{t('资料库授权','Directory access')}</span><strong className="text-lg">{live.length?live.map(g=>label(g.scope)).join(' / '):t('未授权','Not granted')}</strong></div>
  </div>
  <Panel title={t('案件列表','Cases')}>
   {cases.length?<div className="stack">{cases.map(c=><button key={String(c.id)} type="button" className="report-row w-full text-left" onClick={()=>open(String(c.id))}><div><h3>{String(c.title)}</h3><p className="metadata">{String(c.code)} · {t('周期','Cycle')} {String(c.cycle)} · {label(String(c.membership_role||''))}</p></div><Status value={String(c.stage)}/></button>)}</div>
    :<Empty title={t('还没有案件','No cases yet')}>{t('协调员建立案件后，进度与报告会显示在这里。','Once a coordinator creates your case, progress and reports appear here.')}</Empty>}
  </Panel>
 </>;
}

function NewCase({refresh}:{refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);const people=useResource(open?'people':null);
 const clients=((people.data?.people||[]) as Data[]).filter(p=>p.role==='client'&&p.status==='approved');
 return <>
  <Button onClick={()=>setOpen(true)}>{t('新建案件','New case')}</Button>
  {open&&<Modal title={t('新建案件','New case')} description={t('选择一位已批准的客户，系统会把你加为协调员。','Choose an approved client. You are added as coordinator.')} onClose={()=>setOpen(false)}>
   {people.loading?<div className="loading">{t('正在载入…','Loading…')}</div>:people.error?<ErrorNotice code={people.error}/>:clients.length===0?<Empty title={t('没有可选客户','No approved clients')}>{t('请先在管理页批准客户账户。','Approve a client account in Administration first.')}</Empty>
    :<ActionForm submitLabel={t('建立案件','Create case')} onSubmit={f=>api('cases',formObject(f))} onDone={()=>{setOpen(false);refresh()}}>
     <Field name="title" label={t('案件名称','Case title')} max={120}/>
     <Choice name="customer_id" label={t('客户','Client')} options={clients.map(p=>[String(p.id),`${String(p.name)} · ${String(p.email)}`] as [string,string])}/>
     <Field name="reason" type="textarea" label={t('建立理由（记入审计）','Reason (recorded in audit)')} max={500}/>
    </ActionForm>}
  </Modal>}
 </>;
}

function CaseDetail({caseId,profile,back}:{caseId:string;profile:Data;back:()=>void}){
 const {t}=useLocale();const label=useLabels();const [version,setVersion]=useState(0);
 const refresh=()=>setVersion(v=>v+1);
 const {data,error,loading}=useResource('cases/'+caseId,version);
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error||!data)return <><Button variant="ghost" size="sm" onClick={back}><ArrowLeft size={16}/>{t('返回概览','Back to overview')}</Button><ErrorNotice code={error||'SERVICE_UNAVAILABLE'}/></>;
 const record=data.case as Data;const manage=data.can_manage===true;const membership=String(data.membership||'');
 const members=(data.members||[]) as Data[];const events=(data.events||[]) as Data[];const questions=(data.questions||[]) as Data[];
 return <>
  <Button variant="ghost" size="sm" onClick={back}><ArrowLeft size={16}/>{t('返回概览','Back to overview')}</Button>
  <div className="stage-banner"><div><small>{String(record.code)}</small><h2>{String(record.title)}</h2><p>{label(String(record.stage))} · {t('周期','Cycle')} {String(record.cycle)} · {t('我的身份','My role')}: {label(membership)}</p></div>{manage&&<StageForm caseId={caseId} record={record} refresh={refresh}/>}</div>
  <div className="split">
   <div>
    <ReportPanel data={data} caseId={caseId} refresh={refresh}/>
    <Panel title={t('服务进度','Care timeline')} action={manage?<EventForm caseId={caseId} cycle={Number(record.cycle)} refresh={refresh}/>:undefined}>
     {events.length?<ul className="timeline">{events.map(e=><li key={String(e.id)}><strong>{String(e.title)}</strong><div className="metadata">{String(e.event_date)} · {label(String(e.kind))} · {t('周期','Cycle')} {String(e.cycle)} · {String(e.author_name)}</div>{e.note?<p>{String(e.note)}</p>:null}</li>)}</ul>
      :<Empty title={t('还没有进度记录','No timeline entries yet')}/>}
    </Panel>
   </div>
   <div>
    <Panel title={t('服务团队','Care team')} action={profile.role==='admin'?<MemberForm caseId={caseId} refresh={refresh}/>:undefined}>
     <div className="stack">{members.map(m=><div key={String(m.id)} className="row-actions justify-between"><div><strong>{String(m.name)}</strong><div className="metadata">{label(String(m.role))}{m.email?` · ${String(m.email)}`:''}</div></div><Status value={String(m.status)}/></div>)}</div>
    </Panel>
    <Panel title={t('沟通记录','Conversations')}>
     <QuestionForm caseId={caseId} refresh={refresh}/>
     {questions.length?<div className="stack">{questions.map(q=><div key={String(q.id)} className="question"><div className="metadata">{String(q.author_name)} · {String(q.created_at).slice(0,10)}</div><p>{String(q.body)}</p>{q.reply?<div className="answer"><p>{String(q.reply)}</p></div>:manage?<ReplyForm questionId={String(q.id)} refresh={refresh}/>:<div className="metadata">{t('协调员会尽快回复。','Your coordinator will reply.')}</div>}</div>)}</div>
      :<Empty title={t('还没有提问','No questions yet')}/>}
    </Panel>
   </div>
  </div>
 </>;
}

function StageForm({caseId,record,refresh}:{caseId:string;record:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" onClick={()=>setOpen(true)}>{t('更新阶段','Update stage')}</Button>
  {open&&<Modal title={t('更新案件阶段','Update case stage')} description={t('阶段与周期变更会记入审计。','Stage and cycle changes are recorded in the audit log.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存阶段','Save stage')} onSubmit={f=>api(`cases/${caseId}/stage`,{...formObject(f),cycle:Number(f.get('cycle'))})} onDone={()=>{setOpen(false);refresh()}}>
    <Choice name="stage" label={t('阶段','Stage')} value={String(record.stage)} options={STAGES.map(s=>[s,label(s)] as [string,string])}/>
    <Field name="cycle" type="number" label={t('周期','Cycle')} value={Number(record.cycle)}/>
    <Field name="reason" type="textarea" label={t('变更说明','Reason')} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}

function EventForm({caseId,cycle,refresh}:{caseId:string;cycle:number;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>{t('添加记录','Add entry')}</Button>
  {open&&<Modal title={t('添加进度记录','Add timeline entry')} description={t('记录治疗、检查或预约安排。','Record treatment, checks or appointments.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存记录','Save entry')} onSubmit={f=>api(`cases/${caseId}/events`,{...formObject(f),cycle:Number(f.get('cycle'))})} onDone={()=>{setOpen(false);refresh()}}>
    <Field name="title" label={t('标题','Title')} max={150}/>
    <div className="form-grid">
     <Choice name="kind" label={t('类型','Type')} options={[['milestone',label('milestone')],['appointment',label('appointment')]]}/>
     <Field name="event_date" type="date" label={t('日期','Date')}/>
    </div>
    <Field name="cycle" type="number" label={t('周期','Cycle')} value={cycle}/>
    <Field name="note" type="textarea" label={t('备注','Note')} required={false} max={1500}/>
   </ActionForm>
  </Modal>}
 </>;
}

function MemberForm({caseId,refresh}:{caseId:string;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);const people=useResource(open?'people':null);
 const candidates=((people.data?.people||[]) as Data[]).filter(p=>p.status==='approved');
 return <>
  <Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>{t('管理成员','Manage members')}</Button>
  {open&&<Modal title={t('分配或移除成员','Assign or remove member')} description={t('成员角色取自账户角色；移除会同时收回该成员的报告接收资格。','Case role follows the account role. Removing a member also revokes their report recipients entries.')} onClose={()=>setOpen(false)}>
   {people.loading?<div className="loading">{t('正在载入…','Loading…')}</div>:people.error?<ErrorNotice code={people.error}/>:candidates.length===0?<Empty title={t('没有可选账户','No approved accounts')}>{t('请先在管理页批准账户。','Approve an account in Administration first.')}</Empty>
    :<ActionForm submitLabel={t('保存成员','Save member')} onSubmit={f=>api(`cases/${caseId}/members`,{user_id:f.get('user_id'),reason:f.get('reason'),remove:f.get('action')==='remove'})} onDone={()=>{setOpen(false);refresh()}}>
     <Choice name="user_id" label={t('账户','Account')} options={candidates.map(p=>[String(p.id),`${String(p.name)} · ${String(p.role)}`] as [string,string])}/>
     <Choice name="action" label={t('操作','Action')} options={[['assign',t('分配到案件','Assign to case')],['remove',t('从案件移除','Remove from case')]]}/>
     <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
    </ActionForm>}
  </Modal>}
 </>;
}

function QuestionForm({caseId,refresh}:{caseId:string;refresh:()=>void}){
 const {t}=useLocale();const [key,setKey]=useState(0);
 return <div key={key} className="mb-4"><ActionForm submitLabel={t('提交问题','Send question')} onSubmit={f=>api(`cases/${caseId}/questions`,formObject(f))} onDone={()=>{setKey(k=>k+1);refresh()}}>
  <Field name="body" type="textarea" label={t('想问的问题','Your question')} max={2000}/>
 </ActionForm></div>;
}

function ReplyForm({questionId,refresh}:{questionId:string;refresh:()=>void}){
 const {t}=useLocale();
 return <ActionForm submitLabel={t('发送回复','Send reply')} onSubmit={f=>api('questions/'+questionId,formObject(f))} onDone={refresh}>
  <Field name="reply" type="textarea" label={t('回复内容','Reply')} max={2000}/>
 </ActionForm>;
}

function Directory(_:{profile:Data}){const {t}=useLocale();return <div className="notice">{t('资料库正在开发中。','Directory is under construction.')}</div>}
function Admin(){const {t}=useLocale();return <div className="notice">{t('管理页正在开发中。','Administration is under construction.')}</div>}
function ReportPanel({data,caseId,refresh}:{data:Data;caseId:string;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const reports=(data.reports||[]) as Data[];const manage=data.can_manage===true;
 return <Panel title={t('报告与文件','Reports & documents')} action={manage?<UploadForm caseId={caseId} members={(data.members||[]) as Data[]} reports={reports} refresh={refresh}/>:undefined}>
  {reports.length?<div>{reports.map(r=><div key={String(r.id)} className="report-row"><div>
   <h3>{String(r.title)}</h3>
   <p className="metadata">{label(String(r.kind))} · {String(r.report_date)} · {String(r.source)} · v{String(r.version)} · {String(r.language).toUpperCase()}</p>
   {r.review_note?<div className="report-review">{t('复核意见','Review note')}: {String(r.review_note)}</div>:null}
   <div className="row-actions">
    <a className="quiet-link" href={`/api/files/${String(r.id)}/original`} target="_blank" rel="noreferrer"><Download size={16}/>{t('原件','Original')}</a>
    {r.has_translation?<a className="quiet-link" href={`/api/files/${String(r.id)}/translation`} target="_blank" rel="noreferrer"><Download size={16}/>{t('译稿','Translation')}</a>:null}
    {r.can_review?<ReportAction report={r} action="review" refresh={refresh}/>:null}
    {r.can_publish?<ReportAction report={r} action="publish" refresh={refresh}/>:null}
    {manage&&['draft','reviewed','published'].includes(String(r.status))?<ReportAction report={r} action="withdraw" refresh={refresh}/>:null}
   </div>
  </div><Status value={String(r.status)}/></div>)}</div>
   :<Empty title={t('还没有报告','No reports yet')}>{t('协调员上传并完成独立复核后，已发布报告会显示在这里。','Published reports appear here after upload and independent review.')}</Empty>}
 </Panel>;
}

function ReportAction({report,action,refresh}:{report:Data;action:'review'|'publish'|'withdraw';refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 const titles={review:t('复核报告','Review report'),publish:t('发布报告','Publish report'),withdraw:t('撤回报告','Withdraw report')};
 const notes={review:t('上传者不能自审；请给出通过或退回的理由。','Uploaders cannot self-review. Record why you accept or return it.'),publish:t('发布后，被指定的客户成员即可下载。','Once published, assigned client members can download it.'),withdraw:t('撤回后客户将无法再下载该报告。','After withdrawal, clients can no longer download the report.')};
 return <>
  <Button variant={action==='withdraw'?'ghost':'secondary'} size="sm" onClick={()=>setOpen(true)}>{titles[action]}</Button>
  {open&&<Modal title={titles[action]} description={notes[action]} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={titles[action]} onSubmit={f=>api(`reports/${String(report.id)}/${action}`,formObject(f))} onDone={()=>{setOpen(false);refresh()}}>
    {action==='review'&&<Choice name="decision" label={t('复核结论','Decision')} options={[['reviewed',t('通过复核','Accept')],['rejected',t('退回上传者','Return to uploader')]]}/>}
    <Field name="reason" type="textarea" label={t('说明（记入审计）','Note (recorded in audit)')} max={1000}/>
   </ActionForm>
  </Modal>}
 </>;
}

const MAX_UPLOAD=8*1024*1024;
const ACCEPT='application/pdf,image/jpeg,image/png';

function UploadForm({caseId,members,reports,refresh}:{caseId:string;members:Data[];reports:Data[];refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);const [recipients,setRecipients]=useState<string[]>([]);
 const clients=members.filter(m=>m.role==='client');
 async function submit(f:FormData){
  if(!recipients.length)throw new Error('RECIPIENT_REQUIRED');
  for(const key of ['original','translation']){const file=f.get(key);if(file instanceof File&&file.size>MAX_UPLOAD)throw new Error('INVALID_FILE')}
  f.set('recipients',JSON.stringify(recipients));
  const translation=f.get('translation');if(translation instanceof File&&!translation.size)f.delete('translation');
  const supersedes=f.get('supersedes_id');if(typeof supersedes!=='string'||!supersedes.trim())f.delete('supersedes_id');
  return api(`cases/${caseId}/reports`,f);
 }
 return <>
  <Button size="sm" onClick={()=>setOpen(true)}><Upload size={16}/>{t('上传报告','Upload report')}</Button>
  {open&&<Modal title={t('上传报告或文件','Upload report or document')} description={t('仅 PDF、JPEG、PNG，单文件不超过 8 MB。上传后需由独立审核员复核，再由协调员发布。','PDF, JPEG or PNG up to 8 MB per file. An independent reviewer must review it before a coordinator publishes it.')} onClose={()=>setOpen(false)}>
   {clients.length===0?<Empty title={t('案件内没有已批准的客户成员','No approved client member in this case')}>{t('请先分配客户成员，报告必须至少有一位接收人。','Assign a client member first; every report needs at least one recipient.')}</Empty>
    :<ActionForm submitLabel={t('上传','Upload')} onSubmit={submit} onDone={()=>{setOpen(false);setRecipients([]);refresh()}}>
     <Field name="title" label={t('标题','Title')} max={150}/>
     <div className="form-grid">
      <Choice name="kind" label={t('类型','Type')} options={[['report',label('report')],['document',label('document')]]}/>
      <Field name="source" label={t('来源机构','Source')} max={150}/>
      <Field name="report_date" type="date" label={t('报告日期','Report date')}/>
      <Choice name="language" label={t('原件语言','Original language')} options={[['ka','ქართული'],['en','English'],['zh','中文']]}/>
     </div>
     <Field name="cycle" type="number" label={t('周期','Cycle')} value={1}/>
     <Field name="original" label={t('原始文件','Original file')}><input name="original" type="file" required accept={ACCEPT} className="min-h-11"/></Field>
     <Field name="translation" label={t('译稿（可选）','Translation (optional)')} required={false}><input name="translation" type="file" accept={ACCEPT} className="min-h-11"/></Field>
     <Field name="supersedes_id" label={t('替换旧版本（可选）','Replaces earlier version (optional)')} required={false}>
      <select name="supersedes_id" className="min-h-11 border rounded-md px-3" defaultValue=""><option value="">{t('不替换','None')}</option>{reports.map(r=><option key={String(r.id)} value={String(r.id)}>{String(r.title)} · v{String(r.version)}</option>)}</select>
     </Field>
     <div className="field"><span>{t('接收客户（至少一位）','Client recipients (at least one)')}</span>
      {clients.map(m=><label key={String(m.id)} className="checkbox-row"><input type="checkbox" checked={recipients.includes(String(m.id))} onChange={e=>setRecipients(list=>e.target.checked?[...list,String(m.id)]:list.filter(x=>x!==String(m.id)))}/><span>{String(m.name)}</span></label>)}
     </div>
    </ActionForm>}
  </Modal>}
 </>;
}
