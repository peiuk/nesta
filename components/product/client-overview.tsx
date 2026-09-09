'use client';
import {ArrowRight,CalendarDays,FileCheck2,ClipboardList} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useLocale} from './locale';
import {Panel,Empty,Status,useLabels,type Data} from './common';
import {canUseDirectory} from '@/lib/policy';

export function ClientOverview({profile,data,open,go}:{profile:Data;data:Data;open:(id:string)=>void;go:(view:'directory'|'requests')=>void}){
 const {t}=useLocale();const label=useLabels();const cases=(data.cases||[]) as Data[],reports=(data.recent_reports||[]) as Data[],appointments=(data.appointments||[]) as Data[];
 const grants=(data.grants||[]) as Array<{scope:string;expires_at:string;revoked_at:string|null}>;
 const actor={id:String(profile.id),role:String(profile.role),status:String(profile.status)};
 const live=grants.filter(g=>canUseDirectory(actor,g,g.scope));const pending=Number(data.pending_selections||0);
 return <div className="client-overview">
  <div className="page-title"><div><h1>{t('我的服务空间','My care space')}</h1><p>{String(profile.name)} · {t('查看下一步安排、申请与报告。','Your next steps, requests and reports.')}</p></div><a href="/#contact" className="quiet-link">{t('联系服务团队','Contact the team')}</a></div>
  <div className="client-summary">
   <button onClick={()=>go('requests')}><ClipboardList size={21}/><div><span>{t('待审批选卵申请','Egg requests awaiting review')}</span><strong>{pending}</strong></div><ArrowRight size={17}/></button>
   <div><CalendarDays size={21}/><div><span>{t('下一次预约','Next appointment')}</span><strong>{appointments[0]?String(appointments[0].event_date):t('尚未安排','Not scheduled')}</strong></div></div>
   <div><FileCheck2 size={21}/><div><span>{t('最新报告日期','Latest report date')}</span><strong>{reports[0]?String(reports[0].report_date):t('暂无报告','No report yet')}</strong></div></div>
  </div>
  <Panel title={t('下一步','Your next steps')}>
   <div className="client-next">
    <div><h3>{pending?t('等待选卵申请审批','Egg request under review'):live.length?t('查看获准访问的供者资料','Explore your approved directories'):t('确认资料库访问权限','Confirm directory access')}</h3><p>{pending?t('服务团队处理后，可在申请页面查看结果和回复。','Once reviewed, the result and reply appear on your requests page.'):live.length?t('先查看详情、收藏或对比，再提交选卵申请。','Review details, save or compare records, then submit an egg request.'):t('资料库按人授权。请联系服务团队确认本次服务的访问范围。','Directory access is individually granted. Ask the team to confirm your access.')}</p></div>
    {pending?<Button onClick={()=>go('requests')}>{t('查看申请','View requests')}<ArrowRight size={16}/></Button>:live.length?<Button onClick={()=>go('directory')}>{t('进入资料库','Open directories')}<ArrowRight size={16}/></Button>:<a className="primary-link" href="/#contact">{t('联系团队','Contact team')}</a>}
   </div>
  </Panel>
  <div className="split"><div>
   <Panel title={t('我的案件与进度','My cases & progress')}>
    {cases.length?cases.map(c=><button key={String(c.id)} className="client-case" onClick={()=>open(String(c.id))}><div><h3>{String(c.title)}</h3><p>{String(c.code)} · {t('周期','Cycle')} {String(c.cycle)}</p><small>{t('最近更新','Updated')} {String(c.updated_at).slice(0,10)}</small></div><div><Status value={String(c.stage)}/><span>{t('查看进度与文件','View progress & files')} <ArrowRight size={14}/></span></div></button>):<Empty title={t('案件尚未建立','Your case has not been created yet')}>{t('服务团队建立案件后，进度、报告和沟通记录会集中显示在这里。','Once the team creates your case, its progress, reports and conversations appear here.')}</Empty>}
   </Panel>
   <Panel title={t('最新已发布报告 · 最近 5 份','Latest published reports · last 5')}>
    {reports.length?reports.map(r=><article key={String(r.id)} className="client-report"><h3>{String(r.title)}</h3><p className="metadata">{String(r.case_code)} · {t('周期','Cycle')} {String(r.cycle)} · {t('报告日期','Report date')} {String(r.report_date)}</p><p className="metadata">{t('发布时间','Published')} {String(r.published_at||'').slice(0,16).replace('T',' ')}</p><div className="row-actions mt-3"><a className="quiet-link" href={`/api/files/${String(r.id)}/original`} target="_blank" rel="noreferrer">{t('下载原件','Download original')}</a>{Boolean(r.has_translation)&&<a className="quiet-link" href={`/api/files/${String(r.id)}/translation`} target="_blank" rel="noreferrer">{t('下载译件','Download translation')}</a>}<Button variant="ghost" onClick={()=>open(String(r.case_id))}>{t('查看全部案件文件','All case files')}</Button></div></article>):<Empty title={t('暂无已发布报告','No published reports yet')}>{t('报告完成复核并向你发布后，会出现在这里。','Reports appear here once reviewed and published to you.')}</Empty>}
   </Panel>
  </div><div>
   <Panel title={t('即将到来的预约','Upcoming appointments')}>
    {appointments.length?appointments.map(e=><button className="client-appointment" key={String(e.id)} onClick={()=>open(String(e.case_id))}><CalendarDays size={20}/><div><strong>{String(e.event_date)}</strong><span>{String(e.title)}</span><small>{String(e.case_code)}</small></div><ArrowRight size={16}/></button>):<p>{t('暂无已记录的预约。具体检查安排请与案件协调员确认。','No appointments are recorded yet. Confirm examination arrangements with your case coordinator.')}</p>}
   </Panel>
   <Panel title={t('资料库授权','Directory access')}>
    {live.length?live.map(g=><div className="client-grant" key={g.scope}><strong>{label(g.scope)}</strong><p>{t('有效至','Valid until')} {g.expires_at.slice(0,10)}</p></div>):<p>{t('尚无有效授权。','No active directory grants.')}</p>}
   </Panel>
  </div></div>
 </div>;
}
