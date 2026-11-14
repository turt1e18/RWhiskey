"use client";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {timeOfDay,type TimeOfDay} from '@/lib/recommendations/timeOfDay';
import "./pixelBarFrames.css";
import "./barAmbience.css";

// Layers come from scripts/pixel-bar/build.mjs (public/pixel-bar). Positions are in source pixels of the 288x56 scene.
const SRC='/pixel-bar/';
const SKY_AT={x:51,y:7};
const TIMES:TimeOfDay[]=['MORNING','DAY','EVENING','NIGHT'];

/** Place a layer at source-pixel coordinates; the scene multiplies everything by the integer --px. */
const at=(x:number,y:number,w:number):CSSProperties=>({left:`calc(${x}px * var(--px))`,top:`calc(${y}px * var(--px))`,width:`calc(${w}px * var(--px))`});

function Layer({name,x,y,w,className=''}:{name:string;x:number;y:number;w:number;className?:string}) {
  // eslint-disable-next-line @next/next/no-img-element -- decorative pixel art must not be resampled by the image optimizer
  return <img src={`${SRC}${name}.png`} alt="" draggable={false} decoding="async" className={`pxbar-layer ${className}`} style={at(x,y,w)}/>;
}

/** Read the device clock after mount, then again every 15 minutes or when the tab comes back. */
function useTimeOfDay(fixed?:TimeOfDay):TimeOfDay|null {
  const [value,setValue]=useState<TimeOfDay|null>(null);
  useEffect(()=>{
    if(fixed){setValue(fixed);return;}
    const update=()=>setValue(timeOfDay(new Date()));
    update();
    const timer=window.setInterval(update,15*60_000);
    const onVisible=()=>{if(document.visibilityState==='visible')update();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);};
  },[fixed]);
  return value;
}

/**
 * 결과 카드 바로 위의 픽셀 바 장면. 뒷벽(창문·잔 걸이·조명·병 선반)·바텐더·카운터를 레이어 이미지로 겹친다.
 * 원본 288×56을 정수 배로만 키운다: 1024px 이상은 3배(카드 864px과 같은 너비), 그보다 좁으면 2배로 키우고 창문~바텐더 구간만 보이게 자른다.
 * 서버 렌더와 시각이 다를 수 있어 시간대 장면은 마운트 뒤에 서서히 나타난다. 읽을 내용이 없는 장식이라 보조기술·클릭에서 빠진다.
 * `time`은 미리보기에서 장면을 고정할 때만 쓴다.
 */
export default function BarAmbience({time:fixed}:{time?:TimeOfDay}) {
  const time=useTimeOfDay(fixed);
  const view=useRef<HTMLDivElement>(null);
  const [settled,setSettled]=useState(false);
  useEffect(()=>{if(time&&!settled){const t=window.setTimeout(()=>setSettled(true),700);return ()=>window.clearTimeout(t);}},[time,settled]);
  // Stop the loops while the scene is scrolled out of view.
  useEffect(()=>{
    const el=view.current;if(!el||typeof IntersectionObserver==='undefined')return;
    const io=new IntersectionObserver(([entry])=>{el.toggleAttribute('data-paused',!entry.isIntersecting);});
    io.observe(el);return ()=>io.disconnect();
  },[]);
  return <div aria-hidden="true" className="pointer-events-none mx-auto w-full max-w-md select-none px-4 lg:max-w-4xl">
    <div ref={view} className="pxbar-view" data-time={time?.toLowerCase()} data-settled={settled||undefined}>
      <div className="pxbar-scene">
        <Layer name="back" x={0} y={0} w={288}/>
        <Layer name="window-glass" x={SKY_AT.x} y={SKY_AT.y} w={42}/>
        {TIMES.map(t=><Layer key={t} name={`sky-${t.toLowerCase()}`} x={SKY_AT.x} y={SKY_AT.y} w={42} className={`pxbar-time pxbar-on-${t.toLowerCase()}`}/>)}
        <Layer name="sky-night-lights" x={SKY_AT.x} y={SKY_AT.y} w={42} className="pxbar-time pxbar-on-night"/>
        {/* The wrapper owns visibility; the twinkle animation on the stars would otherwise override it. */}
        <div className="pxbar-box pxbar-time pxbar-on-night" style={{...at(SKY_AT.x,SKY_AT.y,42),height:'calc(26px * var(--px))'}}>
          <Layer name="stars-a" x={0} y={0} w={42} className="pxbar-twinkle"/>
          <Layer name="stars-b" x={0} y={0} w={42} className="pxbar-twinkle pxbar-twinkle-late"/>
        </div>
        <div className="pxbar-box pxbar-time pxbar-on-morning pxbar-on-day" style={{...at(SKY_AT.x,SKY_AT.y,42),height:'calc(26px * var(--px))'}}>
          <Layer name="clouds" x={0} y={1} w={84} className="pxbar-drift"/>
        </div>
        <Layer name="window-frame" x={46} y={4} w={52}/>
        {(['morning','day','evening'] as const).map(t=><Layer key={t} name={`spill-${t}`} x={0} y={0} w={288} className={`pxbar-time pxbar-on-${t}`}/>)}
        <div className="pxbar-box" style={{...at(124,0,40),height:'calc(44px * var(--px))'}}>
          <Layer name="bartender" x={0} y={0} w={520} className="pxbar-bartender"/>
        </div>
        <Layer name="counter" x={0} y={40} w={288}/>
        <Layer name="lamp-light" x={0} y={0} w={288} className="pxbar-lamp"/>
      </div>
    </div>
  </div>;
}
