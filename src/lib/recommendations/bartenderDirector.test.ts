import test from 'node:test';
import assert from 'node:assert/strict';
import ACTS from './bartenderActs.json';
import {EXIT,EXIT_GAP,WALK_GAP,HOME,INTRO,SHELF,START_STATE,actLength,nextBundle,seeded,type ActName,type BundleKind,type SceneState} from './bartenderDirector';

const acts=Object.keys(ACTS.acts) as ActName[];

test('every act uses known frames and starts/ends on a resting pose so any order joins without a jump',()=>{
  const rest=new Set(['E01','P01']);
  for(const name of acts){
    const frames=ACTS.acts[name].frames.map(([f])=>String(f));
    frames.forEach(f=>assert.ok(ACTS.frames.includes(f),`${name}: unknown frame ${f}`));
    const def=ACTS.acts[name] as {loop?:boolean;transition?:boolean};
    if(!def.loop&&!def.transition&&name!=='rest'){assert.ok(rest.has(frames[0]),`${name} starts on ${frames[0]}`);assert.ok(rest.has(frames[frames.length-1]),`${name} ends on ${frames.at(-1)}`);}
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
  const rand=seeded(42);let last:BundleKind|null=null;
  for(let i=0;i<80;i++){const b=nextBundle(rand,last,{walk:i%2===0,sinceExit:i%5});
    if(b.kind==='wipe')assert.equal(state.glass,true,'a wipe must start with a glass on the counter');
    apply(b.steps);assert.equal(state.glass,true,'every bundle leaves the glass on the counter');last=b.kind;}
});

test('weights and rules: no idle twice in a row, wipes dominate, same seed same order',()=>{
  const run=(seed:number)=>{const r=seeded(seed);let last:BundleKind|null=null;return Array.from({length:400},()=>{const b=nextBundle(r,last);last=b.kind;return b.kind;});};
  const kinds=run(7);
  for(let i=1;i<kinds.length;i++)assert.ok(!(kinds[i]==='idle'&&kinds[i-1]==='idle'));
  const wipes=kinds.filter(k=>k==='wipe').length/kinds.length;
  assert.ok(wipes>0.6&&wipes<0.85,`wipe share ${wipes}`);
  assert.deepEqual(run(7),kinds);
});

test('walking bundles start and end at home, reach the shelf or leave the scene, and never run without walk permission',()=>{
  const rand=seeded(3);let last:BundleKind|null=null,sinceExit=EXIT_GAP,sinceWalk=WALK_GAP,bucket=false,carried=0;const seen=new Set<BundleKind>();
  for(let i=0;i<300;i++){
    const b=nextBundle(rand,last,{walk:true,sinceExit,sinceWalk,bucket});seen.add(b.kind);
    const walks=b.kind==='arrange'||b.kind==='exit';if(walks)assert.ok(sinceWalk>=WALK_GAP,`walked after only ${sinceWalk} bundles`);sinceWalk=walks?0:sinceWalk+1;
    if(b.steps.some(s=>s.act==='walkRB')){assert.equal(bucket,false,'only fetch ice while none is on the counter');carried++;}
    b.steps.forEach(s=>s.events.forEach(([,set])=>{if(set.bucket)bucket=true;}));
    // every walk is wrapped by a 3/4 turn before and a face-front after
    b.steps.forEach((s,k)=>{if(s.to!==undefined){assert.match(b.steps[k-1].act,/^turn[RL]$/);assert.match(b.steps[k+1].act,/^(face[RL]|setDown)$/);}});
    let x=HOME;
    for(const s of b.steps){if(s.to!==undefined){
      assert.ok(s.to>x?(s.act==='walkR'||s.act==='walkRB'):s.act==='walkL',`${b.kind}: walking ${s.act} from ${x} to ${s.to}`);
      assert.equal(s.ms,Math.abs(s.to-x)/2*100,'one 100ms frame per 2px');x=s.to;}}
    assert.equal(x,HOME,`${b.kind} ends at home`);
    if(b.kind==='arrange')assert.ok(b.steps.some(s=>s.to===SHELF)&&b.steps.some(s=>s.act==='arrange'));
    if(b.kind==='exit'){assert.ok(sinceExit>=EXIT_GAP,`exit after only ${sinceExit} bundles`);assert.ok(b.steps.some(s=>s.to===EXIT));sinceExit=0;}else sinceExit++;
    last=b.kind;
  }
  assert.deepEqual([...seen].sort(),['arrange','exit','idle','wipe']);
  assert.equal(carried,1,'the bucket is fetched once and then stays on the counter');
  const narrow=seeded(3);for(let i=0;i<200;i++){const k=nextBundle(narrow,null,{walk:false}).kind;assert.ok(k==='wipe'||k==='idle',k);}
});
