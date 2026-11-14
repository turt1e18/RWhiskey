"use client";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {seoulParts,skyPhase,type SkyPhase} from '@/lib/recommendations/seoulTime';
import {HOME,INTRO,SERVED_STATE,START_STATE,nextBundle,type ActName,type BundleKind,type SceneState,type Step} from '@/lib/recommendations/bartenderDirector';
import ACTS from '@/lib/recommendations/bartenderActs.json';
import "./pixelBarFrames.css";
import "./barAmbience.css";

// Layers come from scripts/pixel-bar/build.mjs (public/pixel-bar). Positions are source pixels of the 288x56 scene.
const SRC='/pixel-bar/';
const SKY={x:51,y:7,w:42,h:26};
const PHASES:SkyPhase[]=['PREDAWN','MORNING','DAY','GOLDEN','SUNSET','NIGHT'];
const lower=(p:SkyPhase)=>p.toLowerCase();

/** Place a layer at source-pixel coordinates; the scene multiplies everything by the integer --px. */
const at=(x:number,y:number,w:number,h?:number):CSSProperties=>({left:`calc(${x}px * var(--px))`,top:`calc(${y}px * var(--px))`,
  width:`calc(${w}px * var(--px))`,...(h===undefined?{}:{height:`calc(${h}px * var(--px))`})});

function Layer({name,x,y,w,className='',opacity,...rest}:{name:string;x:number;y:number;w:number;className?:string;opacity?:number}&Record<`data-${string}`,string>) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative pixel art must not be resampled by the image optimizer
  return <img src={`${SRC}${name}.png`} alt="" draggable={false} decoding="async" className={`pxbar-layer ${className}`} style={{...at(x,y,w),...(opacity===undefined?{}:{opacity})}} {...rest}/>;
}

