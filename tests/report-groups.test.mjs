import test from 'node:test';
import assert from 'node:assert/strict';
import {groupReports} from '../lib/report-groups.ts';
test('reports group by newest cycle then date without changing source order',()=>{
 const rows=[{id:'a',cycle:1,report_date:'2026-09-08'},{id:'b',cycle:2,report_date:'2026-09-09'},{id:'c',cycle:1,report_date:'2026-09-09'}];
 const groups=groupReports(rows);
 assert.deepEqual(groups.map(g=>[g.cycle,g.reports.map(r=>r.id)]),[[2,['b']],[1,['c','a']]]);
 assert.deepEqual(rows.map(r=>r.id),['a','b','c']);
});
