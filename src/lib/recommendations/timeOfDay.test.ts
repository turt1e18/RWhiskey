import test from 'node:test';
import assert from 'node:assert/strict';
import {timeOfDay} from './timeOfDay';

const at=(h:number,m=0)=>new Date(2026,10,14,h,m);

test('each hour falls in one of four scenes with the documented boundaries',()=>{
  assert.equal(timeOfDay(at(4,59)),'NIGHT');
  assert.equal(timeOfDay(at(5)),'DAWN');
  assert.equal(timeOfDay(at(7,59)),'DAWN');
  assert.equal(timeOfDay(at(8)),'DAY');
  assert.equal(timeOfDay(at(16,59)),'DAY');
  assert.equal(timeOfDay(at(17)),'SUNSET');
  assert.equal(timeOfDay(at(18,59)),'SUNSET');
  assert.equal(timeOfDay(at(19)),'NIGHT');
  assert.equal(timeOfDay(at(0)),'NIGHT');
});
