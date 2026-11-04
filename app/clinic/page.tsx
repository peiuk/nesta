import {guideMetadata} from '@/app/guide-metadata';
import {ClinicPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/clinic');
export default function Page(){return <ClinicPage/>}