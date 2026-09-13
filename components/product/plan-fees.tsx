'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {api,useResource,ErrorNotice,Empty,Panel,ActionForm,Modal,Field,Choice,formObject,type Data} from './common';
import {useLocale} from './locale';

const TIER_LABEL:Record<string,[string,string]>={
 basic:['基础','Basic'],
 mid:['中级','Mid'],
 advanced:['高级','Advanced'],
};
const ADDON_LABEL:Record<string,[string,string]>={
 none:['未发生','None'],
 quoted:['已报价','Quoted'],
 included:['已含','Included'],
 occurred:['已发生','Occurred'],
};

function L(map:Record<string,[string,string]>,key:string,t:(zh:string,en:string)=>string){
 const pair=map[key]||[key,key];
 return t(pair[0],pair[1]);
}

export function ClientPlanFees(){
 const {t,lang}=useLocale();
 const {data,error,loading}=useResource('plans',0);
 if(loading)return <div className="loading">{t('正在载入…','Loading…')}</div>;
 if(error)return <ErrorNotice code={error}/>;
 const plans=(data?.plans||[]) as Data[];
 if(!plans.length)return <div className="stack gap-4">
  <Empty title={t('还没有签约方案','No plan on file yet')}>{t('协调员确认套餐并写入方案后，这里会显示档位、付款节点与加项。你也可以先查看公开套餐说明。','After your coordinator confirms a package, tier, payment milestones and add-ons appear here. You can review the public package sheet meanwhile.')}</Empty>
  <div className="row-actions">
   <a className="primary-link" href="/#packages">{t('查看套餐页','View packages')}</a>
   <a className="quiet-link" href="/nesta-packages-zh-v2026-09-13.pdf" download>{t('下载套餐说明','Download package sheet')}</a>
  </div>
 </div>;
 return <div className="stack gap-6">{plans.map(p=><PlanCard key={String(p.case_id)} plan={p} lang={lang} t={t}/>)}</div>;
}

export function CasePlanPanel({caseId,canManage,refresh}:{caseId:string;canManage:boolean;refresh:()=>void}){
 const {t,lang}=useLocale();
 const [version,setVersion]=useState(0);
 const {data,error,loading}=useResource('cases/'+caseId+'/plan',version);
 const [open,setOpen]=useState(false);
 if(loading)return <Panel title={t('我的方案 / 费用','My plan / fees')}><div className="loading">{t('正在载入…','Loading…')}</div></Panel>;
 if(error&&error!=='NOT_FOUND')return <Panel title={t('我的方案 / 费用','My plan / fees')}><ErrorNotice code={error}/></Panel>;
 const plan=(data?.plan||null) as Data|null;
 return <Panel title={t('我的方案 / 费用','My plan / fees')} action={canManage?<Button size="sm" onClick={()=>setOpen(true)}>{plan?t('更新方案','Update plan'):t('写入方案','Add plan')}</Button>:undefined}>
  {!plan?<Empty title={t('尚未写入方案','No plan saved')}>{canManage?t('请写入档位、总价与付款节点，客户即可在「我的方案/费用」查看。','Save tier, total and milestones so the client can see them under Plan / fees.'):t('方案确认后将显示在这里。','Your plan will appear here once confirmed.')}</Empty>
   :<PlanCard plan={plan} lang={lang} t={t}/>}
  {open&&canManage&&<PlanForm caseId={caseId} plan={plan} onClose={()=>setOpen(false)} onDone={()=>{setOpen(false);setVersion(v=>v+1);refresh();}}/>}
 </Panel>;
}

