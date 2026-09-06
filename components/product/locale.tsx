'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
type Lang = 'zh' | 'en';
const Locale = createContext<{lang:Lang;t:(zh:string,en:string)=>string;toggle:()=>void}>({lang:'zh',t:z=>z,toggle:()=>{}});
export function LocaleProvider({children}:{children:ReactNode}) {
 const [lang,setLang]=useState<Lang>('zh');
 useEffect(()=>{if(localStorage.getItem('firstleaf-language')==='en')setLang('en')},[]);
 useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en'},[lang]);
 const toggle=()=>setLang(l=>{const next=l==='zh'?'en':'zh';localStorage.setItem('firstleaf-language',next);return next});
 return <Locale.Provider value={{lang,t:(zh,en)=>lang==='zh'?zh:en,toggle}}>{children}</Locale.Provider>;
}
export const useLocale=()=>useContext(Locale);
export function LanguageButton(){const {lang,toggle}=useLocale();return <Button variant="ghost" size="sm" onClick={toggle} aria-label={lang==='zh'?'Switch to English':'切换中文'}>{lang==='zh'?'English':'中文'}</Button>}
