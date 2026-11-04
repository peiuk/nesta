import {guideMetadata} from '@/app/guide-metadata';
import {FeesPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/fees');
export default function Page(){return <FeesPage/>}
