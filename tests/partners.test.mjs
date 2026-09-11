import test from 'node:test';
import assert from 'node:assert/strict';
import {assertPartnerKind,canBindPartner,normalizePartnerId} from '../lib/partners.ts';

test('assertPartnerKind accepts ivf and postpartum',()=>{
 assert.equal(assertPartnerKind('ivf'),'ivf');
 assert.equal(assertPartnerKind('postpartum'),'postpartum');
});

test('assertPartnerKind rejects unknown kinds',()=>{
 assert.throws(()=>assertPartnerKind('clinic'),/PARTNER_KIND_INVALID/);
 assert.throws(()=>assertPartnerKind(''),/PARTNER_KIND_INVALID/);
});

test('canBindPartner allows active partner matching slot kind',()=>{
 assert.deepEqual(canBindPartner({kind:'ivf',status:'active'},'ivf'),{ok:true});
 assert.deepEqual(canBindPartner({kind:'postpartum',status:'active'},'postpartum'),{ok:true});
});

test('canBindPartner rejects kind mismatch',()=>{
 assert.deepEqual(canBindPartner({kind:'postpartum',status:'active'},'ivf'),{ok:false,code:'PARTNER_KIND_MISMATCH'});
 assert.deepEqual(canBindPartner({kind:'ivf',status:'active'},'postpartum'),{ok:false,code:'PARTNER_KIND_MISMATCH'});
});

test('canBindPartner rejects inactive partner',()=>{
 assert.deepEqual(canBindPartner({kind:'ivf',status:'inactive'},'ivf'),{ok:false,code:'PARTNER_INACTIVE'});
 assert.deepEqual(canBindPartner({kind:'postpartum',status:'inactive'},'postpartum'),{ok:false,code:'PARTNER_INACTIVE'});
});

test('canBindPartner allows null partner for clearing',()=>{
 assert.deepEqual(canBindPartner(null,'ivf'),{ok:true});
 assert.deepEqual(canBindPartner(null,'postpartum'),{ok:true});
});

test('normalizePartnerId maps empty values to null',()=>{
 assert.equal(normalizePartnerId(null),null);
 assert.equal(normalizePartnerId(''),null);
 assert.equal(normalizePartnerId('   '),null);
});

test('normalizePartnerId returns trimmed non-empty strings',()=>{
 assert.equal(normalizePartnerId('p-123'),'p-123');
 assert.equal(normalizePartnerId('  p-456  '),'p-456');
});
