'use client';
import {createContext,useContext,useEffect,useSyncExternalStore,type ReactNode} from 'react';
import {Button} from '@/components/ui/button';
type Lang='zh'|'en';
const STORAGE_KEY='firstleaf-language';
let current:Lang='zh';
const listeners=new Set<()=>void>();
function emit(){for(const l of listeners)l()}
function subscribe(l:()=>void){listeners.add(l);return()=>{listeners.delete(l)}}
function deviceLang():Lang{
 const tags=[...(navigator.languages||[]),navigator.language||''];
 return tags.some(l=>String(l).toLowerCase().startsWith('zh'))?'zh':'en';
}
function resolveLang():Lang{
 const saved=localStorage.getItem(STORAGE_KEY);
 if(saved==='zh'||saved==='en')return saved;
 return deviceLang();
}
if(typeof window!=='undefined')current=resolveLang();
const Locale=createContext<{lang:Lang;t:(zh:string,en:string)=>string;toggle:()=>void}>({lang:'zh',t:z=>z,toggle:()=>{}});
export function LocaleProvider({children}:{children:ReactNode}){
 const lang=useSyncExternalStore<Lang>(subscribe,()=>current,()=>'zh');
 useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-CN':'en'},[lang]);
 const toggle=()=>{const next:Lang=lang==='zh'?'en':'zh';localStorage.setItem(STORAGE_KEY,next);current=next;emit()};
 return <Locale.Provider value={{lang,t:(zh,en)=>lang==='zh'?zh:en,toggle}}>{children}</Locale.Provider>;
}
export const useLocale=()=>useContext(Locale);
export function LanguageButton(){const {lang,toggle}=useLocale();return <Button className="language-switch" variant="ghost" size="sm" onClick={toggle} aria-label={lang==='zh'?'Switch to English':'切换中文'}>{lang==='zh'?'English':'中文'}</Button>}
