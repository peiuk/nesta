'use client';
import type {ReactNode} from 'react';
import {PublicFooter} from './public-footer';
import {PublicSiteHeader} from './public-site-header';

export function PublicShell({current,children}:{current:string;children:ReactNode}){
 return <div className="home-shell home-editorial">
  <PublicSiteHeader current={current} className="site-header faq-header"/>
  {children}
  <PublicFooter current={current} showHomeLink/>
 </div>;
}
