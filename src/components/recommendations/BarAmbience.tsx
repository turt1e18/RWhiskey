"use client";
import {useEffect,useId,useState} from 'react';
import {timeOfDay,type TimeOfDay} from '@/lib/recommendations/timeOfDay';
import "./barAmbience.css";

// Pixel art drawn from character grids; each character is one pixel of the listed colour.
const PALETTE:Record<string,string>={h:'#2d2017',s:'#c99872',e:'#1a120d',w:'#efe2c9',b:'#7a2e22',v:'#5a4232',
  g:'#d8d3c4',l:'#8f8a7c',a:'#c98a2e',c:'#f4f1ea',k:'#6b4a33',K:'#2d2017'};
const BARTENDER=[
  '......hhhhh.....',
  '.....hhhhhhh....',
  '.....hsssssh....',
  '.....hsesesh....',
  '......sssss.....',
  '......shhhs.....',
  '.......sss......',
  '.....wwbbbww....',
  '....vvwwbwwvv...',
  '...vvvvwwwvvvv..',
  '..vvvvvwwwvvvvv.',
  '..vvvvgggggvvvv.',
  '..vvvvglllgvvvv.',
  '..vvvvgaaagvvvv.',
  '...ss..ggg..ss..',
  'kkkkkkkkkkkkkkkk',
  'KKKKKKKKKKKKKKKK',
  'KKKKKKKKKKKKKKKK',
];
const BODY_ROWS=15; // rows above the bartender's own counter; the scene draws one shared counter instead
// Cloth position per frame: right of the glass, over the rim, inside, left of the glass.
const CLOTH:[number,number][][]=[
  [[11,11],[12,11],[12,12],[13,11]],
  [[10,6],[10,7],[10,8],[10,9],[10,10],[11,7],[11,8],[11,9]],
  [[12,7],[12,8],[12,9]],
  [[11,5],[12,5],[12,4],[13,5]],
];

/** Horizontal runs of the same colour become one rect, keeping the SVG small. */
function Pixels({rows,dx=0,dy=0}:{rows:string[];dx?:number;dy?:number}) {
  return <>{rows.flatMap((row,y)=>{
    const out:JSX.Element[]=[];
    for(let x=0;x<row.length;) {
      const ch=row[x];let end=x+1;
      while(end<row.length&&row[end]===ch)end++;
      if(PALETTE[ch])out.push(<rect key={`${y}-${x}`} x={x+dx} y={y+dy} width={end-x} height={1} fill={PALETTE[ch]}/>);
      x=end;
    }
    return out;
  })}</>;
}

function frame(i:number,rows=BARTENDER.length):string[] {
  const grid=BARTENDER.slice(0,rows).map(r=>r.split(''));
  CLOTH[i].forEach(([y,x])=>{if(y<rows)grid[y][x]='c';});
  return grid.map(r=>r.join(''));
}

/** Four frames side by side; the CSS animation slides one 16px cell at a time inside a clipping viewport. */
function BartenderFrames({rows}:{rows:number}) {
  return <g className="bt-wipe">{[0,1,2,3].map(i=><Pixels key={i} rows={frame(i,rows)} dx={i*16}/>)}</g>;
}

/** 잔을 닦는 픽셀 바텐더(단독 미리보기용). */
export function PixelBartender({className=''}:{className?:string}) {
  return <svg viewBox="0 0 16 18" shapeRendering="crispEdges" aria-hidden="true" focusable="false" className={className}>
    <BartenderFrames rows={BARTENDER.length}/>
  </svg>;
}

type Scene={sky:string[];city:string;dim:number};
const SCENES:Record<TimeOfDay,Scene>={
  DAWN:{sky:['#2b2a4a','#5a4a6a','#b77f7a','#e6a27a'],city:'#3a3550',dim:0.2},
  DAY:{sky:['#5f7f99','#7d98ad','#9fb3bf','#b9c6c8'],city:'#6d7f8c',dim:0.35},
  SUNSET:{sky:['#3a2340','#7a3b4a','#c4643f','#e89b4a'],city:'#4a2a3a',dim:0.15},
  NIGHT:{sky:['#0f1424','#141b30','#1b2440','#24304f'],city:'#0b0e18',dim:0},
};
// Building silhouettes along the bottom of the sky: [x, top y, width].
const CITY:[number,number,number][]=[[2,13,5],[7,15,4],[11,14,2],[13,12,4],[17,14,5]];
const LIT:[number,number][]=[[4,15],[8,16],[14,14],[15,16],[19,15]];

