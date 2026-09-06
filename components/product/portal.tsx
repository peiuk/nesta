'use client';
import {useState,type ReactNode} from 'react';
import {ArrowLeft,LogOut} from 'lucide-react';
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

function CaseDetail({back}:{caseId:string;profile:Data;back:()=>void}){const {t}=useLocale();return <><Button variant="ghost" size="sm" onClick={back}><ArrowLeft size={16}/>{t('返回概览','Back to overview')}</Button><div className="notice">{t('案件详情正在开发中。','Case detail is under construction.')}</div></>}
function Directory(_:{profile:Data}){const {t}=useLocale();return <div className="notice">{t('资料库正在开发中。','Directory is under construction.')}</div>}
function Admin(){const {t}=useLocale();return <div className="notice">{t('管理页正在开发中。','Administration is under construction.')}</div>}
