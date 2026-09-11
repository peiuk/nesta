'use client';

import {useEffect,useState} from 'react';
import {ArrowRight,Building2,CalendarDays,CheckCheck,FileCheck2,FolderOpen,LayoutDashboard,Leaf,LogOut,MessageSquare,RefreshCw,ShieldCheck,Users} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '@/components/ui/table';
import {SidebarProvider,Sidebar,SidebarHeader,SidebarContent,SidebarFooter,SidebarGroup,SidebarGroupLabel,SidebarMenu,SidebarMenuItem,SidebarMenuButton,SidebarInset,SidebarTrigger,useSidebar} from '@/components/ui/sidebar';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';
import {SignIn} from './registration';
import {EggRequests} from './egg-requests';
import {api,useResource,Panel,Empty,ErrorNotice,Status,Field,Choice,ActionForm,Modal,formObject,useLabels,type Data} from './common';
import {Shell,PeopleTab,PersonForm,GrantsTab,CasesTab,CaseDetail,Directory,AuditTab,NewCase,ReplyForm} from './portal';

const sections=[
 {id:'overview',zh:'工作台',en:'Overview',icon:LayoutDashboard},
 {id:'people',zh:'客户与团队',en:'Clients & team',icon:Users},
 {id:'cases',zh:'案件与进度',en:'Cases & progress',icon:FolderOpen},
 {id:'reports',zh:'报告与文件',en:'Reports & files',icon:FileCheck2},
 {id:'directory',zh:'供者资料库',en:'Donor directory',icon:Leaf},
 {id:'partners',zh:'合作方',en:'Partners',icon:Building2},
 {id:'egg-requests',zh:'选卵申请',en:'Egg requests',icon:FileCheck2},
 {id:'grants',zh:'访问授权',en:'Access grants',icon:ShieldCheck},
 {id:'questions',zh:'客户留言',en:'Client messages',icon:MessageSquare},
 {id:'audit',zh:'操作记录',en:'Activity log',icon:CheckCheck},
] as const;
type View=typeof sections[number]['id'];
type Route={view:View;caseId?:string};
const rows=(data:Data,key:string)=>(data[key]||[]) as Data[];

export function AdminPortal({signInHref}:{signInHref:string}){
 const {t}=useLocale();const {data,error,loading}=useResource('me');
 if(loading)return <Shell><div className="loading" role="status">{t('正在验证管理员身份…','Verifying administrator access…')}</div></Shell>;
 if(error==='SIGN_IN_REQUIRED')return <SignIn href={signInHref} returnTo="/admin"/>;
 if(error||!data)return <Shell><ErrorNotice code={error||'SERVICE_UNAVAILABLE'}/></Shell>;
 const profile=data.profile as Data;const signIn=String(data.sign_in);
 if(profile.role!=='admin'||profile.status!=='approved')return <Shell signIn={signIn}><Panel title={t('需要管理员权限','Administrator access required')}><p>{t('当前账户无权进入管理后台。客户与工作人员可从服务空间查看获准的案件。','This account cannot enter Administration. Clients and staff can view assigned cases in the care space.')}</p><a href="/portal" className="primary-link mt-5">{t('进入服务空间','Open care space')}</a></Panel></Shell>;
 return <AdminWorkspace profile={profile} signIn={signIn}/>;
}

