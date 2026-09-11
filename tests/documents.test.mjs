import test from 'node:test';
import assert from 'node:assert/strict';
import {
 DOCUMENT_KINDS,
 DOCUMENT_STATUSES,
 assertDocumentKind,
 assertDocumentStatus,
 normalizeStatusDate,
 projectDocument,
 sortDocuments,
 documentSeedRows
} from '../lib/documents.ts';

test('assertDocumentKind accepts the four fixed kinds',()=>{
 for(const kind of DOCUMENT_KINDS)assert.equal(assertDocumentKind(kind),kind);
 assert.deepEqual(DOCUMENT_KINDS,['birth_certificate','parentage','notarisation','apostille']);
});

test('assertDocumentKind rejects unknown kinds',()=>{
 assert.throws(()=>assertDocumentKind('passport'),/DOCUMENT_KIND_INVALID/);
 assert.throws(()=>assertDocumentKind(''),/DOCUMENT_KIND_INVALID/);
});

test('assertDocumentStatus accepts the four statuses',()=>{
 for(const status of DOCUMENT_STATUSES)assert.equal(assertDocumentStatus(status),status);
 assert.deepEqual(DOCUMENT_STATUSES,['not_started','in_progress','complete','blocked']);
});

test('assertDocumentStatus rejects unknown statuses',()=>{
 assert.throws(()=>assertDocumentStatus('done'),/DOCUMENT_STATUS_INVALID/);
 assert.throws(()=>assertDocumentStatus(''),/DOCUMENT_STATUS_INVALID/);
});

test('normalizeStatusDate maps empty values to null',()=>{
 assert.equal(normalizeStatusDate(null),null);
 assert.equal(normalizeStatusDate(''),null);
 assert.equal(normalizeStatusDate('   '),null);
});

test('normalizeStatusDate returns a valid YYYY-MM-DD literal',()=>{
 assert.equal(normalizeStatusDate('2026-09-11'),'2026-09-11');
});

test('normalizeStatusDate rejects invalid dates',()=>{
 assert.throws(()=>normalizeStatusDate('2026-13-01'),/INVALID_DATE/);
 assert.throws(()=>normalizeStatusDate('11-09-2026'),/INVALID_DATE/);
});

test('projectDocument hides notes from clients and reviewers',()=>{
 const row={kind:'apostille',status:'in_progress',status_date:'2026-09-01',notes:'内部备注',updated_at:'2026-09-11T00:00:00.000Z'};
 assert.deepEqual(projectDocument(row,false),{kind:'apostille',status:'in_progress',status_date:'2026-09-01'});
});

test('projectDocument includes notes for case managers',()=>{
 const row={kind:'parentage',status:'complete',status_date:'2026-08-01',notes:'已核对',updated_at:'2026-09-10T12:00:00.000Z'};
 assert.deepEqual(projectDocument(row,true),{kind:'parentage',status:'complete',status_date:'2026-08-01',notes:'已核对',updated_at:'2026-09-10T12:00:00.000Z'});
});

test('sortDocuments uses the fixed kind order',()=>{
 const rows=[{kind:'apostille'},{kind:'birth_certificate'},{kind:'notarisation'},{kind:'parentage'}];
 assert.deepEqual(sortDocuments(rows).map(r=>r.kind),['birth_certificate','parentage','notarisation','apostille']);
});

test('documentSeedRows writes four not_started rows',()=>{
 const rows=documentSeedRows('case-1','2026-09-11T00:00:00.000Z');
 assert.equal(rows.length,4);
 assert.deepEqual(rows.map(r=>r.kind),['birth_certificate','parentage','notarisation','apostille']);
 assert.ok(rows.every(r=>r.case_id==='case-1'&&r.status==='not_started'&&r.status_date===null&&r.notes===''&&r.updated_at==='2026-09-11T00:00:00.000Z'&&r.updated_by===null));
});
