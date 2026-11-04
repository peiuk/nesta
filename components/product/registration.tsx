'use client';
import {useState} from 'react';
import {ShieldCheck} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Brand} from './brand';
import {LanguageButton,useLocale} from './locale';
import {ActionForm,api,Choice,Field,formObject,useResource,type Data} from './common';

export function SignIn({href,returnTo='/portal'}:{href:string;returnTo?:'/portal'|'/admin'}){
 const {t}=useLocale();
 const [phase,setPhase]=useState<'email'|'code'>('email');
 const [email,setEmail]=useState('');
 const options=useResource('auth/options');const emailEnabled=options.data?.email_enabled===true;
 const isAdmin=returnTo==='/admin';
 return <main className="auth-page"><div className="flex justify-between items-center"><Brand/><LanguageButton/></div><section className="auth-card"><ShieldCheck size={30}/><h1>{isAdmin?t('登录管理后台','Administration sign-in'):t('进入你的私密空间','Your private care space')}</h1><p>{isAdmin?t('可使用管理员 ChatGPT 账户，或使用已在服务器登记的管理员邮箱收取验证码登录。','Sign in with the administrator ChatGPT account, or request a one-time code to a registered administrator email address.') :t('登录后建立基本档案，服务团队审核后开放资料库和案件访问。','Create your profile after signing in. The service team reviews directory and case access.')}</p><a className="primary-link w-full" href={href} target="_top">{t('使用 ChatGPT 登录','Sign in with ChatGPT')}</a>
  {emailEnabled&&<>
  <div className="auth-divider"><span>{t('或使用邮箱验证码','Or use an email code')}</span></div>
  {phase==='email'
   ?<ActionForm submitLabel={t('发送验证码','Send code')} onDone={()=>setPhase('code')} onSubmit={async f=>{const value=String(f.get('email')||'');await api('auth/email/request',{email:value});setEmail(value)}}>
     <Field name="email" type="email" label={t('邮箱','Email')} max={254}/>
     <p className="metadata">{isAdmin?t('不设密码。仅登记为管理员的邮箱验证后可进入后台；其他邮箱登录后会提示无权限。','No password. Only registered administrator addresses can enter this workspace after verification; other addresses are signed in but denied access here.'):t('不设密码。与 ChatGPT 使用同一邮箱将进入同一档案。','No password. The same email as ChatGPT signs into the same profile.')}</p>
    </ActionForm>
   :<ActionForm submitLabel={t('登录','Sign in')} onDone={()=>{window.location.href=returnTo}} onSubmit={async f=>{await api('auth/email/verify',{email,code:String(f.get('code')||'')})}}>
     <p className="metadata">{t('验证码已发送至','Code sent to')} {email}</p>
     <Field name="code" label={t('6 位验证码','6-digit code')} max={6}/>
     <button type="button" className="quiet-link mt-2" onClick={()=>setPhase('email')}>{t('更换邮箱','Change email')}</button>
    </ActionForm>}</>}
  <p className="metadata">{t('当前为私密试用版，请仅提交测试资料。','This is a private pilot. Submit test data only.')}</p><a href="/privacy" className="quiet-link">{t('隐私与试用说明','Privacy & pilot information')}</a></section></main>;
}

export function Registration({profile,done}:{profile:Data;done:()=>void}){const {t,lang}=useLocale();const [accepted,setAccepted]=useState(false);return <section className="auth-card max-w-2xl mx-auto"><h1>{t('建立你的客户档案','Create your client profile')}</h1><p>{t('先介绍基本需求，暂时无需提交医疗记录。','Tell us your initial needs. Medical records are not needed at this stage.')}</p><ActionForm onDone={done} submitLabel={t('提交档案','Submit profile')} onSubmit={f=>api('profile',{...formObject(f),accepted})}><Field name="name" label={t('称呼','Name')} value={profile.name} max={80}/><div className="form-grid"><Choice name="language" label={t('沟通语言','Preferred language')} value={lang} options={[["zh","中文"],["en","English"]]}/><Field name="jurisdiction" label={t('居住国家或地区','Country / region of residence')} max={100}/></div><Field name="interest" type="textarea" label={t('服务意向','Service interests')} max={1000}/><div className="metadata">{t('登录邮箱','Sign-in email')}: {profile.email}</div><label className="checkbox-row"><Checkbox checked={accepted} onCheckedChange={v=>setAccepted(v===true)}/><span>{t('我已阅读试用资料说明，同意为建立本次服务档案处理这些基本信息。','I have read the pilot information and agree to processing these details to create this service profile.')} <a href="/privacy" target="_blank" rel="noreferrer" className="underline">{t('查看说明','Read notice')}</a></span></label></ActionForm></section>}