function AdminWorkspace({profile,signIn}:{profile:Data;signIn:string}){
 const {t}=useLocale();const [route,setRoute]=useState<Route>({view:'overview'});const [version,setVersion]=useState(0);const [signOutError,setSignOutError]=useState('');
 const refresh=()=>setVersion(v=>v+1);
 const operations=useResource('admin-operations',version);
 useEffect(()=>{
  const sync=()=>{
   const [view,caseId]=window.location.hash.slice(1).split('/');
   setRoute({view:sections.some(s=>s.id===view)?view as View:'overview',...(view==='cases'&&caseId?{caseId}:{})});
   setVersion(v=>v+1);
  };
  sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);
 },[]);
 const go=(view:View)=>{window.location.hash=view;setRoute({view})};
 const openCase=(id:string)=>{window.location.hash='cases/'+encodeURIComponent(id);setRoute({view:'cases',caseId:id})};
 async function signOut(){
  setSignOutError('');
  if(signIn==='email'){try{await api('auth/logout',{});window.location.href='/'}catch(e){setSignOutError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}}
  else window.location.href='/signout-with-chatgpt?return_to=%2F';
 }
 const section=sections.find(s=>s.id===route.view)!;
 const data=operations.data||{};
 return <SidebarProvider className="admin-workspace">
  <AdminNavigation profile={profile} view={route.view} go={go} counts={data.counts||{}}/>
  <SidebarInset className="admin-inset">
   <header className="admin-topbar"><div className="row-actions"><SidebarTrigger aria-label={t('展开或收起菜单','Toggle navigation')}/><span className="admin-breadcrumb">{t('管理后台','Administration')}<span>/</span><strong>{t(section.zh,section.en)}</strong></span></div><div className="row-actions"><LanguageButton/><Button variant="ghost" size="sm" onClick={signOut}><LogOut size={16}/>{t('退出','Sign out')}</Button></div></header>
   <main id="admin-main" className="admin-main">
    <ErrorNotice code={signOutError}/>
    <div className="admin-pilot"><ShieldCheck size={16}/>{t('私密试用 · 仅使用测试资料','Private pilot · Test data only')}</div>
    {route.caseId?<CaseDetail key={route.caseId} caseId={route.caseId} profile={profile} back={()=>go('cases')}/>:<>
     <div className="page-title"><div><h1>{t(section.zh,section.en)}</h1><p>{route.view==='overview'?t('今天需要处理的客户、案件与随访。','Clients, cases and follow-ups that need your attention.'):route.view==='reports'||route.view==='questions'?t('仅显示你已参与案件中的资料。','Records from your assigned cases only.'):t('初禾服务管理','Firstleaf care operations')}</p></div><Button variant="outline" size="sm" onClick={refresh} disabled={operations.loading}><RefreshCw size={15}/>{t('刷新','Refresh')}</Button></div>
     {['overview','reports','questions'].includes(route.view)&&<>
      {operations.loading?<div className="loading" role="status">{t('正在载入工作记录…','Loading work records…')}</div>:operations.error?<ErrorNotice code={operations.error}/>:<>
       {route.view==='overview'&&<Dashboard data={data} go={go} openCase={openCase} refresh={refresh}/>}
       {route.view==='reports'&&<ReportQueue data={data} openCase={openCase} go={go}/>}
       {route.view==='questions'&&<QuestionQueue data={data} openCase={openCase} refresh={refresh}/>}
      </>}
     </>}
     {route.view==='people'&&<PeopleTab key={version}/>}
     {route.view==='cases'&&<CasesTab profile={profile} open={openCase} refresh={refresh} version={version}/>}
     {route.view==='directory'&&<Directory key={version} profile={profile}/>}
     {route.view==='partners'&&<PartnersTab key={version}/>}
     {route.view==='egg-requests'&&<EggRequests admin externalVersion={version} onChanged={refresh}/>}
     {route.view==='grants'&&<GrantsTab key={version}/>}
     {route.view==='audit'&&<AuditTab key={version}/>}
    </>}
   </main>
  </SidebarInset>
 </SidebarProvider>;
}