/** Read the device clock after mount, then again every 15 minutes or when the tab comes back. */
function useTimeOfDay():TimeOfDay|null {
  const [value,setValue]=useState<TimeOfDay|null>(null);
  useEffect(()=>{
    const update=()=>setValue(timeOfDay(new Date()));
    update();
    const timer=window.setInterval(update,15*60_000);
    const onVisible=()=>{if(document.visibilityState==='visible')update();};
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',onVisible);};
  },[]);
  return value;
}

/** Window drawn in its own 24x20 grid; `time` null draws only the frame (before the clock is read). */
function WindowArt({time,clip}:{time:TimeOfDay|null;clip:string}) {
  return <>
    <rect x={0} y={0} width={24} height={18} fill="#4a3728"/>
    {time&&<>
      <clipPath id={clip}><rect x={2} y={2} width={20} height={16}/></clipPath>
      <g clipPath={`url(#${clip})`}>
        {SCENES[time].sky.map((c,i)=><rect key={c} x={2} y={2+i*4} width={20} height={4} fill={c}/>)}
        {time==='DAWN'&&<rect x={17} y={13} width={2} height={2} fill="#f2c27a"/>}
        {time==='DAY'&&<rect x={17} y={4} width={2} height={2} fill="#f4e3b5"/>}
        {time==='SUNSET'&&<rect x={15} y={12} width={3} height={3} fill="#f0a04b"/>}
        {time==='NIGHT'&&<>
          <rect x={16} y={4} width={2} height={2} fill="#e8dcc6"/>
          {([[4,4,'0s'],[8,6,'1.3s'],[14,3,'2.6s'],[20,8,'0.7s']] as const).map(([x,y,d])=>
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#e8dcc6" className="amb-twinkle" style={{animationDelay:d}}/>)}
        </>}
        {(time==='DAY'||time==='DAWN')&&<g className="amb-drift" fill="#d9d4c7" opacity={0.8}>
          <rect x={3} y={6} width={4} height={1}/><rect x={2} y={7} width={7} height={1}/>
        </g>}
        {CITY.map(([x,y,w])=><rect key={x} x={x} y={y} width={w} height={18-y} fill={SCENES[time].city}/>)}
        {time==='NIGHT'&&LIT.map(([x,y])=><rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#ffb247" opacity={0.85}/>)}
        {/* Seen from inside a dim bar: daylight is pressed down so it never outshines the card. */}
        {SCENES[time].dim>0&&<rect x={2} y={2} width={20} height={16} fill="#1a120d" opacity={SCENES[time].dim}/>}
      </g>
    </>}
    <rect x={11} y={2} width={2} height={16} fill="#2d2017"/>
    <rect x={2} y={9} width={20} height={1} fill="#2d2017"/>
    <rect x={0} y={18} width={24} height={2} fill="#6b4a33"/>
  </>;
}

/** 시간대에 따라 바깥 풍경이 바뀌는 창문(단독 미리보기용). */
export function TimeWindow({className='',time:fixed}:{className?:string;time?:TimeOfDay}) {
  // `time` pins a scene for previews; the page always follows the device clock.
  const clock=useTimeOfDay();
  const clip=useId();
  return <svg viewBox="0 0 24 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false" className={className}>
    <WindowArt time={fixed??clock} clip={clip}/>
  </svg>;
}

// Back-bar shelf bottles: [x, bottom y, body width, body height, colour].
const BOTTLES:[number,number,number,number,string][]=[
  [99,8,3,5,'#7a4a22'],[104,8,2,4,'#3d5a3a'],[108,8,3,6,'#8a6a3a'],[113,8,2,5,'#5a2e2e'],[117,8,3,4,'#7a4a22'],
  [123,8,3,5,'#4a3a2a'],[128,8,2,6,'#8a6a3a'],[132,8,3,4,'#3d5a3a'],[137,8,3,5,'#7a4a22'],[143,8,2,4,'#5a2e2e'],[147,8,3,6,'#8a6a3a'],
  [100,16,3,4,'#8a6a3a'],[105,16,3,6,'#5a2e2e'],[110,16,2,5,'#7a4a22'],[114,16,3,4,'#3d5a3a'],[120,16,3,5,'#8a6a3a'],
  [126,16,2,4,'#7a4a22'],[130,16,3,6,'#4a3a2a'],[135,16,3,5,'#8a6a3a'],[140,16,2,4,'#3d5a3a'],[145,16,3,5,'#7a4a22'],
];
// Upside-down glasses hanging from a rack: [x].
const GLASSES=[47,50,53,56];
const COUNTER_Y=21;

/**
 * 결과 카드 바로 위의 바 장면 한 줄: 뒷벽(창문·잔 걸이·병 선반·조명) 앞 카운터에 바텐더가 서 있다.
 * 카드와 같은 너비로 그려 카운터 끝이 카드 끝과 맞고, 카드는 그 카운터 앞에 놓인 영수증처럼 보인다.
 * 읽을 내용이 없는 장식이라 보조기술과 클릭에서 모두 빠진다.
 */
export default function BarAmbience() {
  const time=useTimeOfDay();
  const id=useId();
  return <div aria-hidden="true" className="pointer-events-none mx-auto w-full max-w-md select-none px-4 lg:max-w-4xl">
    <svg viewBox="0 0 160 28" shapeRendering="crispEdges" focusable="false" className="block h-auto w-full">
      <defs>
        <radialGradient id={`${id}-glow`} cx={84} cy={6} r={24} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffb247" stopOpacity={0.22}/><stop offset="1" stopColor="#ffb247" stopOpacity={0}/>
        </radialGradient>
        <linearGradient id={`${id}-fade`} x1={0} y1={0} x2={0} y2={1}>
          <stop offset="0" stopColor="#1a120d" stopOpacity={1}/><stop offset="1" stopColor="#1a120d" stopOpacity={0}/>
        </linearGradient>
        <linearGradient id={`${id}-side`} x1={0} y1={0} x2={1} y2={0}>
          <stop offset="0" stopColor="#1a120d" stopOpacity={1}/><stop offset="1" stopColor="#1a120d" stopOpacity={0}/>
        </linearGradient>
        <clipPath id={`${id}-bt`}><rect x={64} y={COUNTER_Y-BODY_ROWS} width={16} height={BODY_ROWS}/></clipPath>
      </defs>
      {/* Back wall with faint panel seams. */}
      <rect x={0} y={0} width={160} height={COUNTER_Y} fill="#24180f"/>
      {Array.from({length:10},(_,i)=><rect key={i} x={i*16+15} y={0} width={1} height={COUNTER_Y} fill="#1d130c"/>)}
      <g transform="translate(16 1)"><WindowArt time={time} clip={`${id}-win`}/></g>
      {/* Glass rack. */}
      <rect x={45} y={2} width={14} height={1} fill="#6b4a33"/>
      {GLASSES.map(x=><g key={x} fill="#d8d3c4" opacity={0.75}><rect x={x} y={3} width={1} height={1}/><rect x={x-1} y={4} width={3} height={2}/></g>)}
      {/* Pendant lamp beside the bartender with a warm pool of light. */}
      <rect x={0} y={0} width={160} height={COUNTER_Y} fill={`url(#${id}-glow)`}/>
      <rect x={86} y={0} width={1} height={3} fill="#2d2017"/>
      <rect x={84} y={3} width={5} height={1} fill="#4a3728"/><rect x={83} y={4} width={7} height={1} fill="#4a3728"/>
      <rect x={85} y={5} width={3} height={1} fill="#ffcf7a"/>
      {/* Shelves and bottles. */}
      {[8,16].map(y=><g key={y}><rect x={96} y={y} width={56} height={1} fill="#6b4a33"/><rect x={96} y={y+1} width={56} height={1} fill="#1d130c"/></g>)}
      {BOTTLES.map(([x,bottom,w,h,c])=><g key={`${x}-${bottom}`} fill={c}>
        <rect x={x} y={bottom-h} width={w} height={h}/>
        <rect x={x+Math.floor(w/2)} y={bottom-h-2} width={1} height={2}/>
        <rect x={x} y={bottom-h+Math.floor(h/2)} width={w} height={1} fill="#c9b48a" opacity={0.55}/>
      </g>)}
      {/* Bartender behind the counter: only the body rows, so his hands rest on the shared counter. */}
      <g clipPath={`url(#${id}-bt)`}><g transform={`translate(64 ${COUNTER_Y-BODY_ROWS})`}><BartenderFrames rows={BODY_ROWS}/></g></g>
      {/* The wall fades into the page at the top and sides so the scene has no hard edge. */}
      <rect x={0} y={0} width={160} height={7} fill={`url(#${id}-fade)`}/>
      <rect x={0} y={0} width={8} height={COUNTER_Y} fill={`url(#${id}-side)`}/>
      <rect x={152} y={0} width={8} height={COUNTER_Y} fill={`url(#${id}-side)`} transform="rotate(180 156 10.5)"/>
      {/* Counter: lit edge, top, dark front and a brass foot rail. */}
      <rect x={0} y={COUNTER_Y} width={160} height={1} fill="#8a6243"/>
      <rect x={0} y={COUNTER_Y+1} width={160} height={2} fill="#6b4a33"/>
      <rect x={0} y={COUNTER_Y+3} width={160} height={4} fill="#2d2017"/>
      <rect x={0} y={COUNTER_Y+5} width={160} height={1} fill="#8a6a3a" opacity={0.6}/>
    </svg>
  </div>;
}