/** Seoul time, re-read on each minute boundary and when the tab comes back. null until mounted (hydration safe). */
function useSeoulMinute(fixed?:Date):Date|null {
  const [now,setNow]=useState<Date|null>(null);
  useEffect(()=>{
    if(fixed){setNow(fixed);return;}
    let interval=0;
    const tick=()=>setNow(new Date());
    tick();
    const first=window.setTimeout(()=>{tick();interval=window.setInterval(tick,60_000);},60_000-Date.now()%60_000);
    const onVisible=()=>{if(document.visibilityState==='visible')tick();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{window.clearTimeout(first);window.clearInterval(interval);document.removeEventListener('visibilitychange',onVisible);};
  },[fixed]);
  return now;
}

const media=(q:string)=>typeof window!=='undefined'&&window.matchMedia(q).matches;

interface Position { x:number; ms:number }
/**
 * Runs the bartender: first the pour for the guest, then (tablet/PC) random bundles.
 * Walking to the back bar and out through the doorway only happen at 1024px+, where the whole scene is visible.
 * Phones stop after the pour; reduced motion shows the served state without movement. Stops while off screen.
 */
function useBartender(visible:boolean):{act:ActName;run:number;scene:SceneState;pos:Position} {
  const [act,setAct]=useState<ActName>('rest');
  const [run,setRun]=useState(0);
  const [scene,setScene]=useState<SceneState>(START_STATE);
  const [pos,setPos]=useState<Position>({x:HOME,ms:0});
  const introDone=useRef(false),sceneRef=useRef(scene);
  sceneRef.current=scene;
  useEffect(()=>{
    if(media('(prefers-reduced-motion: reduce)')){setAct('rest');setScene(SERVED_STATE);return;}
    if(!visible)return;
    const loop=media('(min-width: 768px)'),walk=media('(min-width: 1024px)');
    if(introDone.current&&!loop){setAct('rest');return;}
    const timers:number[]=[];
    // sinceWalk starts below the gap: no walking in the first bundles after the pour, while the result is first read.
    let queue:Step[]=introDone.current?[]:[...INTRO],last:BundleKind|null=null,sinceExit=0,sinceWalk=1;
    // Resuming mid-bundle: he is back home at rest with empty hands, so the glass is on the counter again.
    setScene(s=>introDone.current?{...s,glass:true}:START_STATE);setPos({x:HOME,ms:0});
    const next=()=>{
      if(!queue.length){
        introDone.current=true;
        if(!loop){setAct('rest');return;}
        const bundle=nextBundle(Math.random,last,{walk,sinceExit,sinceWalk,bucket:sceneRef.current.bucket});last=bundle.kind;queue=[...bundle.steps];
        sinceExit=bundle.kind==='exit'?0:sinceExit+1;
        sinceWalk=bundle.kind==='exit'||bundle.kind==='arrange'?0:sinceWalk+1;
      }
      const step=queue.shift()!;
      setAct(step.act);setRun(r=>r+1);
      if(step.to!==undefined)setPos({x:step.to,ms:step.ms});
      step.events.forEach(([ms,set])=>timers.push(window.setTimeout(()=>setScene(s=>({...s,...set})),ms)));
      timers.push(window.setTimeout(next,step.ms));
    };
    next();
    return ()=>timers.forEach(t=>window.clearTimeout(t));
  },[visible]);
  return {act,run,scene,pos};
}

/** Clock hands as pixels on the 13x13 face: hour in half-hour steps, minute in 5-minute steps (finer is not visible at this size). */
function ClockHands({hour,minute}:{hour:number;minute:number}) {
  const line=(turn:number,len:number)=>{
    const a=turn*2*Math.PI,pts=new Set<string>();
    for(let i=1;i<=len*2;i++){const r=i/2;pts.add(`${Math.round(6+Math.sin(a)*r)},${Math.round(6-Math.cos(a)*r)}`);}
    return [...pts].map(p=>p.split(',').map(Number));
  };
  const m5=Math.floor(minute/5)*5,hourTurn=((hour%12)+(minute>=30?0.5:0))/12;
  return <svg viewBox="0 0 13 13" shapeRendering="crispEdges" className="pxbar-layer" style={at(99,7,13,13)}>
    {line(m5/60,4).map(([x,y])=><rect key={`m${x}-${y}`} x={x} y={y} width={1} height={1} fill="#4a3728"/>)}
    {line(hourTurn,2.5).map(([x,y])=><rect key={`h${x}-${y}`} x={x} y={y} width={1} height={1} fill="#1a120d"/>)}
    <rect x={6} y={6} width={1} height={1} fill="#c9a46a"/>
  </svg>;
}

/** Sun/moon top-left on a shallow arc across the sky (step 0–11). */
const arc=(step:number)=>({x:Math.round(2+step*34/11)-2,y:Math.round(20-15*Math.sin(Math.PI*step/11))-2});

/**
 * 결과 카드 바로 위의 픽셀 바 장면. 서울 시각 기준 창문(월별 일출·일몰)·시계, 손님 잔에 따르고 잔을 닦는 바텐더.
 * 원본 288×56을 정수 배로만 키운다: 1024px 이상은 3배(카드 864px과 같은 너비), 그보다 좁으면 2배로 키우고 가운데만 보이게 자른다.
 * 시간·행동은 마운트 뒤에 정해 서버 렌더와 어긋나지 않는다. 읽을 내용이 없는 장식이라 보조기술·클릭에서 빠진다.
 * `now`는 미리보기에서 시각을 고정할 때만 쓴다.
 */
export default function BarAmbience({now:fixed}:{now?:Date}) {
  const now=useSeoulMinute(fixed);
  const view=useRef<HTMLDivElement>(null);
  const [visible,setVisible]=useState(false);
  const [settled,setSettled]=useState(false);
  useEffect(()=>{
    const el=view.current;if(!el)return;
    if(typeof IntersectionObserver==='undefined'){setVisible(true);return;}
    const io=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
    io.observe(el);return ()=>io.disconnect();
  },[]);
  useEffect(()=>{if(now&&!settled){const t=window.setTimeout(()=>setSettled(true),700);return ()=>window.clearTimeout(t);}},[now,settled]);
  const {act,run,scene,pos}=useBartender(visible);
  const sky=now?skyPhase(now):null,time=now?seoulParts(now):null;
  const sun=sky?.sunStep!=null?arc(sky.sunStep):null,moon=sky?.moonStep!=null&&(sky.phase==='NIGHT'||sky.phase==='PREDAWN')?arc(sky.moonStep):null;
  const lowSun=sky&&(sky.phase==='GOLDEN'||sky.phase==='SUNSET'||(sky.phase==='MORNING'&&(sky.sunStep??0)<=1));
  // Blend the next phase in minute by minute so dawn and dusk change while you watch, not in one 2s step.
  const next=sky?({PREDAWN:'MORNING',GOLDEN:'SUNSET',SUNSET:'NIGHT'} as Partial<Record<SkyPhase,SkyPhase>>)[sky.phase]:undefined;
  const blend=(p:SkyPhase)=>next===p&&sky?sky.progress:undefined;
  const season=time?(time.month===12||time.month<=2?'winter':time.month===4?'spring':undefined):undefined;
  return <div aria-hidden="true" className="pointer-events-none mx-auto w-full max-w-md select-none px-4 lg:max-w-4xl">
    <div ref={view} className="pxbar-view" data-phase={sky?lower(sky.phase):undefined} data-season={season} data-settled={settled||undefined} data-bucket={scene.bucket?'':undefined}
      data-paused={visible?undefined:''} data-glass={scene.glass?'':undefined} data-liquid={scene.liquid}>
      <div className="pxbar-scene">
        <Layer name="back" x={0} y={0} w={288}/>
        <Layer name="window-glass" x={SKY.x} y={SKY.y} w={SKY.w}/>
        <div className="pxbar-box" style={at(SKY.x,SKY.y,SKY.w,SKY.h)}>
          {PHASES.map(p=><Layer key={p} name={`sky-${lower(p)}`} x={0} y={0} w={SKY.w} className={`pxbar-time pxbar-on-${lower(p)}`} opacity={blend(p)}/>)}
          {/* The wrapper owns visibility; the twinkle animation on the stars would otherwise override it. */}
          <div className="pxbar-box pxbar-time pxbar-on-night pxbar-on-predawn" style={{...at(0,0,SKY.w,SKY.h),...(sky?.phase==='SUNSET'?{opacity:sky.progress}:{})}}>
            <Layer name="stars-a" x={0} y={0} w={SKY.w} className="pxbar-twinkle"/>
            <Layer name="stars-b" x={0} y={0} w={SKY.w} className="pxbar-twinkle pxbar-twinkle-late"/>
          </div>
          {sun&&<Layer name={lowSun?'sun-low':'sun'} x={sun.x} y={sun.y} w={5}/>}
          {moon&&<Layer name="moon" x={moon.x} y={moon.y} w={5}/>}
          <div className="pxbar-box pxbar-time pxbar-on-morning pxbar-on-day pxbar-on-golden" style={at(0,0,SKY.w,SKY.h)}>
            <Layer name="clouds" x={0} y={1} w={84} className="pxbar-drift"/>
          </div>
          {PHASES.map(p=><Layer key={p} name={`city-${lower(p)}`} x={0} y={0} w={SKY.w} className={`pxbar-time pxbar-on-${lower(p)}`} opacity={blend(p)}/>)}
          {/* City lights switch on one by one through the sunset. */}
          <Layer name="lights-early" x={0} y={0} w={SKY.w} className="pxbar-time pxbar-on-sunset pxbar-on-night pxbar-on-predawn" opacity={sky?.phase==='SUNSET'?sky.progress:undefined}/>
          <Layer name="lights-late" x={0} y={0} w={SKY.w} className="pxbar-time pxbar-on-night"/>
          {/* Seoul season: snow in December–February, a few cherry petals in April. Two tile-heights loop seamlessly. */}
          <Layer name="snow" x={0} y={0} w={SKY.w} className="pxbar-season pxbar-fall pxbar-in-winter"/>
          <Layer name="petals" x={0} y={0} w={SKY.w} className="pxbar-season pxbar-drift-down pxbar-in-spring"/>
        </div>
        <Layer name="window-frame" x={46} y={4} w={52}/>
        {(['morning','day','golden','sunset'] as const).map(p=><Layer key={p} name={`spill-${p}`} x={0} y={0} w={288} className={`pxbar-time pxbar-on-${p}`}/>)}
        <Layer name="clock-face" x={99} y={7} w={13}/>
        {time&&<ClockHands hour={time.hour} minute={time.minute}/>}
        {/* The box walks in 2px steps, one per walk frame, so the feet never slide. */}
        <div className="pxbar-box" style={{...at(pos.x,0,48,44),transition:pos.ms?`left ${pos.ms}ms steps(${Math.round(Math.abs(pos.ms)/100)},end)`:'none'}}>
          <Layer key={run} name="bartender" x={0} y={0} w={48*ACTS.frames.length} className="pxbar-bartender" data-act={act}/>
        </div>
        <Layer name="door-front" x={0} y={0} w={8}/>
        <Layer name="counter" x={0} y={40} w={288}/>
        <Layer name="counter-props" x={0} y={30} w={288}/>
        <Layer name="glass-placed" x={146} y={33} w={7} className="pxbar-placed"/>
        <Layer name="ice-bucket" x={112} y={35} w={5} className="pxbar-bucket"/>
        <div className="pxbar-box" style={at(163,33,9,9)}><Layer name="glass-guest" x={0} y={0} w={36} className="pxbar-guest"/></div>
        <Layer name="glint" x={163} y={33} w={9} className="pxbar-glint"/>
        <Layer name="lamp-light" x={0} y={0} w={288} className="pxbar-lamp"/>
      </div>
    </div>
  </div>;
}
