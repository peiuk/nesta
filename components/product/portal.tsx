'use client';
import {useEffect,useState,type ReactNode} from 'react';
import {ArrowLeft,Download,Heart,LogOut,Upload} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
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
 const showDirectory=profile.role==='admin'||(profile.role==='client'&&hasDirectoryAccess({id:String(profile.id),role:String(profile.role),status:String(profile.status)},grants));
 useEffect(()=>{if(view==='directory'&&!showDirectory)setView('overview')},[view,showDirectory]);
 const openCase=(id:string)=>{setView('overview');setCaseId(id)};
 const go=(next:'overview'|'directory'|'admin')=>{setCaseId(null);setView(next)};
 const item=(key:'overview'|'directory'|'admin',label:string)=><Button key={key} variant={view===key?'secondary':'ghost'} size="sm" onClick={()=>go(key)}>{label}</Button>;
 const nav=<>{item('overview',t('概览','Overview'))}{showDirectory&&item('directory',t('资料库','Directory'))}{profile.role==='admin'&&item('admin',t('管理','Administration'))}</>;
 return <Shell nav={nav}>
  {view==='overview'&&(caseId
   ?<CaseDetail caseId={caseId} profile={profile} back={()=>setCaseId(null)}/>
   :overview.loading?<div className="loading">{t('正在载入…','Loading…')}</div>
   :overview.error?<ErrorNotice code={overview.error}/>
   :<Overview profile={profile} data={overview.data||{}} open={setCaseId} refresh={refresh}/>)}
  {view==='directory'&&showDirectory&&<Directory profile={profile}/>}
  {view==='admin'&&<Admin open={openCase} refresh={refresh} version={version}/>}
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

function Directory({profile}:{profile:Data}){
 const {t,lang}=useLocale();const label=useLabels();const [kind,setKind]=useState<'egg'|'sperm'>('egg');const [version,setVersion]=useState(0);
 const refresh=()=>setVersion(v=>v+1);
 const {data,error,loading}=useResource(`directory?kind=${kind}`,version);
 const donors=(data?.donors||[]) as Data[];
 return <>
  <div className="page-title"><div><h1>{t('供者资料库','Donor directory')}</h1><p>{t('授权范围与有效期由管理员设定，资料仅供本次服务评估使用。','Scope and expiry are set by an administrator. Records are for this service assessment only.')}</p></div>{profile.role==='admin'&&<NewDonor refresh={refresh}/>}</div>
  <div className="row-actions section-tabs">{(['egg','sperm'] as const).map(k=><Button key={k} variant={kind===k?'secondary':'ghost'} size="sm" onClick={()=>setKind(k)}>{label(k)}</Button>)}</div>
  {loading?<div className="loading">{t('正在载入…','Loading…')}</div>
   :error?<ErrorNotice code={error}/>
   :donors.length?<div className="directory-grid">{donors.map(d=><DonorCard key={String(d.id)} donor={d} admin={profile.role==='admin'} summary={String(lang==='zh'?d.summary_zh:d.summary_en)} refresh={refresh}/>)}</div>
   :<Empty title={t('暂无可查看的档案','No records available')}/>}
 </>;
}

function DonorCard({donor,admin,summary,refresh}:{donor:Data;admin:boolean;summary:string;refresh:()=>void}){
 const {t}=useLocale();const [busy,setBusy]=useState(false);const favorite=Number(donor.favorite)===1;
 async function toggle(){if(busy)return;setBusy(true);try{await api('favorites',{donor_id:String(donor.id),favorite:!favorite});refresh()}finally{setBusy(false)}}
 return <article className="donor-card">
  <div className="donor-top"><span className="donor-code">{String(donor.code)}</span><Status value={String(donor.status)}/></div>
  <dl>
   <div><dt>{t('年龄','Age')}</dt><dd>{String(donor.age)}</dd></div>
   <div><dt>{t('身高','Height')}</dt><dd>{donor.height?`${String(donor.height)} cm`:'—'}</dd></div>
   <div><dt>{t('血型','Blood group')}</dt><dd>{String(donor.blood_group||'—')}</dd></div>
   <div><dt>{t('核实日期','Verified')}</dt><dd>{String(donor.verified_at)}</dd></div>
  </dl>
  <p>{summary}</p>
  <div className="metadata">{t('来源','Source')}: {String(donor.source)}</div>
  <div className="row-actions mt-4">
   <Button variant={favorite?'secondary':'ghost'} size="sm" disabled={busy} onClick={toggle}><Heart size={16}/>{favorite?t('已收藏','Saved'):t('收藏','Save')}</Button>
   {admin&&<DonorStatus donor={donor} refresh={refresh}/>}
  </div>
 </article>;
}

