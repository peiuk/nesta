'use client';
import {useEffect,useState,useRef,type ReactNode} from 'react';
import {ArrowLeft,Download,Heart,LogOut,Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';
import {Registration,SignIn} from './registration';
import {api,useResource,ErrorNotice,Empty,Panel,Status,Field,Choice,FilterSelect,ActionForm,Modal,formObject,useLabels,type Data} from './common';
import {canUseDirectory,hasDirectoryAccess} from '@/lib/policy';
import {filterDonors,validAgeRange} from '@/lib/directory-filters';
import {filterCases} from '@/lib/case-filters';
import {EggRequests,SubmitEggRequest,SelectionStatus} from './egg-requests';
import {ClientOverview} from './client-overview';
import {DonorDetails,DonorComparison} from './donor-details';
import {DonorCover,DonorPhotoManager} from './donor-photos';
import {groupReports} from '@/lib/report-groups';
import {ClientPlanFees,CasePlanPanel} from './plan-fees';

export const STAGES=['assessment','treatment','transfer','pregnancy','birth','paperwork','paused','loss','closed'];
const SIGN_OUT='/signout-with-chatgpt?return_to=%2F';
const PROFILE_KEYS=['id','name','email','role','status','language','jurisdiction'] as const;
const CASE_KEYS=['id','code','title','stage','cycle','membership_role','updated_at'] as const;
const GRANT_KEYS=['scope','expires_at','revoked_at'] as const;
const pick=(row:Data,keys:readonly string[])=>Object.fromEntries(keys.map(k=>[k,row[k]]));

async function registerFirstleafReadTools(signal:AbortSignal){
 if(typeof document.modelContext?.registerTool!=='function')return;
 const empty={type:'object' as const,properties:{} as Record<string,never>,additionalProperties:false as const};
 await document.modelContext.registerTool({
  name:'firstleaf_get_profile',
  description:'Private pilot: return the signed-in Firstleaf profile summary for this session (id, name, email, role, status, language, jurisdiction). No long-form interest text. Test data only.',
  inputSchema:empty,
  annotations:{readOnlyHint:true},
  execute:async()=>{try{const data=await api('me');return pick(data.profile as Data,PROFILE_KEYS)}catch(e){return {error:e instanceof Error?e.message:'SERVICE_UNAVAILABLE'}}}
 },{signal});
 await document.modelContext.registerTool({
  name:'firstleaf_get_overview',
  description:'Private pilot: return cases and directory grants visible to the signed-in user. Case fields: id, code, title, stage, cycle, membership_role, updated_at. Grant fields: scope, expires_at, revoked_at. No report bodies or files. Test data only.',
  inputSchema:empty,
  annotations:{readOnlyHint:true},
  execute:async()=>{try{const data=await api('overview');return {cases:((data.cases||[]) as Data[]).map(c=>pick(c,CASE_KEYS)),grants:((data.grants||[]) as Data[]).map(g=>pick(g,GRANT_KEYS))}}catch(e){return {error:e instanceof Error?e.message:'SERVICE_UNAVAILABLE'}}}
 },{signal});
}

export function Shell({nav,children,signIn='chatgpt'}:{nav?:ReactNode;children:ReactNode;signIn?:string}){
 const {t}=useLocale();
 async function signOut(){
  if(signIn==='email'){try{await api('auth/logout',{})}catch{/* still leave */}window.location.href='/';return}
  window.location.href=SIGN_OUT;
 }
 return <div className="workspace"><header className="workspace-header"><Brand/><nav>{nav}<LanguageButton/><button type="button" className="quiet-link" onClick={signOut}><LogOut size={16}/>{t('退出','Sign out')}</button></nav></header><main className="workspace-main">{children}</main></div>;
}

export function Portal({signInHref}:{signInHref:string}){
 const {t}=useLocale();const [version,setVersion]=useState(0);const {data,error,loading}=useResource('me',version);
 const signIn=data?.sign_in==='email'?'email':'chatgpt';
 if(loading)return <Shell><div className="loading">{t('正在载入…','Loading…')}</div></Shell>;
 if(error==='SIGN_IN_REQUIRED')return <SignIn href={signInHref}/>;
 if(error||!data)return <Shell><ErrorNotice code={error||'SERVICE_UNAVAILABLE'}/></Shell>;
 const profile=data.profile as Data;
 if(!profile.registered_at&&profile.role!=='admin')return <Shell signIn={signIn}><Registration profile={profile} done={()=>setVersion(v=>v+1)}/></Shell>;
 if(profile.status!=='approved')return <Shell signIn={signIn}><div className="notice">{profile.status==='suspended'?t('账户已暂停，请联系协调员。','Your account is suspended. Contact your coordinator.'):t('档案已提交，等待管理员批准后即可查看案件与报告。','Your profile is submitted. A coordinator will approve access before cases and reports appear.')}</div></Shell>;
 return <Workspace profile={profile} signIn={signIn}/>;
}

function Workspace({profile,signIn}:{profile:Data;signIn:string}){
 const {t}=useLocale();const [view,setView]=useState<'overview'|'directory'|'requests'|'plan'>('overview');const [caseId,setCaseId]=useState<string|null>(null);const [version,setVersion]=useState(0);
 const refresh=()=>setVersion(v=>v+1);
 useEffect(()=>{const c=new AbortController();registerFirstleafReadTools(c.signal).catch(()=>{});return()=>c.abort()},[]);
 const overview=useResource('overview',version);
 const grants=(overview.data?.grants||[]) as Array<{scope:string;expires_at:string;revoked_at:string|null}>;
 const showDirectory=profile.role==='admin'||(profile.role==='client'&&hasDirectoryAccess({id:String(profile.id),role:String(profile.role),status:String(profile.status)},grants));
 useEffect(()=>{if(view==='directory'&&!showDirectory)setView('overview')},[view,showDirectory]);
 const go=(next:'overview'|'directory'|'requests'|'plan')=>{setCaseId(null);setView(next)};
 const item=(key:'overview'|'directory'|'requests'|'plan',label:string)=><Button key={key} variant={view===key?'secondary':'ghost'} size="sm" onClick={()=>go(key)}>{label}</Button>;
 const nav=<>{item('overview',t('概览','Overview'))}{profile.role==='client'&&item('plan',t('我的方案/费用','My plan / fees'))}{showDirectory&&item('directory',t('资料库','Directory'))}{profile.role==='client'&&item('requests',t('我的选卵申请','My egg requests'))}{profile.role==='admin'&&<a className="quiet-link" href="/admin">{t('管理后台','Administration')}</a>}</>;
 return <Shell nav={nav} signIn={signIn}>
  {view==='overview'&&(caseId
   ?<CaseDetail caseId={caseId} profile={profile} back={()=>setCaseId(null)}/>
   :overview.loading?<div className="loading">{t('正在载入…','Loading…')}</div>
   :overview.error?<ErrorNotice code={overview.error}/>
   :profile.role==='client'?<ClientOverview profile={profile} data={overview.data||{}} open={setCaseId} go={go}/>:<Overview profile={profile} data={overview.data||{}} open={setCaseId} refresh={refresh}/>)}
  {view==='directory'&&showDirectory&&<Directory profile={profile} openRequests={()=>go('requests')}/>}
  {view==='plan'&&profile.role==='client'&&<ClientPlanFees/>}
  {view==='requests'&&profile.role==='client'&&<EggRequests/>}
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

export function NewCase({refresh}:{refresh:()=>void}){
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

export function CaseDetail({caseId,profile,back}:{caseId:string;profile:Data;back:()=>void}){
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
    <CasePlanPanel caseId={caseId} canManage={manage} refresh={refresh}/>
    <ReportPanel data={data} caseId={caseId} refresh={refresh}/>
    <Panel title={t('服务进度','Care timeline')} action={manage?<EventForm caseId={caseId} cycle={Number(record.cycle)} refresh={refresh}/>:undefined}>
     {events.length?<ul className="timeline">{events.map(e=><li key={String(e.id)}><strong>{String(e.title)}</strong><div className="metadata">{String(e.event_date)} · {label(String(e.kind))} · {t('周期','Cycle')} {String(e.cycle)} · {String(e.author_name)}</div>{e.note?<p>{String(e.note)}</p>:null}</li>)}</ul>
      :<Empty title={t('还没有进度记录','No timeline entries yet')}/>}
    </Panel>
    <CaseDocumentsPanel caseId={caseId} documents={(data.documents||[]) as Data[]} canManage={manage} refresh={refresh}/>
   </div>
   <div>
    <Panel title={t('服务团队','Care team')} action={profile.role==='admin'?<MemberForm caseId={caseId} refresh={refresh}/>:undefined}>
     <div className="stack">{members.map(m=><div key={String(m.id)} className="row-actions justify-between"><div><strong>{String(m.name)}</strong><div className="metadata">{label(String(m.role))}{m.email?` · ${String(m.email)}`:''}</div></div><div className="row-actions">{profile.role==='admin'&&m.role==='client'&&m.status==='approved'&&<GrantForm refresh={refresh} userId={String(m.id)} userLabel={String(m.name)} allowRevoke={false} triggerLabel={t('资料库授权','Directory grant')}/>}<Status value={String(m.status)}/></div></div>)}</div>
    </Panel>
    {profile.role==='admin'&&<CasePartnersPanel caseId={caseId} summary={(data.partners||null) as Data|null} refresh={refresh}/>}
    <Panel title={t('沟通记录','Conversations')}>
     <QuestionForm caseId={caseId} refresh={refresh}/>
     {questions.length?<div className="stack">{questions.map(q=><div key={String(q.id)} className="question"><div className="metadata">{String(q.author_name)} · {String(q.created_at).slice(0,10)}</div><p>{String(q.body)}</p>{q.reply?<div className="answer"><p>{String(q.reply)}</p></div>:manage?<ReplyForm questionId={String(q.id)} refresh={refresh}/>:<div className="metadata">{t('协调员会尽快回复。','Your coordinator will reply.')}</div>}</div>)}</div>
      :<Empty title={t('还没有提问','No questions yet')}/>}
    </Panel>
   </div>
  </div>
 </>;
}

const NONE='__none__';
function partnerOptions(active:Data[],current:Data|null|undefined,label:(v:string)=>string,noneLabel:string){
 const opts:Array<[string,string]>=[[NONE,noneLabel]];
 const seen=new Set<string>();
 for(const p of active){const id=String(p.id);seen.add(id);opts.push([id,String(p.name)])}
 if(current?.id&&!seen.has(String(current.id))){
  const inactive=String(current.status)==='inactive'?` (${label('inactive')})`:'';
  opts.push([String(current.id),`${String(current.name)}${inactive}`]);
 }
 return opts;
}

function CasePartnersPanel({caseId,summary,refresh}:{caseId:string;summary:Data|null;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 const ivfList=useResource(open?'partners?kind=ivf&status=active':null);
 const postpartumList=useResource(open?'partners?kind=postpartum&status=active':null);
 const ivf=summary?.ivf as Data|null|undefined;
 const postpartum=summary?.postpartum as Data|null|undefined;
 const ready=!open||((!ivfList.loading&&!ivfList.error)&&(!postpartumList.loading&&!postpartumList.error));
 return <Panel title={t('合作方','Partners')} action={<Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>{t('绑定合作方','Bind partners')}</Button>}>
  <div className="stack">
   <div><span className="metadata">{label('ivf')}</span><div className="row-actions justify-between"><strong>{ivf?String(ivf.name):t('未绑定','Not bound')}</strong>{ivf&&<Status value={String(ivf.status)}/>}</div></div>
   <div><span className="metadata">{label('postpartum')}</span><div className="row-actions justify-between"><strong>{postpartum?String(postpartum.name):t('未绑定','Not bound')}</strong>{postpartum&&<Status value={String(postpartum.status)}/>}</div></div>
  </div>
  {open&&<Modal title={t('绑定合作方','Bind partners')} description={t('每个案件最多一家 IVF 诊所与一家月子中心；变更记入审计。','At most one IVF clinic and one postpartum center per case. Changes are audited.')} onClose={()=>setOpen(false)}>
   {(ivfList.loading||postpartumList.loading)&&<div className="loading">{t('正在载入…','Loading…')}</div>}
   <ErrorNotice code={ivfList.error||postpartumList.error}/>
   {ready&&<ActionForm submitLabel={t('保存绑定','Save bindings')} onSubmit={f=>{
    const pick=(key:string)=>{const v=String(f.get(key)||'');return v===NONE?null:v};
    return api(`cases/${caseId}/partners`,{ivf_partner_id:pick('ivf_partner_id'),postpartum_partner_id:pick('postpartum_partner_id'),reason:f.get('reason')});
   }} onDone={()=>{setOpen(false);refresh()}}>
    <Choice name="ivf_partner_id" label={label('ivf')} value={ivf?String(ivf.id):NONE} options={partnerOptions((ivfList.data?.partners||[]) as Data[],ivf,label,t('未绑定','Not bound'))}/>
    <Choice name="postpartum_partner_id" label={label('postpartum')} value={postpartum?String(postpartum.id):NONE} options={partnerOptions((postpartumList.data?.partners||[]) as Data[],postpartum,label,t('未绑定','Not bound'))}/>
    <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
   </ActionForm>}
  </Modal>}
 </Panel>;
}

const DOCUMENT_STATUSES=['not_started','in_progress','complete','blocked'] as const;
function CaseDocumentsPanel({caseId,documents,canManage,refresh}:{caseId:string;documents:Data[];canManage:boolean;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [editing,setEditing]=useState<Data|null>(null);
 return <Panel title={t('证件进度','Document progress')}>
  {documents.length?<div className="stack">{documents.map(doc=><div key={String(doc.kind)} className="row-actions justify-between"><div><strong>{label(String(doc.kind))}</strong><div className="metadata">{doc.status_date?String(doc.status_date):t('未填日期','No date yet')}</div>{canManage&&doc.notes?<p>{String(doc.notes)}</p>:null}</div><div className="row-actions"><Status value={String(doc.status)}/>{canManage&&<Button variant="ghost" size="sm" onClick={()=>setEditing(doc)}>{t('更新','Update')}</Button>}</div></div>)}</div>
   :<Empty title={t('还没有证件节点','No document nodes yet')}/>}
  {editing&&<Modal title={t('更新证件进度','Update document progress')} description={t('状态与日期对客户可见；内部备注只给协调员和管理员。变更记入审计。','Status and date are visible to the client. Internal notes stay with coordinators and admins. Changes are audited.')} onClose={()=>setEditing(null)}>
   <ActionForm submitLabel={t('保存进度','Save progress')} onSubmit={f=>api(`cases/${caseId}/documents`,{kind:String(editing.kind),status:f.get('status'),status_date:f.get('status_date')||null,notes:f.get('notes')||'',reason:f.get('reason')})} onDone={()=>{setEditing(null);refresh()}}>
    <Choice name="status" label={t('状态','Status')} value={String(editing.status)} options={DOCUMENT_STATUSES.map(s=>[s,label(s)] as [string,string])}/>
    <Field name="status_date" type="date" label={t('日期','Date')} value={editing.status_date?String(editing.status_date):''} required={false}/>
    <Field name="notes" type="textarea" label={t('内部备注','Internal notes')} value={editing.notes?String(editing.notes):''} required={false} max={1500}/>
    <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
   </ActionForm>
  </Modal>}
 </Panel>;
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

export function ReplyForm({questionId,refresh}:{questionId:string;refresh:()=>void}){
 const {t}=useLocale();
 return <ActionForm submitLabel={t('发送回复','Send reply')} onSubmit={f=>api('questions/'+questionId,formObject(f))} onDone={refresh}>
  <Field name="reply" type="textarea" label={t('回复内容','Reply')} max={2000}/>
 </ActionForm>;
}

export function Directory({profile,openRequests}:{profile:Data;openRequests?:()=>void}){
 const {t,lang}=useLocale();const label=useLabels();const admin=profile.role==='admin';
 const [kind,setKind]=useState<'egg'|'sperm'>('egg');const [version,setVersion]=useState(0);
 const [status,setStatus]=useState('all');const [favoriteOnly,setFavoriteOnly]=useState(false);
 const [blood,setBlood]=useState('all');const [ageMin,setAgeMin]=useState('');const [ageMax,setAgeMax]=useState('');
 const [query,setQuery]=useState('');const [sort,setSort]=useState<'code'|'verified'>('code');const [saved,setSaved]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);const [comparing,setComparing]=useState(false);const [submitted,setSubmitted]=useState(false);
 const resetFilters=()=>{setStatus('all');setFavoriteOnly(false);setBlood('all');setAgeMin('');setAgeMax('');setQuery('');setSort('code')};
 const selectKind=(k:'egg'|'sperm')=>{setKind(k);resetFilters();setSaved(false);setSelected([]);setComparing(false);setSubmitted(false)};
 const refresh=()=>{setVersion(v=>v+1);setSaved(true);setSubmitted(false)};
 const {data,error,loading}=useResource(`directory?kind=${kind}`,version);
 const applications=useResource(profile.role==='client'&&kind==='egg'?'egg-requests':null,version);
 const activeRequests=((applications.data?.requests||[]) as Data[]).filter(r=>r.status==='pending'||r.status==='approved');
 const donors=(data?.donors||[]) as Data[];
 const comparison=donors.filter(d=>selected.includes(String(d.id)));
 const toggleCompare=(id:string)=>setSelected(ids=>ids.includes(id)?ids.filter(x=>x!==id):ids.length<3?[...ids,id]:ids);
 const bloodOptions=[...new Set(donors.map(d=>String(d.blood_group||'')).filter(Boolean))].sort();
 const filtered=filterDonors(donors,{status,favoriteOnly,blood,ageMin,ageMax,query,sort});
 const ageValid=validAgeRange(ageMin,ageMax);
 const hasFilters=status!=='all'||favoriteOnly||blood!=='all'||ageMin!==''||ageMax!==''||query.trim()!=='';
 const statusOptions=admin?['available','matching','unavailable','archived']:['available','matching','unavailable'];
 return <>
  <div className="page-title"><div>{admin?<h2>{t('合作方供者档案','Partner donor records')}</h2>:<h1>{t('供者资料库','Donor directory')}</h1>}<p>{admin?t('维护已核实的匿名档案、来源和当前可申请状态。','Maintain verified anonymous records, sources and availability.'):t('授权范围与有效期由管理员设定，资料仅供本次服务评估使用。','Scope and expiry are set by an administrator. Records are for this service assessment only.')}</p></div>{admin&&<NewDonor kind={kind} onCreated={k=>{selectKind(k);refresh()}} refresh={refresh}/>}</div>
  {saved&&<div className="success-banner" role="status">{submitted?t('选卵申请已提交，等待服务团队审批。','Egg request submitted. Awaiting review by the service team.'):t('更改已保存。','Changes saved.')}{submitted&&openRequests&&<Button variant="link" onClick={openRequests}>{t('查看申请状态','View request status')}</Button>}</div>}
  {profile.role==='client'&&kind==='egg'&&<div className="notice"><p>{t('收藏用于记录偏好。确定意向后，请点击档案上的「提交选卵申请」，等待服务团队审批。','Save records to shortlist your preferences. When ready, select Request this egg donor and wait for the service team to review.')}</p>{openRequests&&<Button variant="link" onClick={openRequests}>{t('查看我的选卵申请','View my egg requests')}</Button>}<ErrorNotice code={applications.error}/></div>}
  <div className="row-actions section-tabs" aria-label={t('资料库类别','Directory type')}>{(['egg','sperm'] as const).map(k=><Button key={k} variant={kind===k?'secondary':'ghost'} size="sm" aria-pressed={kind===k} onClick={()=>selectKind(k)}>{label(k)}</Button>)}</div>
  {!loading&&!error&&donors.length>0&&<div className="row-actions mb-4 flex-wrap gap-3">
   <Input className="min-h-11 min-w-48 flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('搜索档案编号或来源机构','Search record code or source')} aria-label={t('搜索供者档案','Search donor records')}/>
   <FilterSelect value={status} onChange={setStatus} label={t('状态','Status')} options={[["all",t('全部状态','All statuses')],...statusOptions.map(s=>[s,label(s)] as [string,string])]}/>
   <Button variant={favoriteOnly?'secondary':'outline'} className="min-h-11" size="sm" aria-pressed={favoriteOnly} onClick={()=>setFavoriteOnly(v=>!v)}><Heart size={16}/>{t('仅看收藏','Saved only')}</Button>
   <FilterSelect value={blood} onChange={setBlood} label={t('血型','Blood group')} options={[["all",t('全部血型','All blood groups')],...bloodOptions.map(b=>[b,b] as [string,string])]}/>
   <label className="metadata flex items-center gap-2">{t('年龄从','Age from')}<input type="number" className="min-h-11 w-20 rounded-md border border-input bg-transparent px-3 text-sm" value={ageMin} onChange={e=>setAgeMin(e.target.value)} min={18} max={65} aria-label={t('最小年龄','Minimum age')}/></label>
   <label className="metadata flex items-center gap-2">{t('至','to')}<input type="number" className="min-h-11 w-20 rounded-md border border-input bg-transparent px-3 text-sm" value={ageMax} onChange={e=>setAgeMax(e.target.value)} min={18} max={65} aria-label={t('最大年龄','Maximum age')}/></label>
   <FilterSelect value={sort} onChange={v=>setSort(v as 'code'|'verified')} label={t('排序','Sort order')} options={[["code",t('按编号排序','Record code')],["verified",t('最近核实优先','Recently verified')]]}/>
   {hasFilters&&<Button variant="ghost" onClick={resetFilters}>{t('清空筛选','Clear filters')}</Button>}
  </div>}
  {!ageValid&&<div className="error-banner" role="alert">{t('请输入 18–65 岁的整数范围，最小年龄不能大于最大年龄。','Use whole ages from 18 to 65. Minimum age cannot exceed maximum age.')}</div>}
  {!loading&&!error&&donors.length>0&&<p className="metadata mb-4" role="status">{t(`显示 ${filtered.length} / ${donors.length} 份档案`,`Showing ${filtered.length} of ${donors.length} records`)}{donors.length===300&&t(' · 当前最多载入 300 份',' · Up to 300 records loaded')}</p>}
  {loading?<div className="loading">{t('正在载入…','Loading…')}</div>
   :error?<><ErrorNotice code={error}/><Button variant="outline" onClick={()=>setVersion(v=>v+1)}>{t('重新载入','Retry')}</Button></>
   :donors.length===0?<Empty title={t('暂无可查看的档案','No records available')}>{admin?t('点击「新增档案」，开始录入当前资料库的匿名供者资料。','Use Add record to create an anonymous donor profile in this directory.'):t('当前授权范围内还没有可查看的档案，请联系协调员。','No records are available within your access. Contact your coordinator.')}</Empty>
   :filtered.length===0?<Empty title={t('没有匹配的档案','No matching records')}><Button variant="outline" className="mt-3" onClick={resetFilters}>{t('清空筛选','Clear filters')}</Button></Empty>
   :<div className="directory-grid">{filtered.map(d=>{const existing=activeRequests.find(r=>r.donor_code===d.code);const selectionAction=<><DonorDetails donor={d}/><Button size="sm" variant={selected.includes(String(d.id))?'secondary':'ghost'} aria-pressed={selected.includes(String(d.id))} disabled={selected.length>=3&&!selected.includes(String(d.id))} onClick={()=>toggleCompare(String(d.id))}>{selected.includes(String(d.id))?t('已加入对比','Added to compare'):t('加入对比','Compare')}</Button>{profile.role==='client'&&kind==='egg'?(existing?<SelectionStatus status={String(existing.status)}/>:d.status==='available'?<SubmitEggRequest donor={d} disabled={applications.loading||Boolean(applications.error)} refresh={refresh} onSubmitted={()=>setSubmitted(true)}/>:null):null}</>;return <DonorCard key={String(d.id)} donor={d} admin={admin} summary={String(lang==='zh'?d.summary_zh:d.summary_en)} selectionAction={selectionAction} refresh={refresh}/>})}</div>}
  {comparison.length>0&&<div className="comparison-bar"><span>{t('对比档案','Compare records')} · {comparison.map(d=>String(d.code)).join(' / ')} <small>({comparison.length}/3)</small></span><div className="row-actions"><Button variant="ghost" onClick={()=>{setSelected([]);setComparing(false)}}>{t('清空','Clear')}</Button><Button disabled={comparison.length<2} onClick={()=>setComparing(true)}>{t('开始对比','Compare')}</Button></div></div>}
  {comparing&&comparison.length>=2&&<DonorComparison donors={comparison} onClose={()=>setComparing(false)}/>}
 </>;
}

function DonorCard({donor,admin,summary,refresh,selectionAction}:{donor:Data;admin:boolean;summary:string;refresh:()=>void;selectionAction?:ReactNode}){
 const {t}=useLocale();const [busy,setBusy]=useState(false);const [error,setError]=useState('');const favorite=Number(donor.favorite)===1;
 async function toggle(){if(busy)return;setBusy(true);setError('');try{await api('favorites',{donor_id:String(donor.id),favorite:!favorite});refresh()}catch(e){setError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}finally{setBusy(false)}}
 return <article className="donor-card">
  <div className="donor-top"><span className="donor-code">{String(donor.code)}</span><Status value={String(donor.status)}/></div>
  <DonorCover donor={donor}/>
  <dl>
   <div><dt>{t('年龄','Age')}</dt><dd>{String(donor.age)}</dd></div>
   <div><dt>{t('身高','Height')}</dt><dd>{donor.height?`${String(donor.height)} cm`:'—'}</dd></div>
   <div><dt>{t('血型','Blood group')}</dt><dd>{String(donor.blood_group||'—')}</dd></div>
   <div><dt>{t('核实日期','Verified')}</dt><dd>{String(donor.verified_at)}</dd></div>
  </dl>
  <p>{summary}</p>
  {donor.status_reason?<div className="metadata">{t('状态理由','Status reason')}: {String(donor.status_reason)}</div>:null}
  <div className="metadata">{t('来源','Source')}: {String(donor.source)}</div>
  <ErrorNotice code={error}/>
  <div className="row-actions mt-4">
   {selectionAction}
   {donor.status!=='archived'&&<Button variant={favorite?'secondary':'ghost'} size="sm" aria-pressed={favorite} disabled={busy} onClick={toggle}><Heart size={16}/>{busy?t('保存中…','Saving…'):favorite?t('已收藏','Saved'):t('收藏','Save')}</Button>}
   {admin&&<DonorEdit donor={donor} refresh={refresh}/>}
   {admin&&<DonorPhotoManager donor={donor} refresh={refresh}/>}
   {admin&&<DonorStatus donor={donor} refresh={refresh}/>}
  </div>
 </article>;
}

function DonorEdit({donor,refresh}:{donor:Data;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <>
  <Button variant="ghost" size="sm" onClick={()=>setOpen(true)}>{t('编辑','Edit')}</Button>
  {open&&<Modal title={`${t('编辑档案','Edit record')} · ${String(donor.code)}`} description={t('更新匿名摘要与来源信息，变更记入审计。','Update anonymous summaries and source details. Changes are audited.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('donors/'+String(donor.id),{...formObject(f),age:Number(f.get('age')),height:f.get('height')?Number(f.get('height')):null})} onDone={()=>{setOpen(false);refresh()}}>
    <div className="form-grid">
     <Field name="age" type="number" label={t('年龄 (18-65)','Age (18-65)')} value={Number(donor.age)}/>
     <Field name="height" type="number" label={t('身高 cm（可选）','Height cm (optional)')} value={donor.height?Number(donor.height):undefined} required={false}/>
     <Field name="blood_group" label={t('血型（可选）','Blood group (optional)')} value={String(donor.blood_group||'')} required={false} max={20}/>
     <Field name="verified_at" type="date" label={t('核实日期','Verified date')} value={String(donor.verified_at).slice(0,10)}/>
    </div>
    <Field name="source" label={t('来源机构','Source')} value={String(donor.source)} max={150}/>
    <Field name="summary_zh" type="textarea" label={t('中文摘要','Chinese summary')} value={String(donor.summary_zh)} max={1500}/>
    <Field name="summary_en" type="textarea" label={t('英文摘要','English summary')} value={String(donor.summary_en)} max={1500}/>
    <Field name="consent_ref" label={t('同意书编号','Consent reference')} value={String(donor.consent_ref||'')} max={250}/>
    <Field name="reason" type="textarea" label={t('变更说明（可选）','Change note (optional)')} required={false} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}

function DonorStatus({donor,refresh}:{donor:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="ghost" size="sm" onClick={()=>setOpen(true)}>{t('更改状态','Change status')}</Button>
  {open&&<Modal title={t('更改档案状态','Change record status')} description={t('状态变更会记入审计。不可用或归档时的理由会显示在卡片上。','Status changes are recorded in the audit log. Reasons for unavailable or archived records appear on the card.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('donors/'+String(donor.id),formObject(f))} onDone={()=>{setOpen(false);refresh()}}>
    <Choice name="status" label={t('状态','Status')} value={String(donor.status)} options={['available','matching','unavailable','archived'].map(s=>[s,label(s)] as [string,string])}/>
    <Field name="reason" type="textarea" label={t('理由（对客可见，并记入审计）','Reason (shown to clients; recorded in audit)')} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}

function NewDonor({refresh,kind='egg',onCreated}:{refresh:()=>void;kind?:'egg'|'sperm';onCreated?:(kind:'egg'|'sperm')=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);const createdKind=useRef(kind);
 return <>
  <Button onClick={()=>setOpen(true)}>{t('新增档案','Add record')}</Button>
  {open&&<Modal title={t('新增供者档案','Add donor record')} description={t('仅录入已核实、已取得同意的匿名摘要，不含身份信息。','Record only verified, consented anonymous summaries. No identifying details.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存档案','Save record')} onSubmit={async f=>{await api('donors',{...formObject(f),age:Number(f.get('age')),height:f.get('height')?Number(f.get('height')):null});createdKind.current=f.get('kind')==='sperm'?'sperm':'egg'}} onDone={()=>{setOpen(false);if(onCreated)onCreated(createdKind.current);else refresh()}}>
    <div className="form-grid">
     <Field name="code" label={t('档案编号','Record code')} max={40}/>
     <Choice name="kind" label={t('类别','Type')} value={kind} options={[['egg',label('egg')],['sperm',label('sperm')]]}/>
     <Field name="age" type="number" label={t('年龄 (18-65)','Age (18-65)')}/>
     <Field name="height" type="number" label={t('身高 cm（可选）','Height cm (optional)')} required={false}/>
     <Field name="blood_group" label={t('血型（可选）','Blood group (optional)')} required={false} max={20}/>
     <Field name="verified_at" type="date" label={t('核实日期','Verified date')}/>
    </div>
    <Field name="source" label={t('来源机构','Source')} max={150}/>
    <Field name="summary_zh" type="textarea" label={t('中文摘要','Chinese summary')} max={1500}/>
    <Field name="summary_en" type="textarea" label={t('英文摘要','English summary')} max={1500}/>
    <Field name="consent_ref" label={t('同意书编号','Consent reference')} max={250}/>
   </ActionForm>
  </Modal>}
 </>;
}

export function PeopleTab(){
 const {t}=useLocale();const label=useLabels();const [version,setVersion]=useState(0);const refresh=()=>setVersion(v=>v+1);const [q,setQ]=useState('');const [status,setStatus]=useState('all');const [role,setRole]=useState('all');
 const {data,error,loading}=useResource('people',version);
 const people=((data?.people||[]) as Data[]).filter(p=>{
  const hay=`${String(p.name)} ${String(p.email)}`.toLowerCase();
  if(q.trim()&&!hay.includes(q.trim().toLowerCase()))return false;
  if(status!=='all'&&String(p.status)!==status)return false;
  if(role!=='all'&&String(p.role)!==role)return false;
  return true;
 });
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('账户','Accounts')}>
  <div className="notice">{t('更改角色会清除该账户已有的案件成员身份与资料库授权，需要重新分配。','Changing a role clears existing case memberships and directory grants; reassign them afterwards.')}</div>
  <div className="row-actions mb-4 flex-wrap gap-3">
   <input className="min-h-11 min-w-[200px] flex-1 rounded-md border border-input bg-transparent px-3 text-sm" value={q} onChange={e=>setQ(e.target.value)} placeholder={t('搜索姓名或邮箱','Search name or email')} aria-label={t('搜索姓名或邮箱','Search name or email')}/>
   <select className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={status} onChange={e=>setStatus(e.target.value)} aria-label={t('状态','Status')}>
    <option value="all">{t('全部状态','All statuses')}</option>
    {['pending','approved','suspended'].map(s=><option key={s} value={s}>{label(s)}</option>)}
   </select>
   <select className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={role} onChange={e=>setRole(e.target.value)} aria-label={t('角色','Role')}>
    <option value="all">{t('全部角色','All roles')}</option>
    {['client','coordinator','reviewer','admin'].map(r=><option key={r} value={r}>{label(r)}</option>)}
   </select>
  </div>
  <div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('姓名','Name')}</TableHead><TableHead>{t('邮箱','Email')}</TableHead><TableHead>{t('角色','Role')}</TableHead><TableHead>{t('状态','Status')}</TableHead><TableHead/></TableRow></TableHeader>
   <TableBody>{people.length?people.map(p=><TableRow key={String(p.id)}>
    <TableCell>{String(p.name)}</TableCell><TableCell>{String(p.email)}</TableCell><TableCell>{label(String(p.role))}</TableCell><TableCell><Status value={String(p.status)}/></TableCell>
    <TableCell><div className="row-actions">{p.status==='approved'&&p.role!=='admin'&&<GrantForm refresh={refresh} userId={String(p.id)} userLabel={`${String(p.name)} · ${String(p.email)}`} triggerLabel={t('授权','Grant')}/>}{p.role==='admin'?<span className="metadata">{t('管理员账户','Owner account')}</span>:<PersonForm person={p} refresh={refresh}/>}</div></TableCell>
   </TableRow>):<TableRow><TableCell colSpan={5}><Empty title={t('没有匹配的账户','No matching accounts')}/></TableCell></TableRow>}</TableBody>
  </Table></div>
 </Panel>;
}

export function PersonForm({person,refresh}:{person:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>{t('更改','Change')}</Button>
  {open&&<Modal title={`${t('更改账户','Change account')} · ${String(person.name)}`} description={t('角色与状态变更会记入审计。','Role and status changes are recorded in the audit log.')} onClose={()=>setOpen(false)}>
   <div className="notice"><p>{String(person.email)}</p>{person.jurisdiction&&<p>{t('居住地','Residence')}: {String(person.jurisdiction)} · {String(person.language)==='en'?'English':'中文'}</p>}{person.interest&&<p className="whitespace-pre-wrap">{String(person.interest)}</p>}</div>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('people/'+String(person.id),formObject(f))} onDone={()=>{setOpen(false);refresh()}}>
    <div className="form-grid">
     <Choice name="role" label={t('角色','Role')} value={String(person.role)} options={['client','coordinator','reviewer'].map(r=>[r,label(r)] as [string,string])}/>
     <Choice name="status" label={t('状态','Status')} value={String(person.status)} options={['pending','approved','suspended'].map(s=>[s,label(s)] as [string,string])}/>
    </div>
    <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}

export function GrantsTab(){
 const {t}=useLocale();const label=useLabels();const [version,setVersion]=useState(0);const [now]=useState(()=>Date.now());
 const refresh=()=>setVersion(v=>v+1);
 const {data,error,loading}=useResource('grants',version);
 const grants=(data?.grants||[]) as Data[];
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('资料库授权','Directory grants')} action={<GrantForm refresh={refresh}/>}>
  {grants.length?<div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('账户','Account')}</TableHead><TableHead>{t('范围','Scope')}</TableHead><TableHead>{t('到期','Expires')}</TableHead><TableHead>{t('状态','State')}</TableHead><TableHead>{t('理由','Reason')}</TableHead></TableRow></TableHeader>
   <TableBody>{grants.map(g=><TableRow key={`${String(g.user_id)}-${String(g.scope)}`}>
    <TableCell>{String(g.name)}</TableCell><TableCell>{label(String(g.scope))}</TableCell><TableCell>{String(g.expires_at).slice(0,10)}</TableCell>
    <TableCell>{g.revoked_at?t('已撤销','Revoked'):Date.parse(String(g.expires_at))>now?t('有效','Active'):t('已过期','Expired')}</TableCell>
    <TableCell className="whitespace-normal">{String(g.reason)}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>:<Empty title={t('还没有授权记录','No grants yet')}/>}
 </Panel>;
}

function GrantForm({refresh,userId,userLabel,allowRevoke=true,triggerLabel}:{refresh:()=>void;userId?:string;userLabel?:string;allowRevoke?:boolean;triggerLabel?:string}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);const [action,setAction]=useState('grant');const prefilled=Boolean(userId);
 const people=useResource(open&&!prefilled?'people':null);
 const candidates=((people.data?.people||[]) as Data[]).filter(p=>p.status==='approved');
 const effectiveAction=allowRevoke?action:'grant';const ready=prefilled||(!people.loading&&!people.error&&candidates.length>0);
 return <>
  <Button size="sm" onClick={()=>{setAction('grant');setOpen(true)}}>{triggerLabel??t('发放或撤销','Grant or revoke')}</Button>
  {open&&<Modal title={t('资料库授权','Directory access')} description={t('到期日须在未来一年内；撤销时到期日不生效。','Expiry must fall within one year. Expiry is ignored when revoking.')} onClose={()=>setOpen(false)}>
   {!prefilled&&(people.loading?<div className="loading">{t('正在载入…','Loading…')}</div>:people.error?<ErrorNotice code={people.error}/>:candidates.length===0?<Empty title={t('没有可选账户','No approved accounts')}>{t('请先在管理页批准账户。','Approve an account in Administration first.')}</Empty>:null)}
   {ready&&<ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('grants',{user_id:f.get('user_id'),scope:f.get('scope'),expires_at:f.get('expires_at'),reason:f.get('reason'),revoke:f.get('action')==='revoke'})} onDone={()=>{setOpen(false);refresh()}}>
    {prefilled?<>
     <input type="hidden" name="user_id" value={userId}/>
     <label className="field"><span>{t('账户','Account')}</span><div>{userLabel}</div></label>
    </>
    :<Choice name="user_id" label={t('账户','Account')} options={candidates.map(p=>[String(p.id),`${String(p.name)} · ${String(p.email)}`] as [string,string])}/>}
     <div className="form-grid">
      <Choice name="scope" label={t('范围','Scope')} options={[['egg',label('egg')],['sperm',label('sperm')]]}/>
      {allowRevoke
       ?<label className="field"><span>{t('操作','Action')}</span><select name="action" className="min-h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={action} onChange={e=>setAction(e.target.value)}><option value="grant">{t('发放','Grant')}</option><option value="revoke">{t('撤销','Revoke')}</option></select></label>
       :<input type="hidden" name="action" value="grant"/>
      }
     </div>
     <Field name="expires_at" type="date" label={t('到期日','Expiry date')} required={effectiveAction!=='revoke'}/>
     <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
    </ActionForm>}
  </Modal>}
 </>;
}

export function CasesTab({profile,open,refresh,version}:{profile:Data;open:(id:string)=>void;refresh:()=>void;version:number}){
 const {t}=useLocale();const label=useLabels();const [busyId,setBusyId]=useState('');const [actionError,setActionError]=useState('');
 const [query,setQuery]=useState('');const [stage,setStage]=useState('all');const [assignedOnly,setAssignedOnly]=useState(false);
 const {data,error,loading}=useResource('cases',version);
 const allCases=(data?.cases||[]) as Data[];
 const cases=filterCases(allCases,{query,stage,assignedOnly});
 const hasFilters=Boolean(query.trim()||stage!=='all'||assignedOnly);
 const resetFilters=()=>{setQuery('');setStage('all');setAssignedOnly(false)};
 async function joinAndOpen(caseId:string){
  if(busyId)return;setBusyId(caseId);setActionError('');
  try{
   await api(`cases/${caseId}/members`,{user_id:String(profile.id),reason:t('管理员自行加入案件以便查看详情','Administrator self-assigned to open case detail'),remove:false});
   refresh();open(caseId);
  }catch(e){setActionError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}finally{setBusyId('')}
 }
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('案件列表 · 最近 200 个','Case list · latest 200')} action={<NewCase refresh={refresh}/>}>
  <ErrorNotice code={actionError}/>
  <div className="notice">{t('未参与的案件可一键加入为协调员后查看详情。','For cases you are not on, join as coordinator in one step to open the detail view.')}</div>
  <div className="row-actions mb-4 gap-3"><Input className="min-h-11 min-w-48 flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('搜索案件编号或名称','Search case code or title')} aria-label={t('搜索案件','Search cases')}/><FilterSelect value={stage} onChange={setStage} label={t('案件阶段','Case stage')} options={[["all",t('全部阶段','All stages')],...STAGES.map(s=>[s,label(s)] as [string,string])]}/><Button variant={assignedOnly?'secondary':'outline'} className="min-h-11" aria-pressed={assignedOnly} onClick={()=>setAssignedOnly(v=>!v)}>{t('仅我参与的案件','Assigned to me')}</Button>{hasFilters&&<Button variant="ghost" onClick={resetFilters}>{t('清空筛选','Clear filters')}</Button>}</div>
  <p className="metadata mb-4" role="status">{t(`显示 ${cases.length} / ${allCases.length} 个案件`,`Showing ${cases.length} of ${allCases.length} cases`)}</p>
  {cases.length?<div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('编号','Code')}</TableHead><TableHead>{t('名称','Title')}</TableHead><TableHead>{t('阶段','Stage')}</TableHead><TableHead>{t('我的身份','My role')}</TableHead><TableHead>{t('更新','Updated')}</TableHead></TableRow></TableHeader>
   <TableBody>{cases.map(c=><TableRow key={String(c.id)}>
    <TableCell>{String(c.code)}</TableCell><TableCell className="whitespace-normal">{String(c.title)}</TableCell><TableCell><Status value={String(c.stage)}/></TableCell>
    <TableCell>{c.membership_role
     ?<Button type="button" variant="link" className="h-auto p-0" onClick={()=>open(String(c.id))}>{label(String(c.membership_role))}</Button>
     :<Button type="button" variant="secondary" size="sm" disabled={busyId===String(c.id)} onClick={()=>joinAndOpen(String(c.id))}>{busyId===String(c.id)?t('加入中…','Joining…'):t('加入并打开','Join & open')}</Button>}</TableCell>
    <TableCell>{String(c.updated_at).slice(0,10)}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>:<Empty title={allCases.length?t('没有匹配的案件','No matching cases'):t('还没有案件','No cases yet')}>{hasFilters?<Button variant="outline" onClick={resetFilters}>{t('清空筛选','Clear filters')}</Button>:t('先批准客户账户，再建立第一个案件。','Approve a client account, then create your first case.')}</Empty>}
 </Panel>;
}

export function AuditTab(){
 const {t}=useLocale();const [actionQ,setActionQ]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');
 const {data,error,loading}=useResource('audit');
 const rows=((data?.audit||[]) as Data[]).filter(r=>{
  if(actionQ.trim()&&!String(r.action).toLowerCase().includes(actionQ.trim().toLowerCase()))return false;
  const day=String(r.created_at).slice(0,10);
  if(from&&day<from)return false;
  if(to&&day>to)return false;
  return true;
 });
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('审计记录（最近 100 条）','Audit log (latest 100)')}>
  <div className="row-actions mb-4 flex-wrap gap-3">
   <input className="min-h-11 min-w-[160px] flex-1 rounded-md border border-input bg-transparent px-3 text-sm" value={actionQ} onChange={e=>setActionQ(e.target.value)} placeholder={t('按动作筛选','Filter by action')} aria-label={t('按动作筛选','Filter by action')}/>
   <label className="metadata flex items-center gap-2">{t('从','From')}<input type="date" className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={from} onChange={e=>setFrom(e.target.value)}/></label>
   <label className="metadata flex items-center gap-2">{t('至','To')}<input type="date" className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={to} onChange={e=>setTo(e.target.value)}/></label>
  </div>
  {rows.length?<div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('时间','Time')}</TableHead><TableHead>{t('操作人','Actor')}</TableHead><TableHead>{t('动作','Action')}</TableHead><TableHead>{t('对象','Target')}</TableHead><TableHead>{t('理由','Reason')}</TableHead></TableRow></TableHeader>
   <TableBody>{rows.map(r=><TableRow key={String(r.id)}>
    <TableCell>{String(r.created_at).slice(0,19).replace('T',' ')}</TableCell><TableCell>{String(r.actor_name||r.actor_id)}</TableCell><TableCell>{String(r.action)}</TableCell>
    <TableCell className="font-mono text-xs">{String(r.target)}</TableCell><TableCell className="whitespace-normal">{String(r.reason)}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>:<Empty title={t('没有匹配的记录','No matching entries')}/>}
 </Panel>;
}
function ReportPanel({data,caseId,refresh}:{data:Data;caseId:string;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const reports=(data.reports||[]) as Data[];const manage=data.can_manage===true;
 const [cycle,setCycle]=useState('all');const [query,setQuery]=useState('');
 const cycles=[...new Set(reports.map(r=>String(r.cycle)))].sort((a,b)=>Number(b)-Number(a));
 const groups=groupReports(reports.filter(r=>(cycle==='all'||String(r.cycle)===cycle)&&`${r.title} ${r.source}`.toLowerCase().includes(query.trim().toLowerCase())));
 return <Panel title={t('报告与文件','Reports & documents')} action={manage?<UploadForm caseId={caseId} members={(data.members||[]) as Data[]} reports={reports} refresh={refresh}/>:undefined}>
  {reports.length>0&&<div className="row-actions mb-4 gap-3"><Input className="min-h-11 min-w-40 flex-1" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('搜索报告或来源','Search report or source')} aria-label={t('搜索报告','Search reports')}/><FilterSelect value={cycle} onChange={setCycle} label={t('治疗周期','Treatment cycle')} options={[["all",t('全部周期','All cycles')],...cycles.map(c=>[c,`${t('周期','Cycle')} ${c}`] as [string,string])]}/></div>}
  {reports.length?<div>{groups.length===0&&<Empty title={t('没有匹配的报告','No matching reports')}><Button variant="outline" onClick={()=>{setQuery('');setCycle('all')}}>{t('清空筛选','Clear filters')}</Button></Empty>}{groups.map(group=><section key={group.cycle} className="report-cycle"><h3>{t('周期','Cycle')} {group.cycle}</h3>{group.reports.map(r=><div key={String(r.id)} className="report-row"><div>
   <h3>{String(r.title)}</h3>
   <p className="metadata">{label(String(r.kind))} · {String(r.report_date)} · {String(r.source)} · v{String(r.version)} · {String(r.language).toUpperCase()}</p>
   {r.published_at&&<p className="metadata">{t('发布时间','Published')} {String(r.published_at).slice(0,16).replace('T',' ')}</p>}
   {r.review_note?<div className="report-review">{t('复核意见','Review note')}: {String(r.review_note)}</div>:null}
   <div className="row-actions">
    <a className="quiet-link" href={`/api/files/${String(r.id)}/original`} target="_blank" rel="noreferrer"><Download size={16}/>{t('原件','Original')}</a>
    {r.has_translation?<a className="quiet-link" href={`/api/files/${String(r.id)}/translation`} target="_blank" rel="noreferrer"><Download size={16}/>{t('译稿','Translation')}</a>:null}
    {r.can_review?<ReportAction report={r} action="review" refresh={refresh}/>:null}
    {r.can_publish?<ReportAction report={r} action="publish" refresh={refresh}/>:null}
    {manage&&['draft','reviewed','published'].includes(String(r.status))?<ReportAction report={r} action="withdraw" refresh={refresh}/>:null}
   </div>
  </div><Status value={String(r.status)}/></div>)}</section>)}</div>
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