function AdminNavigation({profile,view,go,counts}:{profile:Data;view:View;go:(v:View)=>void;counts:Data}){
 const {t}=useLocale();const {setOpenMobile}=useSidebar();
 const badges:Partial<Record<View,number>>={people:Number(counts.pending_profiles||0),reports:Number(counts.ready_reports||0),questions:Number(counts.unanswered||0),'egg-requests':Number(counts.pending_egg_requests||0)};
 return <Sidebar className="admin-sidebar">
  <SidebarHeader className="admin-brand"><Brand/><span>{t('服务管理中心','CARE OPERATIONS')}</span></SidebarHeader>
  <SidebarContent><SidebarGroup><SidebarGroupLabel>{t('日常工作','WORKSPACE')}</SidebarGroupLabel><SidebarMenu>
   {sections.map(s=><SidebarMenuItem key={s.id}><SidebarMenuButton isActive={view===s.id} className="admin-nav-button" onClick={()=>{go(s.id);setOpenMobile(false)}} aria-current={view===s.id?'page':undefined}><s.icon/><span>{t(s.zh,s.en)}</span>{Boolean(badges[s.id])&&<span className="admin-nav-count">{badges[s.id]}</span>}</SidebarMenuButton></SidebarMenuItem>)}
  </SidebarMenu></SidebarGroup></SidebarContent>
  <SidebarFooter className="admin-sidebar-footer"><a href="/portal" className="quiet-link">{t('进入服务空间','Open care space')}<ArrowRight size={15}/></a><div className="admin-identity"><span className="admin-avatar">{String(profile.name||'A').slice(0,1).toUpperCase()}</span><div><strong>{t('管理员','Administrator')}</strong><span>{String(profile.email)}</span></div></div></SidebarFooter>
 </Sidebar>;
}