function DonorStatus({donor,refresh}:{donor:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="ghost" size="sm" onClick={()=>setOpen(true)}>{t('更改状态','Change status')}</Button>
  {open&&<Modal title={t('更改档案状态','Change record status')} description={t('状态变更会记入审计。','Status changes are recorded in the audit log.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('donors/'+String(donor.id),formObject(f))} onDone={()=>{setOpen(false);refresh()}}>
    <Choice name="status" label={t('状态','Status')} value={String(donor.status)} options={['available','matching','unavailable','archived'].map(s=>[s,label(s)] as [string,string])}/>
    <Field name="reason" type="textarea" label={t('理由','Reason')} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}

function NewDonor({refresh}:{refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button onClick={()=>setOpen(true)}>{t('新增档案','Add record')}</Button>
  {open&&<Modal title={t('新增供者档案','Add donor record')} description={t('仅录入已核实、已取得同意的匿名摘要，不含身份信息。','Record only verified, consented anonymous summaries. No identifying details.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存档案','Save record')} onSubmit={f=>api('donors',{...formObject(f),age:Number(f.get('age')),height:f.get('height')?Number(f.get('height')):null})} onDone={()=>{setOpen(false);refresh()}}>
    <div className="form-grid">
     <Field name="code" label={t('档案编号','Record code')} max={40}/>
     <Choice name="kind" label={t('类别','Type')} options={[['egg',label('egg')],['sperm',label('sperm')]]}/>
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

function Admin({open,refresh,version}:{open:(id:string)=>void;refresh:()=>void;version:number}){
 const {t}=useLocale();
 return <>
  <div className="page-title"><div><h1>{t('管理','Administration')}</h1><p>{t('账户审批、资料库授权与审计记录。','Account approvals, directory grants and the audit log.')}</p></div></div>
  <Tabs defaultValue="people" className="section-tabs">
   <TabsList><TabsTrigger value="people">{t('人员','People')}</TabsTrigger><TabsTrigger value="grants">{t('授权','Grants')}</TabsTrigger><TabsTrigger value="cases">{t('案件','Cases')}</TabsTrigger><TabsTrigger value="audit">{t('审计','Audit')}</TabsTrigger></TabsList>
   <TabsContent value="people"><PeopleTab/></TabsContent>
   <TabsContent value="grants"><GrantsTab/></TabsContent>
   <TabsContent value="cases"><CasesTab open={open} refresh={refresh} version={version}/></TabsContent>
   <TabsContent value="audit"><AuditTab/></TabsContent>
  </Tabs>
 </>;
}

function PeopleTab(){
 const {t}=useLocale();const label=useLabels();const [version,setVersion]=useState(0);const {data,error,loading}=useResource('people',version);
 const people=(data?.people||[]) as Data[];
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('账户','Accounts')}>
  <div className="notice">{t('更改角色会清除该账户已有的案件成员身份与资料库授权，需要重新分配。','Changing a role clears existing case memberships and directory grants; reassign them afterwards.')}</div>
  <div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('姓名','Name')}</TableHead><TableHead>{t('邮箱','Email')}</TableHead><TableHead>{t('角色','Role')}</TableHead><TableHead>{t('状态','Status')}</TableHead><TableHead/></TableRow></TableHeader>
   <TableBody>{people.map(p=><TableRow key={String(p.id)}>
    <TableCell>{String(p.name)}</TableCell><TableCell>{String(p.email)}</TableCell><TableCell>{label(String(p.role))}</TableCell><TableCell><Status value={String(p.status)}/></TableCell>
    <TableCell>{p.role==='admin'?<span className="metadata">{t('管理员账户','Owner account')}</span>:<PersonForm person={p} refresh={()=>setVersion(v=>v+1)}/>}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>
 </Panel>;
}

function PersonForm({person,refresh}:{person:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" size="sm" onClick={()=>setOpen(true)}>{t('更改','Change')}</Button>
  {open&&<Modal title={`${t('更改账户','Change account')} · ${String(person.name)}`} description={t('角色与状态变更会记入审计。','Role and status changes are recorded in the audit log.')} onClose={()=>setOpen(false)}>
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

function GrantsTab(){
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

function GrantForm({refresh}:{refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);const [action,setAction]=useState('grant');const people=useResource(open?'people':null);
 const candidates=((people.data?.people||[]) as Data[]).filter(p=>p.status==='approved');
 return <>
  <Button size="sm" onClick={()=>{setAction('grant');setOpen(true)}}>{t('发放或撤销','Grant or revoke')}</Button>
  {open&&<Modal title={t('资料库授权','Directory access')} description={t('到期日须在未来一年内；撤销时到期日不生效。','Expiry must fall within one year. Expiry is ignored when revoking.')} onClose={()=>setOpen(false)}>
   {people.loading?<div className="loading">{t('正在载入…','Loading…')}</div>:people.error?<ErrorNotice code={people.error}/>:candidates.length===0?<Empty title={t('没有可选账户','No approved accounts')}>{t('请先在管理页批准账户。','Approve an account in Administration first.')}</Empty>
    :<ActionForm submitLabel={t('保存','Save')} onSubmit={f=>api('grants',{user_id:f.get('user_id'),scope:f.get('scope'),expires_at:f.get('expires_at'),reason:f.get('reason'),revoke:f.get('action')==='revoke'})} onDone={()=>{setOpen(false);refresh()}}>
     <Choice name="user_id" label={t('账户','Account')} options={candidates.map(p=>[String(p.id),`${String(p.name)} · ${String(p.email)}`] as [string,string])}/>
     <div className="form-grid">
      <Choice name="scope" label={t('范围','Scope')} options={[['egg',label('egg')],['sperm',label('sperm')]]}/>
      <label className="field"><span>{t('操作','Action')}</span><select name="action" className="min-h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={action} onChange={e=>setAction(e.target.value)}><option value="grant">{t('发放','Grant')}</option><option value="revoke">{t('撤销','Revoke')}</option></select></label>
     </div>
     <Field name="expires_at" type="date" label={t('到期日','Expiry date')} required={action!=='revoke'}/>
     <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
    </ActionForm>}
  </Modal>}
 </>;
}

function CasesTab({open,refresh,version}:{open:(id:string)=>void;refresh:()=>void;version:number}){
 const {t}=useLocale();const label=useLabels();const {data,error,loading}=useResource('cases',version);
 const cases=(data?.cases||[]) as Data[];
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('全部案件','All cases')} action={<NewCase refresh={refresh}/>}>
  <div className="notice">{t('查看案件详情需要先把自己分配为该案件成员。','Assign yourself to a case before opening its detail view.')}</div>
  {cases.length?<div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('编号','Code')}</TableHead><TableHead>{t('名称','Title')}</TableHead><TableHead>{t('阶段','Stage')}</TableHead><TableHead>{t('我的身份','My role')}</TableHead><TableHead>{t('更新','Updated')}</TableHead></TableRow></TableHeader>
   <TableBody>{cases.map(c=><TableRow key={String(c.id)}>
    <TableCell>{String(c.code)}</TableCell><TableCell className="whitespace-normal">{String(c.title)}</TableCell><TableCell><Status value={String(c.stage)}/></TableCell>
    <TableCell>{c.membership_role?<Button type="button" variant="link" className="h-auto p-0" onClick={()=>open(String(c.id))}>{label(String(c.membership_role))}</Button>:<span className="metadata">{t('未参与','Not a member')}</span>}</TableCell>
    <TableCell>{String(c.updated_at).slice(0,10)}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>:<Empty title={t('还没有案件','No cases yet')}/>}
 </Panel>;
}

function AuditTab(){
 const {t}=useLocale();const {data,error,loading}=useResource('audit');
 const rows=(data?.audit||[]) as Data[];
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('审计记录（最近 100 条）','Audit log (latest 100)')}>
  {rows.length?<div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('时间','Time')}</TableHead><TableHead>{t('操作人','Actor')}</TableHead><TableHead>{t('动作','Action')}</TableHead><TableHead>{t('对象','Target')}</TableHead><TableHead>{t('理由','Reason')}</TableHead></TableRow></TableHeader>
   <TableBody>{rows.map(r=><TableRow key={String(r.id)}>
    <TableCell>{String(r.created_at).slice(0,19).replace('T',' ')}</TableCell><TableCell>{String(r.actor_name||r.actor_id)}</TableCell><TableCell>{String(r.action)}</TableCell>
    <TableCell className="font-mono text-xs">{String(r.target)}</TableCell><TableCell className="whitespace-normal">{String(r.reason)}</TableCell>
   </TableRow>)}</TableBody>
  </Table></div>:<Empty title={t('还没有记录','No entries yet')}/>}
 </Panel>;
}
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
