import test from 'node:test';
import assert from 'node:assert/strict';
import {alertRecipients,profileSubmittedAlert,questionAlert} from '../lib/alerts.ts';

test('question alerts go to case coordinators, and profile alerts go to admin emails when nobody is assigned',()=>{
 assert.deepEqual(alertRecipients(['Coord@test.invalid','coord@test.invalid'],['owner@test.invalid']),['coord@test.invalid']);
 assert.deepEqual(alertRecipients([],['owner@test.invalid','']),['owner@test.invalid']);
 assert.deepEqual(alertRecipients(['not-an-email'],[]),[]);
});
test('alert text names the event and leaves out the message body',()=>{
 const profile=profileSubmittedAlert('Ada');
 assert.match(profile.subject,/profile/i);
 assert.match(profile.text,/Ada/);
 const question=questionAlert('FL-1');
 assert.match(question.subject,/FL-1/);
 assert.equal(question.text.includes('secret symptom'),false);
});
