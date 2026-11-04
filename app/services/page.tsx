import {guideMetadata} from '@/app/guide-metadata';
import {ServicesPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/services');
export default function Page(){return <ServicesPage/>}
