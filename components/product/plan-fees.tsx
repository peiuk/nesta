'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {api,useResource,ErrorNotice,Empty,Panel,ActionForm,Modal,Field,Choice,formObject,type Data} from './common';
import {useLocale} from './locale';
import {isTier,packageSpec} from '@/lib/case-plans';

const TIER_LABEL:Record<string,[string,string]>={
 a:['A · 自卵自精','A · Own eggs & sperm'],
 b:['B · 自精供卵','B · Donor eggs'],
 c:['C · 自精供卵','C · Donor eggs'],
 c_plus:['C · 升级大包','C · Upgraded package'],
 basic:['基础（历史）','Basic (legacy)'],
 mid:['中级（历史）','Mid (legacy)'],
 advanced:['高级（历史）','Advanced (legacy)'],
};
const CURRENT_TIERS=['a','b','c','c_plus'] as const;
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

function money(amount:number,currency:string){
 const n=Number(amount||0).toLocaleString();
 return currency==='CNY'?`¥${n}`:`$${n}`;
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
   <a className="quiet-link" href="/nesta-packages.jpg" download>{t('下载套餐说明','Download package sheet')}</a>
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
  {canManage&&plan&&<ReceiptForm caseId={caseId} currency={String(plan.currency||'CNY')} onDone={()=>{setVersion(v=>v+1);refresh();}}/>}
 </Panel>;
}

