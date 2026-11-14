import test from 'node:test';
import assert from 'node:assert/strict';
import {SEOUL_SUN,seoulParts,seoulSunTimes,skyPhase} from './seoulTime';

// Build a moment from Seoul wall-clock time (UTC+9, no DST) so the test does not depend on the machine's time zone.
const seoul=(m:number,d:number,h:number,min=0)=>new Date(Date.UTC(2026,m-1,d,h-9,min));

test('Seoul wall clock is used regardless of the device time zone',()=>{
  assert.deepEqual(seoulParts(seoul(1,1,0,30)),{year:2026,month:1,day:1,hour:0,minute:30});
  assert.equal(seoulParts(new Date(Date.UTC(2026,5,30,15,0))).day,1); // 15:00 UTC = 00:00 next day in Seoul
});

test('mid-month uses the table value and other days interpolate without month-edge jumps',()=>{
  assert.deepEqual(seoulSunTimes(seoul(6,15,12)),{sunrise:SEOUL_SUN[5][0],sunset:SEOUL_SUN[5][1]});
  const last=seoulSunTimes(seoul(1,31,12)),first=seoulSunTimes(seoul(2,1,12));
  assert.ok(Math.abs(last.sunset-first.sunset)<=2,`${last.sunset} vs ${first.sunset}`);
  const dec=seoulSunTimes(seoul(12,31,12)),jan=seoulSunTimes(seoul(1,1,12));
  assert.ok(Math.abs(dec.sunrise-jan.sunrise)<=2,`${dec.sunrise} vs ${jan.sunrise}`);
});

test('phases follow that day sunrise and sunset: summer evening is still golden when winter is night',()=>{
  // June 15: sunrise 05:10, sunset 19:55
  assert.equal(skyPhase(seoul(6,15,4,40)).phase,'PREDAWN');
  assert.equal(skyPhase(seoul(6,15,6,0)).phase,'MORNING');
  assert.equal(skyPhase(seoul(6,15,12,0)).phase,'DAY');
  assert.equal(skyPhase(seoul(6,15,18,40)).phase,'GOLDEN');
  assert.equal(skyPhase(seoul(6,15,19,50)).phase,'SUNSET');
  assert.equal(skyPhase(seoul(6,15,21,0)).phase,'NIGHT');
  // December 15: sunset 17:15 → 18:40 is already night
  assert.equal(skyPhase(seoul(12,15,18,40)).phase,'NIGHT');
});

test('sun moves 0→11 across the day and the moon takes over at night',()=>{
  assert.equal(skyPhase(seoul(6,15,5,12)).sunStep,0);
  assert.equal(skyPhase(seoul(6,15,12,40)).sunStep,6);
  assert.equal(skyPhase(seoul(6,15,19,54)).sunStep,11);
  const night=skyPhase(seoul(6,15,23,0));
  assert.equal(night.sunStep,null);assert.ok(night.moonStep!==null&&night.moonStep>0&&night.moonStep<11);
});

test('progress runs 0→1 inside a phase so dusk can be blended minute by minute',()=>{
  // June 15 sunset 19:55 → SUNSET 19:35–20:25, NIGHT 20:25 → next day 04:22
  assert.equal(skyPhase(seoul(6,15,19,35)).progress,0);
  assert.ok(Math.abs(skyPhase(seoul(6,15,20,0)).progress-0.5)<0.01);
  assert.ok(skyPhase(seoul(6,15,20,24)).progress>0.95);
  const lateNight=skyPhase(seoul(6,15,2,0));assert.equal(lateNight.phase,'NIGHT');assert.ok(lateNight.progress>0.6&&lateNight.progress<1);
});
