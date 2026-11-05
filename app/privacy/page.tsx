import type {Metadata} from 'next';
import '@/app/home.css';
import {PrivacyView} from './privacy-view';

export const metadata: Metadata = {
  title: {absolute: '隐私政策 · Nesta'},
  robots: {index: true, follow: true},
};

export default function Page() {
  return <PrivacyView />;
}
