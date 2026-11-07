import test from 'node:test';
import assert from 'node:assert/strict';
import {REPORT_FILE_MAX_BYTES,REPORT_REQUEST_MAX_BYTES,DONOR_MEDIA_MAX_ITEMS,DONOR_IMAGE_MAX_BYTES,DONOR_PDF_MAX_BYTES,DONOR_VIDEO_MAX_BYTES,DONOR_MEDIA_BATCH_MAX_BYTES,DONOR_MEDIA_REQUEST_MAX_BYTES,limitMB} from '../lib/limits.ts';
import {DONOR_MEDIA_MAX_ITEMS as RE_EXPORTED_ITEMS,DONOR_MEDIA_BATCH_MAX_BYTES as RE_EXPORTED_BATCH} from '../lib/donor-photos.ts';
import {classifyUpload} from '../lib/policy.ts';

const MiB=1024*1024;

test('report limits leave room for original, translation and multipart overhead',()=>{
 assert.equal(REPORT_FILE_MAX_BYTES,8*MiB);
 assert.equal(REPORT_REQUEST_MAX_BYTES,17*MiB);
 assert.ok(REPORT_REQUEST_MAX_BYTES>2*REPORT_FILE_MAX_BYTES);
});

test('donor media limits align with the server request ceiling',()=>{
 assert.equal(DONOR_MEDIA_MAX_ITEMS,10);
 assert.equal(DONOR_IMAGE_MAX_BYTES,5*MiB);
 assert.equal(DONOR_PDF_MAX_BYTES,8*MiB);
 assert.equal(DONOR_VIDEO_MAX_BYTES,50*MiB);
 assert.equal(DONOR_MEDIA_BATCH_MAX_BYTES,100*MiB);
 assert.equal(DONOR_MEDIA_REQUEST_MAX_BYTES,105*MiB);
 assert.ok(DONOR_MEDIA_REQUEST_MAX_BYTES>DONOR_MEDIA_BATCH_MAX_BYTES);
});

test('user-facing MB copy is derived from the constants',()=>{
 assert.equal(limitMB(REPORT_FILE_MAX_BYTES),'8');
 assert.equal(limitMB(DONOR_MEDIA_BATCH_MAX_BYTES),'100');
 assert.equal(limitMB(DONOR_VIDEO_MAX_BYTES),'50');
});

test('server modules reuse the same constants instead of hardcoding them',()=>{
 assert.equal(RE_EXPORTED_ITEMS,DONOR_MEDIA_MAX_ITEMS);
 assert.equal(RE_EXPORTED_BATCH,DONOR_MEDIA_BATCH_MAX_BYTES);
 assert.equal(classifyUpload('x.png','image/png',new Uint8Array(REPORT_FILE_MAX_BYTES+1)),null);
});