function PlanCard({plan,lang,t}:{plan:Data;lang:string;t:(zh:string,en:string)=>string}){
 const milestones=(plan.milestones||[]) as Array<Data>;
 return <div className="panel-card">
  <div className="summary-grid mb-4">
   <div className="summary-item"><span className="metadata">{t('档位','Tier')}</span><strong>{L(TIER_LABEL,String(plan.tier),t)}</strong></div>
   <div className="summary-item"><span className="metadata">{t('合同总价','Contract total')}</span><strong>${Number(plan.total_usd).toLocaleString()}</strong></div>
   <div className="summary-item"><span className="metadata">{t('已付','Paid')}</span><strong>${Number(plan.paid_usd||0).toLocaleString()}</strong></div>
   <div className="summary-item"><span className="metadata">{t('待付','Pending')}</span><strong>${Number(plan.pending_usd||0).toLocaleString()}</strong></div>
  </div>
  <p className="metadata mb-3">{t('PGS 含','PGS included')} {String(plan.pgs_included)} {t('枚；超出','embryos; extras')} ${String(plan.pgs_extra_usd)}{t('/枚','/each')}</p>
  <div className="table-wrap mb-4"><table className="packages-table"><thead><tr><th>{t('付款节点','Milestone')}</th><th>{t('金额','Amount')}</th><th>{t('状态','Status')}</th></tr></thead><tbody>
   {milestones.map(m=><tr key={String(m.key)}><td>{lang==='zh'?String(m.label_zh):String(m.label_en||m.label_zh)}</td><td>${Number(m.amount_usd).toLocaleString()}</td><td>{m.status==='paid'?t('已付','Paid'):t('待付','Pending')}</td></tr>)}
  </tbody></table></div>
  <ul className="metadata" style={{display:'grid',gap:6}}>
   <li>{t('供卵','Egg donation')}: {L(ADDON_LABEL,String(plan.egg_status),t)}</li>
   <li>{t('供精','Sperm donation')}: {L(ADDON_LABEL,String(plan.sperm_status),t)}</li>
   <li>{t('双胎','Twins')}: {L(ADDON_LABEL,String(plan.twin_status),t)}</li>
   <li>{t('剖宫','C-section')}: {L(ADDON_LABEL,String(plan.csection_status),t)}</li>
   <li>{t('NICU','NICU')}: {L(ADDON_LABEL,String(plan.nicu_status),t)}</li>
  </ul>
  {plan.note?<p className="metadata mt-3">{String(plan.note)}</p>:null}
 </div>;
}

function PlanForm({caseId,plan,onClose,onDone}:{caseId:string;plan:Data|null;onClose:()=>void;onDone:()=>void}){
 const {t}=useLocale();
 const tier=String(plan?.tier||'mid');
 return <Modal title={plan?t('更新方案','Update plan'):t('写入方案','Add plan')} description={t('客户只读可见。勿填写内部成本或未公开折扣。','Visible read-only to the client. Do not enter internal costs or unreleased discounts.')} onClose={onClose}>
  <ActionForm submitLabel={t('保存方案','Save plan')} onSubmit={async f=>{
   const body=formObject(f);
   const paidKeys=String(body.paid_keys||'').split(',').map(s=>s.trim()).filter(Boolean);
   await api(`cases/${caseId}/plan`,{
    tier:body.tier,
    total_usd:Number(body.total_usd),
    pgs_included:Number(body.pgs_included),
    pgs_extra_usd:Number(body.pgs_extra_usd),
    egg_status:body.egg_status,
    sperm_status:body.sperm_status,
    twin_status:body.twin_status,
    csection_status:body.csection_status,
    nicu_status:body.nicu_status,
    note:body.note||'',
    paid_keys:paidKeys,
    reason:body.reason,
   });
  }} onDone={onDone}>
   <Choice name="tier" label={t('档位','Tier')} value={tier} options={[['basic',t('基础','Basic')],['mid',t('中级','Mid')],['advanced',t('高级','Advanced')]]}/>
   <Field name="total_usd" label={t('合同总价 (USD)','Contract total (USD)')} value={String(plan?.total_usd||72000)}/>
   <Field name="pgs_included" label={t('含 PGS 枚数','PGS included')} value={String(plan?.pgs_included ?? 6)}/>
   <Field name="pgs_extra_usd" label={t('超出单价 USD','Overage USD')} value={String(plan?.pgs_extra_usd||500)}/>
   <Choice name="egg_status" label={t('供卵','Egg')} value={String(plan?.egg_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="sperm_status" label={t('供精','Sperm')} value={String(plan?.sperm_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="twin_status" label={t('双胎','Twins')} value={String(plan?.twin_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="csection_status" label={t('剖宫','C-section')} value={String(plan?.csection_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="nicu_status" label={t('NICU','NICU')} value={String(plan?.nicu_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Field name="paid_keys" label={t('已付节点 key（逗号分隔，如 contract,cycle）','Paid milestone keys (comma-separated)')} value={((plan?.milestones as Data[])||[]).filter(m=>m.status==='paid').map(m=>String(m.key)).join(',')} />
   <Field name="note" type="textarea" label={t('客户可见备注','Client-visible note')} value={String(plan?.note||'')} max={500}/>
   <Field name="reason" type="textarea" label={t('审计原因','Audit reason')} max={500}/>
  </ActionForm>
 </Modal>;
}
