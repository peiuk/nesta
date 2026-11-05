'use client';
import type {ReactNode} from 'react';
import {PublicFooter} from './public-footer';
import {PublicSiteHeader} from './public-site-header';

export function PublicShell({current,children,wideMeasure=false}:{current:string;children:ReactNode;wideMeasure?:boolean}){
 return <div className={`home-shell home-editorial${wideMeasure?' public-shell-measure-wide':''}`}>
  <PublicSiteHeader current={current} className="site-header faq-header"/>
  {children}
  <PublicFooter current={current} showHomeLink/>
 </div>;
}
