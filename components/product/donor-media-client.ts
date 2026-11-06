import {DONOR_MEDIA_BATCH_MAX_BYTES,DONOR_MEDIA_MAX_ITEMS} from '@/lib/donor-photos';

export const DONOR_MEDIA_ACCEPT='image/jpeg,image/png,application/pdf,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.pdf,.mp4,.webm,.mov';

function fileSizeLimit(file:File){
 const name=file.name.toLowerCase();
 if(file.type==='application/pdf'||name.endsWith('.pdf'))return 8*1024*1024;
 if(file.type.startsWith('video/')||/\.(mp4|m4v|webm|mov)$/.test(name))return 50*1024*1024;
 return 5*1024*1024;
}

function looksLikeDonorMedia(file:File){
 const name=file.name.toLowerCase();
 if(file.type==='application/pdf'||name.endsWith('.pdf'))return true;
 if(file.type.startsWith('video/')||/\.(mp4|m4v|webm|mov)$/.test(name))return true;
 if(file.type==='image/jpeg'||file.type==='image/png'||/\.(jpe?g|png)$/.test(name))return true;
 return false;
}

export function validateDonorMediaSelection(selected:File[],existingCount=0):string|null{
 if(!selected.length)return null;
 if(selected.length+existingCount>DONOR_MEDIA_MAX_ITEMS)return 'PHOTO_LIMIT';
 let total=0;
 for(const file of selected){
  if(!looksLikeDonorMedia(file)||file.size<8||file.size>fileSizeLimit(file))return 'INVALID_PHOTO';
  total+=file.size;
 }
 if(total>DONOR_MEDIA_BATCH_MAX_BYTES)return 'PHOTO_BATCH_TOO_LARGE';
 return null;
}

export function donorMediaKind(mime:string){
 if(mime==='application/pdf')return 'pdf';
 if(mime.startsWith('video/'))return 'video';
 if(mime.startsWith('image/'))return 'image';
 return 'other';
}
