'use client';

import {useEffect,useState} from 'react';
import {ArrowRight,Building2,CalendarDays,CheckCheck,FileCheck2,FolderOpen,HelpCircle,LayoutDashboard,Leaf,LogOut,MessageSquare,RefreshCw,ShieldCheck,Users,X} from 'lucide-react';
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
 {id:'site-faq',zh:'官网问答',en:'Website questions',icon:HelpCircle},
 {id:'audit',zh:'操作记录',en:'Activity log',icon:CheckCheck},
] as const;
type View=typeof sections[number]['id'];
type Route={view:View;caseId?:string};
const rows=(data:Data,key:string)=>(data[key]||[]) as Data[];
const navigationGroups=[
 {zh:'日常工作',en:'Daily work',views:['overview','people','cases','reports','questions','site-faq']},
 {zh:'资料与匹配',en:'Directory & matching',views:['directory','partners','egg-requests']},
 {zh:'权限与记录',en:'Access & records',views:['grants','audit']},
];
const descriptions:Partial<Record<View,[string,string]>>={
 overview:['集中处理审批、报告和客户跟进。','Approvals, reports and client follow-ups in one place.'],
 people:['审核客户档案，管理团队角色与账户状态。','Review client profiles, team roles and account status.'],
 cases:['查看服务阶段，跟进预约与案件进度。','Track service stages, appointments and case progress.'],
 reports:['查看你参与案件的报告，跟进复核与发布。','Review and publish reports from your assigned cases.'],
 directory:['维护供者档案、照片与可申请状态。','Manage donor records, photos and availability.'],
 'egg-requests':['查看客户选择，审核并跟进申请。','Review client selections and follow up on requests.'],
 grants:['管理客户的资料库权限与有效期。','Manage directory permissions and expiry dates.'],
 questions:['回复你参与案件中的客户留言。','Reply to messages from your assigned cases.'],
 'site-faq':['修改官网问答的中英文、顺序，以及是否公开。','Edit the public questions in both languages, their order, and whether they are visible.'],
 audit:['追溯账户、授权与资料变更。','Trace changes to accounts, access and records.'],
};

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
  <a className="admin-skip-link" href="#admin-main" onClick={e=>{e.preventDefault();document.getElementById('admin-main')?.focus()}}>{t('跳至主要内容','Skip to main content')}</a>
  <AdminNavigation profile={profile} view={route.view} go={go} counts={data.counts||{}}/>
  <SidebarInset className="admin-inset">
   <header className="admin-topbar"><div className="admin-topbar-start"><SidebarTrigger aria-label={t('展开或收起菜单','Toggle navigation')}/><span className="admin-breadcrumb"><span className="admin-breadcrumb-root">{t('管理后台','Administration')}<span aria-hidden="true">/</span></span><strong>{t(section.zh,section.en)}</strong></span></div><div className="admin-topbar-actions"><LanguageButton/><Button variant="ghost" size="sm" onClick={signOut} aria-label={t('退出登录','Sign out')}><LogOut size={16}/><span className="admin-signout-label">{t('退出','Sign out')}</span></Button></div></header>
   <main id="admin-main" className="admin-main" tabIndex={-1}>
    <ErrorNotice code={signOutError}/>
    {route.caseId?<CaseDetail key={route.caseId} caseId={route.caseId} profile={profile} back={()=>go('cases')}/>:<>
     <div className="page-title"><div><h1>{t(section.zh,section.en)}</h1><p>{t(...(descriptions[route.view]||['奈斯服务管理','Nesta care operations']))}</p></div><Button className="admin-refresh" variant="outline" size="sm" onClick={refresh} disabled={operations.loading}><RefreshCw size={15} className={operations.loading?'animate-spin':undefined}/>{t('刷新','Refresh')}</Button></div>
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
     {route.view==='site-faq'&&<FaqTab key={version}/>}
     {route.view==='egg-requests'&&<EggRequests admin externalVersion={version} onChanged={refresh}/>}
     {route.view==='grants'&&<GrantsTab key={version}/>}
     {route.view==='audit'&&<AuditTab key={version}/>}
    </>}
   </main>
  </SidebarInset>
 </SidebarProvider>;
}

