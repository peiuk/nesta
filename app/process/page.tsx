import {guideMetadata} from '@/app/guide-metadata';
import {PublicJsonLd} from '@/app/public-jsonld';
import {ProcessPage} from '@/components/product/guide-pages';
import '@/app/home.css';
export const generateMetadata=()=>guideMetadata('/process');
export default function Page(){return <><PublicJsonLd path="/process"/><ProcessPage/></>}
