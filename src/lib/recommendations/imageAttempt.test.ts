import {test} from 'node:test';
import assert from 'node:assert/strict';
import {imageFailureAction,imageAttemptWait} from './imageAttempt';
test('a failed original may use exactly one same-hit fallback within the total budget',()=>{
  assert.equal(imageFailureAction(0,true,200),'fallback');assert.equal(imageAttemptWait(1,true,200),7800);
  assert.equal(imageFailureAction(1,true,300),'unavailable');assert.equal(imageFailureAction(0,false,100),'unavailable');
});
test('a stalled original leaves four seconds for the thumbnail and never restarts eight seconds',()=>{
  assert.equal(imageAttemptWait(0,true,0),4000);assert.equal(imageFailureAction(0,true,4000),'fallback');
  assert.equal(imageAttemptWait(1,true,4000),4000);assert.equal(imageAttemptWait(1,true,7999),1);
  assert.equal(imageAttemptWait(1,true,8001),0);assert.equal(imageFailureAction(0,true,8000),'unavailable');
  assert.equal(imageAttemptWait(0,false,0),8000);
});
