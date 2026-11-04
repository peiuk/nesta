import {guideMetadata} from '@/app/guide-metadata';
import {ProcessPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/process');
export default function Page(){return <ProcessPage/>}