function AdminNavigation({profile,view,go,counts}:{profile:Data;view:View;go:(v:View)=>void;counts:Data}){
 const {t}=useLocale();const {setOpenMobile,isMobile}=useSidebar();
 const badges:Partial<Record<View,number>>={people:Number(counts.pending_profiles||0),reports:Number(counts.ready_reports||0),questions:Number(counts.unanswered||0),'egg-requests':Number(counts.pending_egg_requests||0)};
 return <Sidebar className="admin-sidebar">
  <SidebarHeader className="admin-brand"><Brand/><span>{t('服务管理中心','CARE OPERATIONS')}</span>{isMobile&&<Button className="admin-menu-close" size="icon" variant="ghost" onClick={()=>setOpenMobile(false)} aria-label={t('关闭菜单','Close navigation')}><X size={20}/></Button>}</SidebarHeader>
  <SidebarContent className="admin-nav-content"><nav aria-label={t('后台导航','Administration navigation')}>{navigationGroups.map(group=><SidebarGroup key={group.en}><SidebarGroupLabel>{t(group.zh,group.en)}</SidebarGroupLabel><SidebarMenu>
   {sections.filter(s=>group.views.includes(s.id)).map(s=><SidebarMenuItem key={s.id}><SidebarMenuButton isActive={view===s.id} className="admin-nav-button" onClick={()=>{go(s.id);setOpenMobile(false)}} aria-current={view===s.id?'page':undefined}><s.icon/><span>{t(s.zh,s.en)}</span>{Boolean(badges[s.id])&&<span className="admin-nav-count">{badges[s.id]}</span>}</SidebarMenuButton></SidebarMenuItem>)}
  </SidebarMenu></SidebarGroup>)}</nav></SidebarContent>
  <SidebarFooter className="admin-sidebar-footer"><a href="/portal" className="quiet-link">{t('进入服务空间','Open care space')}<ArrowRight size={15}/></a><div className="admin-identity"><span className="admin-avatar">{String(profile.name||'A').slice(0,1).toUpperCase()}</span><div><strong>{t('管理员','Administrator')}</strong><span>{String(profile.email)}</span></div></div><div className="admin-pilot"><ShieldCheck size={14}/><span>{t('私密试用 · 仅使用测试资料','Private pilot · Test data only')}</span></div></SidebarFooter>
 </Sidebar>;
}