function PlanCard({plan,lang,t}:{plan:Data;lang:string;t:(zh:string,en:string)=>string}){
 const milestones=(plan.milestones||[]) as Array<Data>;
 const receipts=(plan.receipts||[]) as Array<Data>;
 const currency=String(plan.currency||'USD');
 const pgs=plan.pgs_scope==='all'?t('全部胚胎 PGS','PGS for all embryos'):plan.pgs_scope==='contract'?t('PGS 按合同','PGS per contract'):t(`含 ${plan.pgs_included} 枚 PGS`,`Includes ${plan.pgs_included} PGS`);
 return <div className="panel-card">
  <div className="summary-grid mb-4">
   <div className="summary-item"><span className="metadata">{t('档位','Tier')}</span><strong>{L(TIER_LABEL,String(plan.tier),t)}</strong></div>
   <div className="summary-item"><span className="metadata">{t('合同总价','Contract total')}</span><strong>{money(Number(plan.total_usd),currency)}</strong></div>
   <div className="summary-item"><span className="metadata">{t('已收款','Collected')}</span><strong>{money(Number(plan.paid_usd||0),currency)}</strong></div>
   <div className="summary-item"><span className="metadata">{t('待收','Outstanding')}</span><strong>{money(Number(plan.pending_usd||0),currency)}</strong></div>
  </div>
  <p className="metadata mb-3">{String(plan.package_version||'')} · {currency} · {pgs} · {t('超出','extras')} ${String(plan.pgs_extra_usd)}{t('/枚','/each')}</p>
  <div className="table-wrap mb-4"><table className="packages-table"><thead><tr><th>{t('付款节点','Milestone')}</th><th>{t('金额','Amount')}</th><th>{t('状态','Status')}</th></tr></thead><tbody>
   {milestones.map(m=><tr key={String(m.key)}><td>{lang==='zh'?String(m.label_zh):String(m.label_en||m.label_zh)}</td><td>{money(Number(m.amount_usd),currency)}</td><td>{m.status==='paid'?`${t('已付','Paid')}${m.paid_at?` ${String(m.paid_at).slice(0,10)}`:''}`:t('待付','Pending')}</td></tr>)}
  </tbody></table></div>
  <p className="metadata mb-3">{t('每一期只在对应检查报告或交付完成后收取。双胎、剖腹产、NICU、额外 PGS 和加速包不计入这些比例。未见胎心不收胎心这一期；约定尝试用尽仍未妊娠时，这一期不收，已发生的孕母匹配费用另结。','Each installment is collected only after the matching checkup report or deliverable. Twins, caesarean, NICU, extra PGS and the expedite package sit outside these percentages. The heartbeat installment is not charged without a heartbeat; if agreed attempts are exhausted without pregnancy, that installment is not charged and surrogate matching costs already incurred are settled separately.')}</p>
  {receipts.length&&milestones.some(m=>m.status==='paid')?<p className="metadata mb-3">{t('已收款含已付节点和收款记录。同一笔不要录两次。','Collected includes paid milestones and receipts. Do not record the same payment twice.')}</p>:null}
  {receipts.length?<div className="table-wrap mb-4"><table className="packages-table"><thead><tr><th>{t('收款日期','Date')}</th><th>{t('金额','Amount')}</th><th>{t('凭证','Voucher')}</th></tr></thead><tbody>
   {receipts.map(r=><tr key={String(r.id||r.paid_on)}><td>{String(r.paid_on)}</td><td>{money(Number(r.amount),String(r.currency||currency))}</td><td>{String(r.voucher||'')}</td></tr>)}
  </tbody></table></div>:null}
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
 const initial=String(plan?.tier||'b');
 const [tier,setTier]=useState(isTier(initial)?initial:'b');
 const spec=packageSpec(tier);
 const options:Array<[string,string]>=CURRENT_TIERS.map(key=>[key,L(TIER_LABEL,key,t)]);
 if(plan?.tier&&!CURRENT_TIERS.includes(plan.tier as typeof CURRENT_TIERS[number]))options.unshift([String(plan.tier),L(TIER_LABEL,String(plan.tier),t)]);
 const sameTier=String(plan?.tier||'')===tier;
 return <Modal title={plan?t('更新方案','Update plan'):t('写入方案','Add plan')} description={t('保存后按套餐总价写入七个付款节点。不是这七个节点的旧付款表会被整表替换，已付标记不保留。已经是这七个节点时，已付金额和日期保留。','Saving writes the seven payment milestones from the package total. A stored schedule that is not those seven nodes is replaced outright, including paid flags. Paid amounts and dates stay when the schedule is already those seven nodes.')} onClose={onClose}>
  <ActionForm submitLabel={t('保存方案','Save plan')} onSubmit={async f=>{
   const body=formObject(f);
   await api(`cases/${caseId}/plan`,{
    tier:body.tier,
    total_usd:Number(body.total_usd),
    pgs_included:body.pgs_included===undefined?undefined:Number(body.pgs_included),
    pgs_extra_usd:Number(body.pgs_extra_usd),
    egg_status:body.egg_status,
    sperm_status:body.sperm_status,
    twin_status:body.twin_status,
    csection_status:body.csection_status,
    nicu_status:body.nicu_status,
    note:body.note||'',
    reason:body.reason,
   });
  }} onDone={onDone}>
   <Choice name="tier" label={t('套餐','Package')} value={tier} onChange={value=>{if(isTier(value))setTier(value)}} options={options}/>
   <p className="metadata">{spec.version} · {spec.currency}</p>
   <Field key={tier+'-total'} name="total_usd" label={spec.currency==='CNY'?t('合同总价（人民币）','Contract total (CNY)'):t('合同总价（美元）','Contract total (USD)')} value={String(sameTier?plan?.total_usd:spec.total)}/>
   {spec.pgsScope==='count'?<Field key={tier+'-pgs'} name="pgs_included" label={t('含 PGS 枚数','PGS included')} value={String(sameTier?plan?.pgs_included:spec.pgs)}/>:<input type="hidden" name="pgs_included" value={String(spec.pgs)}/>}
   <Field name="pgs_extra_usd" label={t('超出单价 USD','Overage USD')} value={String(plan?.pgs_extra_usd||500)}/>
   <Choice name="egg_status" label={t('供卵','Egg')} value={String(plan?.egg_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="sperm_status" label={t('供精','Sperm')} value={String(plan?.sperm_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="twin_status" label={t('双胎','Twins')} value={String(plan?.twin_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="csection_status" label={t('剖宫','C-section')} value={String(plan?.csection_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Choice name="nicu_status" label={t('NICU','NICU')} value={String(plan?.nicu_status||'none')} options={Object.keys(ADDON_LABEL).map(k=>[k,L(ADDON_LABEL,k,t)] as [string,string])}/>
   <Field name="note" type="textarea" label={t('客户可见备注','Client-visible note')} value={String(plan?.note||'')} max={500}/>
   <Field name="reason" type="textarea" label={t('审计原因','Audit reason')} max={500}/>
  </ActionForm>
 </Modal>;
}

function ReceiptForm({caseId,currency,onDone}:{caseId:string;currency:string;onDone:()=>void}){
 const {t}=useLocale();
 const [open,setOpen]=useState(false);
 if(!open)return <div className="row-actions mt-3"><Button size="sm" variant="outline" onClick={()=>setOpen(true)}>{t('记录收款','Record receipt')}</Button></div>;
 return <Modal title={t('记录收款','Record receipt')} description={t('只追加一笔实际收款。保存方案不会改动这里的金额、日期和凭证。','Adds one actual receipt. Saving the plan does not change this amount, date or voucher.')} onClose={()=>setOpen(false)}>
  <ActionForm submitLabel={t('保存收款','Save receipt')} onSubmit={async f=>{
   const body=formObject(f);
   await api(`cases/${caseId}/payments`,{amount:Number(body.amount),currency:body.currency,paid_on:body.paid_on,voucher:body.voucher,note:body.note||'',reason:body.reason});
  }} onDone={()=>{setOpen(false);onDone()}}>
   <Field name="amount" type="number" label={t('金额','Amount')}/>
   <Choice name="currency" label={t('币种','Currency')} value={currency==='USD'?'USD':'CNY'} options={[['CNY','CNY'],['USD','USD']]}/>
   <Field name="paid_on" type="date" label={t('收款日期','Date paid')}/>
   <Field name="voucher" label={t('凭证号','Voucher')} max={120}/>
   <Field name="note" type="textarea" label={t('备注','Note')} required={false} max={300}/>
   <Field name="reason" type="textarea" label={t('审计原因','Audit reason')} max={500}/>
  </ActionForm>
 </Modal>;
}
