import test from 'node:test';
import assert from 'node:assert/strict';
import {timeOfDay} from './timeOfDay';

const at=(h:number,m=0)=>new Date(2026,10,14,h,m);

test('default ranges: morning 6, day 10, evening 17, night 20 with night wrapping past midnight',()=>{
  assert.equal(timeOfDay(at(5,59)),'NIGHT');
  assert.equal(timeOfDay(at(6)),'MORNING');
  assert.equal(timeOfDay(at(9,59)),'MORNING');
  assert.equal(timeOfDay(at(10)),'DAY');
  assert.equal(timeOfDay(at(16,59)),'DAY');
  assert.equal(timeOfDay(at(17)),'EVENING');
  assert.equal(timeOfDay(at(19,59)),'EVENING');
  assert.equal(timeOfDay(at(20)),'NIGHT');
  assert.equal(timeOfDay(at(0)),'NIGHT');
});
test('ranges are configurable',()=>{
  const ranges={MORNING:5,DAY:8,EVENING:18,NIGHT:22};
  assert.equal(timeOfDay(at(5),ranges),'MORNING');
  assert.equal(timeOfDay(at(21),ranges),'EVENING');
  assert.equal(timeOfDay(at(3),ranges),'NIGHT');
});