function Dashboard({data,go,openCase,refresh}:{data:Data;go:(v:View)=>void;openCase:(id:string)=>void;refresh:()=>void}){
 const {t}=useLocale();const label=useLabels();const counts=data.counts||{};
 const metrics=[
  {title:t('待审批客户','Awaiting approval'),value:counts.pending_profiles,to:'people' as View,icon:Users,note:t('已提交基本档案','Submitted profiles')},
  {title:t('待审批选卵','Egg requests'),value:counts.pending_egg_requests,to:'egg-requests' as View,icon:Leaf,note:t('客户已提交选择','Submitted selections')},
  {title:t('全部进行中','All open cases'),value:counts.active_cases,to:'cases' as View,icon:FolderOpen,note:t('未归档的服务案件','Cases not archived')},
  {title:t('我参与的','Assigned to me'),value:counts.my_open_cases,to:'cases' as View,icon:FolderOpen,note:t('我是协调员','Where I am coordinator')},
  {title:t('待发布报告','Reports to publish'),value:counts.ready_reports,to:'reports' as View,icon:FileCheck2,note:t('已完成独立复核','Independent review complete')},
  {title:t('待回复留言','Unanswered messages'),value:counts.unanswered,to:'questions' as View,icon:MessageSquare,note:t('你参与的案件','Your assigned cases')},
 ];
 return <>
  <div className="admin-metrics">{metrics.map(m=><button key={m.to} className="admin-metric" data-attention={m.to!=='cases'&&Number(m.value||0)>0} onClick={()=>go(m.to)}><span><span className="admin-metric-icon"><m.icon size={18}/></span>{m.title}<ArrowRight size={15}/></span><strong>{Number(m.value||0)}</strong><small>{m.note}</small></button>)}</div>
  <div className="admin-taskbar"><span>{t('快捷操作','Quick actions')}</span><div className="row-actions"><NewCase refresh={refresh}/><Button variant="outline" onClick={()=>go('cases')}><FileCheck2 size={16}/>{t('上传报告','Upload report')}</Button><Button variant="outline" onClick={()=>go('directory')}><Leaf size={16}/>{t('供者资料','Donor records')}</Button><Button variant="outline" onClick={()=>go('grants')}><ShieldCheck size={16}/>{t('客户授权','Client access')}</Button></div></div>
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
   <Panel title={t('未分配协调员','No coordinator')}>
    {rows(data,'unassigned').length?rows(data,'unassigned').map(c=><button key={String(c.id)} className="admin-appointment" onClick={()=>openCase(String(c.id))}><FolderOpen size={20}/><div><strong>{String(c.code)}</strong><small>{String(c.title)}</small></div><ArrowRight size={15}/></button>):<p>{t('未结案都已有协调员。','Every open case has a coordinator.')}</p>}
   </Panel>
   <Panel title={t('缺审核员的草稿','Drafts with no reviewer')}>
    {rows(data,'drafts_missing_reviewer').length?rows(data,'drafts_missing_reviewer').map(r=><button key={String(r.id)} className="admin-appointment" onClick={()=>openCase(String(r.case_id))}><FileCheck2 size={20}/><div><strong>{String(r.title)}</strong><small>{String(r.case_code)}</small></div><ArrowRight size={15}/></button>):<p>{t('你参与的案件里，草稿都已有审核员。','Drafts in your cases already have a reviewer.')}</p>}
   </Panel>
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

function FaqTab(){
 const {t}=useLocale();const [version,setVersion]=useState(0);const [moveError,setMoveError]=useState('');const refresh=()=>setVersion(v=>v+1);
 const {data,error,loading}=useResource('site-faq',version);
 const items=(data?.faq||[]) as Data[];
 async function move(id:string,direction:'up'|'down'){setMoveError('');try{await api('site-faq/'+id+'/move',{direction});refresh()}catch(e){setMoveError(e instanceof Error?e.message:'SERVICE_UNAVAILABLE')}}
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 return <Panel title={t('官网公开问答','Public website questions')} action={<div className="row-actions"><SyncDefaultFaqButton refresh={refresh}/><FaqForm refresh={refresh}/></div>}>
  <ErrorNotice code={moveError}/>
  <div className="notice">{t('隐藏后，首页问答不再显示这一条。上移、下移会立刻改变公开顺序。「同步默认模板」会用代码里的 12 条标准问答更新正文（含 LeaderMed、月子中心与 RMB 套餐说明），保留每条顺序与是否隐藏；不会删除你额外新增的问答。','Hiding a question removes it from the public page. Moving it up or down changes the public order immediately. “Sync default template” refreshes the twelve standard Q&A texts from code (LeaderMed, postpartum centre, RMB programmes). Order and visibility stay the same; extra questions you added are not removed.')}</div>
  <div className="table-wrap"><Table>
   <TableHeader><TableRow><TableHead>{t('问题','Question')}</TableHead><TableHead>{t('状态','Status')}</TableHead><TableHead>{t('操作','Actions')}</TableHead></TableRow></TableHeader>
   <TableBody>{items.length?items.map((item,index)=><TableRow key={String(item.id)}>
    <TableCell className="whitespace-normal"><strong>{String(item.question_zh)}</strong><p className="metadata">{String(item.question_en)}</p></TableCell>
    <TableCell>{item.hidden?t('已隐藏','Hidden'):t('公开','Visible')}</TableCell>
    <TableCell><div className="row-actions">
     <Button size="sm" variant="outline" disabled={index===0} onClick={()=>move(String(item.id),'up')}>{t('上移','Up')}</Button>
     <Button size="sm" variant="outline" disabled={index===items.length-1} onClick={()=>move(String(item.id),'down')}>{t('下移','Down')}</Button>
     <FaqForm item={item} refresh={refresh}/>
    </div></TableCell>
   </TableRow>):<TableRow><TableCell colSpan={3}><Empty title={t('还没有问答','No questions yet')}>{t('新增一条后，公开的问题会出现在官网问答页。','A visible question appears on the website after you add it.')}</Empty></TableCell></TableRow>}</TableBody>
  </Table></div>
 </Panel>;
}

function SyncDefaultFaqButton({refresh}:{refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);
 return <>
  <Button size="sm" variant="outline" onClick={()=>setOpen(true)}>{t('同步默认模板','Sync default template')}</Button>
  {open&&<Modal title={t('同步官网默认问答','Sync default website Q&A')} description={t('将当前部署中的标准模板写回数据库，公开页会立即使用更新后的 LeaderMed、月子中心与套餐说明。','Writes the standard template from this deployment into the database. The public FAQ page will show the updated LeaderMed, postpartum and programme copy immediately.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('确认同步','Confirm sync')} onSubmit={async()=>{await api('site-faq/sync-default',{})}} onDone={()=>{setOpen(false);refresh()}}>
    <p className="metadata">{t('已有 faq-01 至 faq-12 等标准条目：只更新中英文问与答，不改顺序与隐藏状态。缺少的标准条目会追加到列表末尾。你在后台单独新增的问答不会被删除。','Existing standard ids (faq-01 … faq-12): questions and answers are updated; order and visibility are unchanged. Missing standard entries are appended. Custom questions you added are kept.')}</p>
   </ActionForm>
  </Modal>}
 </>;
}

function FaqForm({item,refresh}:{item?:Data;refresh:()=>void}){
 const {t}=useLocale();const [open,setOpen]=useState(false);const editing=Boolean(item);
 return <>
  <Button size="sm" variant={editing?'secondary':'default'} onClick={()=>setOpen(true)}>{editing?t('编辑','Edit'):t('新增问答','Add question')}</Button>
  {open&&<Modal title={editing?t('编辑问答','Edit question'):t('新增问答','Add question')} description={t('中英文都会显示在官网。选择隐藏后，访客看不到这一条。','Both languages appear on the website. A hidden question is not shown to visitors.')} onClose={()=>setOpen(false)}>
   <ActionForm submitLabel={t('保存','Save')} onSubmit={async f=>{
    const body=formObject(f);
    const payload={question_zh:body.question_zh,question_en:body.question_en,answer_zh:body.answer_zh,answer_en:body.answer_en,hidden:body.hidden};
    if(editing)await api('site-faq/'+String(item!.id),payload);
    else await api('site-faq',payload);
   }} onDone={()=>{setOpen(false);refresh()}}>
    <Field name="question_zh" label={t('中文问题','Chinese question')} value={item?String(item.question_zh):undefined} max={180}/>
    <Field name="question_en" label={t('英文问题','English question')} value={item?String(item.question_en):undefined} max={180}/>
    <Field name="answer_zh" type="textarea" label={t('中文回答','Chinese answer')} value={item?String(item.answer_zh):undefined} max={2000}/>
    <Field name="answer_en" type="textarea" label={t('英文回答','English answer')} value={item?String(item.answer_en):undefined} max={2000}/>
    <Choice name="hidden" label={t('是否公开','Visibility')} value={item?.hidden?'1':'0'} options={[['0',t('公开','Visible')],['1',t('隐藏','Hidden')]]}/>
   </ActionForm>
  </Modal>}
 </>;
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
