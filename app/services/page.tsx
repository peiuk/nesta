import {guideMetadata} from '@/app/guide-metadata';
import {PublicJsonLd} from '@/app/public-jsonld';
import {ServicesPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/services');
export default function Page(){return <><PublicJsonLd path="/services"/><ServicesPage/></>}
