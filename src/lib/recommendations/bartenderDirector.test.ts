import test from 'node:test';
import assert from 'node:assert/strict';
import ACTS from './bartenderActs.json';
import {INTRO,START_STATE,actLength,nextBundle,seeded,type ActName,type SceneState} from './bartenderDirector';

const acts=Object.keys(ACTS.acts) as ActName[];

test('every act uses known frames and starts/ends on a resting pose so any order joins without a jump',()=>{
  const rest=new Set(['E01','P01']);
  for(const name of acts){
    const frames=ACTS.acts[name].frames.map(([f])=>String(f));
    frames.forEach(f=>assert.ok(ACTS.frames.includes(f),`${name}: unknown frame ${f}`));
    if(name!=='idle'&&name!=='rest'){assert.ok(rest.has(frames[0]),`${name} starts on ${frames[0]}`);assert.ok(rest.has(frames[frames.length-1]),`${name} ends on ${frames.at(-1)}`);}
  }
  // Holding-glass acts end on P01 only where the next act expects the glass in hand.
  assert.equal(ACTS.acts.pick.frames.at(-1)?.[0],'P01');assert.equal(ACTS.acts.wipe.frames[0][0],'P01');
  assert.equal(ACTS.acts.place.frames.at(-1)?.[0],'E01');
});

test('events fall inside their act',()=>{
  for(const name of acts){const ev=(ACTS.acts[name] as {events?:[number,unknown][]}).events??[];ev.forEach(([at])=>assert.ok(at>0&&at<actLength(name),`${name} event at ${at}`));}
});

test('intro pours to 30% then the glass state is consistent through any loop',()=>{
  let state:SceneState={...START_STATE};
  const apply=(steps:typeof INTRO)=>steps.forEach(s=>s.events.forEach(([,set])=>{state={...state,...set};}));
  apply(INTRO);assert.equal(state.liquid,3);assert.equal(state.glass,true);
  const rand=seeded(42);let last:'wipe'|'idle'|null=null;
  for(let i=0;i<50;i++){const b=nextBundle(rand,last);
    if(b.kind==='wipe')assert.equal(state.glass,true,'a wipe must start with a glass on the counter');
    apply(b.steps);assert.equal(state.glass,true,'every bundle leaves the glass on the counter');last=b.kind;}
});

test('weights and rules: no idle twice in a row, wipes dominate, same seed same order',()=>{
  const run=(seed:number)=>{const r=seeded(seed);let last:'wipe'|'idle'|null=null;return Array.from({length:400},()=>{const b=nextBundle(r,last);last=b.kind;return b.kind;});};
  const kinds=run(7);
  for(let i=1;i<kinds.length;i++)assert.ok(!(kinds[i]==='idle'&&kinds[i-1]==='idle'));
  const wipes=kinds.filter(k=>k==='wipe').length/kinds.length;
  assert.ok(wipes>0.6&&wipes<0.85,`wipe share ${wipes}`);
  assert.deepEqual(run(7),kinds);
});