function Dashboard({data,go,openCase,refresh}:{data:Data;go:(v:View)=>void;openCase:(id:string)=>void;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const counts=data.counts||{};
 const metrics=[
  {title:t('待审批客户','Awaiting approval'),value:counts.pending_profiles,to:'people' as View,icon:Users,note:t('已提交基本档案','Submitted profiles')},
  {title:t('进行中案件','Open cases'),value:counts.active_cases,to:'cases' as View,icon:FolderOpen,note:t('未归档的服务案件','Cases not archived')},
  {title:t('待发布报告','Reports to publish'),value:counts.ready_reports,to:'reports' as View,icon:FileCheck2,note:t('已完成独立复核','Independent review complete')},
  {title:t('待回复留言','Unanswered messages'),value:counts.unanswered,to:'questions' as View,icon:MessageSquare,note:t('你参与的案件','Your assigned cases')},
 ];
 return <>
  <div className="admin-metrics">{metrics.map(m=><button key={m.to} className="admin-metric" onClick={()=>go(m.to)}><span><m.icon size={19}/>{m.title}<ArrowRight size={16}/></span><strong>{Number(m.value||0)}</strong><small>{m.note}</small></button>)}</div>
  <div className="admin-dashboard-grid"><div>
   <Panel title={t('客户待审批','Client approvals')} action={<Button variant="ghost" size="sm" onClick={()=>go('people')}>{t('查看全部','View all')}<ArrowRight size={15}/></Button>}>
    {rows(data,'pending').length?rows(data,'pending').map(p=><div className="admin-list-row" key={String(p.id)}><div><h3>{String(p.name)}</h3><p>{String(p.email)}</p><small>{String(p.created_at).slice(0,10)}</small></div><PersonForm person={p} refresh={refresh}/></div>):<Empty title={t('暂无待审批档案','No profiles awaiting approval')}>{t('客户完成注册并提交档案后，会出现在这里。','Clients appear here after submitting their registration profile.')}</Empty>}
   </Panel>
   <Panel title={t('报告处理','Report workflow')} action={<Button variant="ghost" size="sm" onClick={()=>go('reports')}>{t('进入报告中心','Open reports')}<ArrowRight size={15}/></Button>}>
    <div className="admin-workflow"><div><span>01</span><strong>{t('上传原件','Upload original')}</strong><p>{t('在对应案件内上传','Upload within the case')}</p></div><div><span>02</span><strong>{t('独立复核','Independent review')}</strong><p>{Number(counts.draft_reports||0)} {t('份待复核','awaiting review')}</p></div><div><span>03</span><strong>{t('发布给客户','Publish to client')}</strong><p>{Number(counts.ready_reports||0)} {t('份待发布','ready to publish')}</p></div></div>
    <Button variant="outline" onClick={()=>go('cases')}>{t('选择案件上传报告','Choose a case to upload')}<ArrowRight size={15}/></Button>
   </Panel>
   <Panel title={t('最近操作','Recent activity')} action={<Button variant="ghost" size="sm" onClick={()=>go('audit')}>{t('全部记录','Full log')}</Button>}>
    {rows(data,'activity').length?rows(data,'activity').map(a=><div className="admin-activity" key={String(a.id)}><CheckCheck size={16}/><div><strong>{String(a.actor_name||t('系统','System'))}</strong><p>{String(a.action)}</p></div><time>{String(a.created_at).slice(0,16).replace('T',' ')}</time></div>):<p>{t('操作完成后，记录会显示在这里。','Completed actions will appear here.')}</p>}
   </Panel>
  </div><div>
   <Panel title={t('开始处理','Start a task')}><div className="admin-quick-actions"><NewCase refresh={refresh}/><Button variant="outline" onClick={()=>go('egg-requests')}>{t('待审批选卵申请','Egg requests to review')} · {Number(counts.pending_egg_requests||0)}</Button><Button variant="outline" onClick={()=>go('directory')}>{t('维护供者资料','Manage donor profiles')}</Button><Button variant="outline" onClick={()=>go('grants')}>{t('管理客户授权','Manage client access')}</Button></div></Panel>
   <Panel title={t('未来 7 天预约','Appointments · next 7 days')}>
    {rows(data,'appointments').length?rows(data,'appointments').map(e=><button key={String(e.id)} className="admin-appointment" onClick={()=>openCase(String(e.case_id))}><CalendarDays size={20}/><div><time>{String(e.event_date)}</time><strong>{String(e.title)}</strong><small>{String(e.case_code)}</small></div><ArrowRight size={15}/></button>):<p>{t('你参与的案件暂无近期预约。','No upcoming appointments in your assigned cases.')}</p>}
   </Panel>
   <Panel title={t('即将到期的授权','Access expiring soon')} action={<Button variant="ghost" size="sm" onClick={()=>go('grants')}>{t('管理','Manage')}</Button>}>
    {rows(data,'expiring').length?rows(data,'expiring').map(g=><div className="admin-list-row" key={String(g.user_id)+String(g.scope)}><div><h3>{String(g.name)}</h3><p>{label(String(g.scope))}</p></div><time>{String(g.expires_at).slice(0,10)}</time></div>):<p>{t('未来 7 天暂无有效授权到期。','No active grants expire in the next 7 days.')}</p>}
   </Panel>
  </div></div>
 </>;
}

function ReportQueue({data,openCase,go}:{data:Data;openCase:(id:string)=>void;go:(v:View)=>void}){
 const {t}=useLocale();const label=useLabels();const [search,setSearch]=useState('');const [status,setStatus]=useState('all');
 const reports=rows(data,'reports').filter(r=>(status==='all'||r.status===status)&&`${r.title} ${r.case_code} ${r.case_title}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <Panel title={t('案件报告与个人文件 · 最近 100 份','Case reports & personal files · latest 100')} action={<Button onClick={()=>go('cases')}>{t('选择案件上传','Upload in a case')}</Button>}>
  <div className="admin-filters"><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('搜索报告、案件编号或名称','Search report, case code or title')} aria-label={t('搜索报告','Search reports')}/><Select value={status} onValueChange={v=>setStatus(v||'all')}><SelectTrigger aria-label={t('报告状态','Report status')}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t('全部状态','All statuses')}</SelectItem>{['draft','reviewed','published','rejected','withdrawn'].map(s=><SelectItem key={s} value={s}>{label(s)}</SelectItem>)}</SelectContent></Select></div>
  {reports.length?<div className="table-wrap"><Table><TableHeader><TableRow><TableHead>{t('报告 / 文件','Report / file')}</TableHead><TableHead>{t('所属案件','Case')}</TableHead><TableHead>{t('报告日期','Report date')}</TableHead><TableHead>{t('状态','Status')}</TableHead><TableHead>{t('操作','Action')}</TableHead></TableRow></TableHeader><TableBody>{reports.map(r=><TableRow key={String(r.id)}><TableCell><strong>{String(r.title)}</strong><p className="metadata">{label(String(r.kind))} · v{String(r.version)}</p></TableCell><TableCell>{String(r.case_code)}<p className="metadata">{String(r.case_title)}</p></TableCell><TableCell>{String(r.report_date)}</TableCell><TableCell><Status value={String(r.status)}/></TableCell><TableCell><Button variant="outline" size="sm" onClick={()=>openCase(String(r.case_id))}>{t('查看并处理','View & manage')}<ArrowRight size={14}/></Button></TableCell></TableRow>)}</TableBody></Table></div>:<Empty title={t('暂无符合条件的报告','No matching reports')}>{t('在你参与的案件中上传原件，复核和发布进度会显示在这里。','Upload originals in an assigned case to track review and publication here.')}</Empty>}
 </Panel>;
}

function QuestionQueue({data,openCase,refresh}:{data:Data;openCase:(id:string)=>void;refresh:()=>void}){
 const {t}=useLocale();const [replyId,setReplyId]=useState<string|null>(null);const questions=rows(data,'questions');
 return <Panel title={t('待回复留言 · 最早 100 条','Unanswered messages · oldest 100')}>
  {questions.length?questions.map(q=><article className="admin-question" key={String(q.id)}><div className="admin-list-row"><div><h3>{String(q.author_name)}</h3><p>{String(q.case_code)} · {String(q.created_at).slice(0,16).replace('T',' ')}</p></div><Button variant="ghost" size="sm" onClick={()=>openCase(String(q.case_id))}>{t('查看案件','Open case')}<ArrowRight size={14}/></Button></div><p className="admin-question-body">{String(q.body)}</p>{replyId===String(q.id)?<><ReplyForm questionId={String(q.id)} refresh={()=>{setReplyId(null);refresh()}}/><Button variant="ghost" size="sm" onClick={()=>setReplyId(null)}>{t('取消','Cancel')}</Button></>:<Button variant="outline" size="sm" onClick={()=>setReplyId(String(q.id))}>{t('回复客户','Reply to client')}</Button>}</article>):<Empty title={t('暂无待回复留言','No unanswered messages')}>{t('你参与案件中的客户提问会汇集到这里。','Questions from your assigned cases appear here.')}</Empty>}
 </Panel>;
}

function PartnersTab(){
 const {t}=useLocale();const label=useLabels();const [version,setVersion]=useState(0);const refresh=()=>setVersion(v=>v+1);
 const [kind,setKind]=useState('all');const [status,setStatus]=useState('all');
 const {data,error,loading}=useResource('partners',version);
 const partners=((data?.partners||[]) as Data[]).filter(p=>(kind==='all'||String(p.kind)===kind)&&(status==='all'||String(p.status)===status));
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('IVF 诊所与月子中心','IVF clinics & postpartum centers')} action={<PartnerForm refresh={refresh}/>}>
  <div className="notice">{t('停用不会解绑已关联案件；历史案件仍显示名称并标注停用。','Deactivating does not unbind cases; historical cases keep the name marked inactive.')}</div>
  <div className="row-actions mb-4 flex-wrap gap-3">
   <select className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={kind} onChange={e=>setKind(e.target.value)} aria-label={t('类型','Type')}>
    <option value="all">{t('全部类型','All types')}</option>
    <option value="ivf">{label('ivf')}</option>
    <option value="postpartum">{label('postpartum')}</option>
   </select>
   <select className="min-h-11 rounded-md border border-input bg-transparent px-3 text-sm" value={status} onChange={e=>setStatus(e.target.value)} aria-label={t('状态','Status')}>
    <option value="all">{t('全部状态','All statuses')}</option>
    <option value="active">{label('active')}</option>
    <option value="inactive">{label('inactive')}</option>
   </select>
  </div>
  <div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('名称','Name')}</TableHead><TableHead>{t('类型','Type')}</TableHead><TableHead>{t('联系','Contact')}</TableHead><TableHead>{t('状态','Status')}</TableHead><TableHead>{t('操作','Actions')}</TableHead></TableRow></TableHeader>
   <TableBody>{partners.length?partners.map(p=>{
    const contact=[p.contact_name,p.phone,p.email].filter(Boolean).map(String).join(' · ')||'—';
    return <TableRow key={String(p.id)}>
     <TableCell className="whitespace-normal"><strong>{String(p.name)}</strong>{p.notes?<p className="metadata">{String(p.notes)}</p>:null}</TableCell>
     <TableCell>{label(String(p.kind))}</TableCell>
     <TableCell className="whitespace-normal">{contact}</TableCell>
     <TableCell><Status value={String(p.status)}/></TableCell>
     <TableCell><div className="row-actions"><PartnerForm partner={p} refresh={refresh}/><PartnerStatusButton partner={p} refresh={refresh}/></div></TableCell>
    </TableRow>;
   }):<TableRow><TableCell colSpan={5}><Empty title={t('没有匹配的合作方','No matching partners')}>{t('先新建 IVF 诊所或月子中心。','Create an IVF clinic or postpartum center first.')}</Empty></TableCell></TableRow>}</TableBody>
  </Table></div>
 </Panel>;
}

function PartnerForm({partner,refresh}:{partner?:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);const editing=Boolean(partner);
 return <>
  <Button size="sm" variant={editing?'secondary':'default'} onClick={()=>setOpen(true)}>{editing?t('编辑','Edit'):t('新建合作方','New partner')}</Button>
  {open&&<Modal title={editing?t('编辑合作方','Edit partner'):t('新建合作方','New partner')} description={t('仅 IVF 诊所与月子中心；变更记入审计。','IVF clinics and postpartum centers only. Changes are audited.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={async f=>{
    const body={...formObject(f)};
    if(editing)await api('partners/'+String(partner!.id),body);
    else await api('partners',body);
   }} onDone={()=>{setOpen(false);refresh()}}>
    {!editing&&<Choice name="kind" label={t('类型','Type')} options={[['ivf',label('ivf')],['postpartum',label('postpartum')]]} value="ivf"/>}
    <Field name="name" label={t('名称','Name')} value={partner?String(partner.name):undefined} max={150}/>
    <div className="form-grid">
     <Field name="contact_name" label={t('联系人','Contact name')} value={partner?String(partner.contact_name||''):undefined} required={false} max={80}/>
     <Field name="phone" label={t('电话','Phone')} value={partner?String(partner.phone||''):undefined} required={false} max={40}/>
    </div>
    <Field name="email" label={t('邮箱','Email')} value={partner?String(partner.email||''):undefined} required={false} max={120}/>
    <Field name="notes" type="textarea" label={t('内部备注','Internal notes')} value={partner?String(partner.notes||''):undefined} required={false} max={1500}/>
    {editing&&<Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500} required/>}
   </ActionForm>
  </Modal>}
 </>;
}

function PartnerStatusButton({partner,refresh}:{partner:Data;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const [open,setOpen]=useState(false);
 const next=String(partner.status)==='active'?'inactive':'active';
 return <>
  <Button size="sm" variant="outline" onClick={()=>setOpen(true)}>{next==='inactive'?t('停用','Deactivate'):t('启用','Activate')}</Button>
  {open&&<Modal title={next==='inactive'?t('停用合作方','Deactivate partner'):t('启用合作方','Activate partner')} description={t('状态变更记入审计；停用不解除案件绑定。','Status changes are audited. Deactivation does not clear case bindings.')} onClose={()=>setOpen(false)}>
   <p className="mb-3">{String(partner.name)} · {label(String(partner.kind))}</p>
   <ActionForm submitLabel={next==='inactive'?t('确认停用','Confirm deactivate'):t('确认启用','Confirm activate')} onSubmit={f=>api('partners/'+String(partner.id),{status:next,reason:f.get('reason')})} onDone={()=>{setOpen(false);refresh()}}>
    <Field name="reason" type="textarea" label={t('理由（记入审计）','Reason (recorded in audit)')} max={500}/>
   </ActionForm>
  </Modal>}
 </>;
}
