import {normalizeEmail} from './email-auth.ts';

export type ClientUpdate=
 | {kind:'report';caseId:string;reportId:string}
 | {kind:'progress';caseId:string}
 | {kind:'message';caseId:string;authorId:string};
type Recipient={email:string;language:string};
type Mail={to:string;subject:string;text:string};
type QueryParam=string|number|null|Uint8Array|ArrayBuffer;
type Dependencies={
 all:<T>(sql:string,...params:QueryParam[])=>Promise<T[]>;
 enqueue?:(mail:Mail,dedupeKey:string)=>Promise<void>;
 send?:(mail:Mail)=>Promise<void>;
};

export async function sendWithRetry(send:(mail:Mail)=>Promise<void>,mail:Mail,options:{maxAttempts?:number;baseDelayMs?:number}={}){
 const maxAttempts=Math.max(1,Math.min(5,options.maxAttempts??3));
 const baseDelayMs=Math.max(0,Math.min(5000,options.baseDelayMs??250));
 for(let attempt=1;;attempt++){
  try{return await send(mail)}catch(error){
   if(attempt>=maxAttempts)throw error;
   const delay=baseDelayMs*2**(attempt-1);
   if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  }
 }
}

const labels={
 report:{zh:'报告与文件',en:'reports and files'},
 progress:{zh:'服务进度',en:'service progress'},
 message:{zh:'沟通记录',en:'communication records'},
};

/** Called only after a successful, client-visible mutation has committed. */
export async function notifyClientUpdate(deps:Dependencies,update:ClientUpdate,origin:string){
 try{
  const portal=new URL('/portal',origin);
  if(!['https:','http:'].includes(portal.protocol))throw new Error('INVALID_SITE_ORIGIN');
  const params:string[]=[update.caseId];
  let scope='';
  if(update.kind==='report'){
   scope=' AND EXISTS (SELECT 1 FROM report_recipients rr JOIN reports r ON r.id=rr.report_id WHERE rr.user_id=p.id AND r.id=? AND r.case_id=m.case_id)';
   params.push(update.reportId);
  }else if(update.kind==='message'){
   scope=' AND p.id=?';params.push(update.authorId);
  }
  const recipients=await deps.all<Recipient>(`SELECT p.email,p.language FROM case_members m JOIN profiles p ON p.id=m.user_id WHERE m.case_id=? AND m.role='client' AND p.role='client' AND p.status='approved'${scope}`, ...params);
  const sent=new Set<string>();
  for(const recipient of recipients){
   const to=normalizeEmail(recipient.email);if(!to||sent.has(to))continue;
   sent.add(to);
   const label=labels[update.kind];
   const text=recipient.language==='en'
    ?`There is an update to your ${label.en}. Please sign in to your Nesta client portal to view the latest information:\n${portal.href}\n\nThis email does not include private records or attachments.`
    :`您的${label.zh}有更新。请登录 Nesta 客户门户查看最新内容：\n${portal.href}\n\n本邮件不包含私密记录或文件附件。`;
    try{
     const mail={to,subject:`Nesta: ${label.en} updated`,text};
     if(deps.enqueue)await deps.enqueue(mail,`${update.kind}:${update.caseId}:${update.kind==='report'?update.reportId:update.kind==='message'?update.authorId:'progress'}`);
     else if(deps.send)await sendWithRetry(deps.send,mail);
    }
   catch{console.error('[firstleaf-client-alert] Email delivery failed',update.kind,update.caseId)}
  }
 }catch{
  // An email or recipient lookup failure must not turn a committed update into a failed save.
  console.error('[firstleaf-client-alert] Notification failed',update.kind,update.caseId);
 }
}
