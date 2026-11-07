'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {Button} from '@/components/ui/button';
type Lang='zh'|'en';
const STORAGE_KEY='firstleaf-language';
const Locale=createContext<{lang:Lang;t:(zh:string,en:string)=>string;toggle:()=>void}>({lang:'zh',t:z=>z,toggle:()=>{}});
function persistLanguage(lang:Lang){
 localStorage.setItem(STORAGE_KEY,lang);
 document.cookie=`${STORAGE_KEY}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
}
export function LocaleProvider({children,initialLang}:{children:ReactNode;initialLang:Lang}){
 const [lang,setLang]=useState<Lang>(initialLang);
 useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en'},[lang]);
 useEffect(()=>{persistLanguage(lang)},[lang]);
 const toggle=()=>{
  const next:Lang=lang==='zh'?'en':'zh';
  persistLanguage(next);
  setLang(next);
 };
 return <Locale.Provider value={{lang,t:(zh,en)=>lang==='zh'?zh:en,toggle}}>{children}</Locale.Provider>;
}
export const useLocale=()=>useContext(Locale);
export function LanguageButton(){const {lang,toggle}=useLocale();return <Button className="language-switch" variant="ghost" size="sm" onClick={toggle} aria-label={lang==='zh'?'Switch to English':'切换中文'}>{lang==='zh'?'English':'中文'}</Button>}
