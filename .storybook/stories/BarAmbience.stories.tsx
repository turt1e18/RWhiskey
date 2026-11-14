import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ACTS from '@/lib/recommendations/bartenderActs.json';
import BarAmbience from '@/components/recommendations/BarAmbience';

// Seoul wall-clock moments on 15 June (sunrise 05:10, sunset 19:55) pinning each sky phase.
const at = (h: number, m = 0) => new Date(Date.UTC(2026, 5, 15, h - 9, m));
const PHASES: [string, Date][] = [
  ['새벽 04:40', at(4, 40)], ['아침 06:10', at(6, 10)], ['낮 13:00', at(13)],
  ['골든아워 18:50', at(18, 50)], ['노을 19:50', at(19, 50)], ['밤 22:30', at(22, 30)],
  // Seasons and dusk blending: 15 Dec sunset is 17:15, so 17:30 is mid-sunset with snow; 10 Apr has petals.
  ['겨울 노을 12/15 17:30', new Date(Date.UTC(2026, 11, 15, 17 - 9, 30))], ['봄 낮 4/10 13:00', new Date(Date.UTC(2026, 3, 10, 13 - 9, 0))],
];

function Preview() {
  return <div className="min-h-screen space-y-8 bg-[#1a120d] py-8 text-xs text-stone-300">
    {PHASES.map(([label, now]) => <figure key={label}>
      <figcaption className="mb-2 text-center">{label} (서울)</figcaption>
      <BarAmbience now={now}/>
      <div className="mx-auto h-16 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#e5d5b7] lg:max-w-[864px]"/>
    </figure>)}
    <figure className="overflow-x-auto px-4">
      <figcaption className="mb-2 text-center">바텐더 34프레임 · 4배</figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pixel-bar/bartender.png" alt="" className="mx-auto w-[6528px] max-w-none" style={{ imageRendering: 'pixelated' }}/>
    </figure>
  </div>;
}

const meta = { id: 'whiskey-bar-ambience', title: '위스키/결과 화면 바 장면', component: Preview, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Preview>;
export default meta;
export const AllPhases: StoryObj<typeof meta> = { name: '시간대별 장면과 바텐더 프레임' };

// 2nd-stage draft: back view (turn, take a bottle, check it, put it back) and side walk, before they are wired into the scene.
const SCALE = 4, CELL = 48 * SCALE, SHEET = 48 * ACTS.frames.length * SCALE;
const DRAFT = ['T01', 'T02', 'K01', 'K02', 'K03', 'K04', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'Q1', 'QL', 'C1', 'C3', 'C5'];
function Sprite({ act, frame, run = 0 }: { act?: string; frame?: string; run?: number }) {
  return <div className="relative overflow-hidden" style={{ width: CELL, height: 44 * SCALE }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img key={run} src="/pixel-bar/bartender.png" alt="" data-act={act} className={act ? 'pxbar-bartender absolute max-w-none' : 'absolute max-w-none'}
      style={{ width: SHEET, height: 'auto', imageRendering: 'pixelated', ...(frame ? { transform: `translateX(${-ACTS.frames.indexOf(frame) * CELL}px)` } : {}) }}/>
  </div>;
}
function Draft() {
  const [run, setRun] = useState(0);
  useEffect(() => { const t = setInterval(() => setRun(r => r + 1), 3500); return () => clearInterval(t); }, []);
  return <div className="min-h-screen space-y-10 bg-[#1a120d] p-8 text-xs text-stone-300">
    <style>{`@keyframes draft-cross { 0% { transform: translateX(0) } 48% { transform: translateX(560px) } 50% { transform: translateX(560px) scaleX(-1) } 98% { transform: translateX(0) scaleX(-1) } 100% { transform: translateX(0) } }
      .draft-cross { animation: draft-cross 14s steps(140) infinite; }`}</style>
    <section><h2 className="mb-3 text-sm">정지 프레임 (4배)</h2>
      <div className="flex flex-wrap gap-3">{DRAFT.map(f => <figure key={f} className="text-center"><Sprite frame={f}/><figcaption className="mt-1">{f}</figcaption></figure>)}</div>
    </section>
    <section><h2 className="mb-3 text-sm">돌아서서 병 정리 (arrange, 3.5초마다 반복)</h2><Sprite act="arrange" run={run}/></section>
    <section><h2 className="mb-3 text-sm">옆걸음 (walk, 오른쪽 → 왼쪽은 좌우 반전)</h2>
      <div className="relative h-[176px] w-[760px] overflow-hidden border-b-8 border-[#6b4a33]"><div className="draft-cross absolute left-0 top-0"><Sprite act="walk"/></div></div>
    </section>
  </div>;
}
export const SecondStageDraft: StoryObj<typeof meta> = { name: '2차 시안 · 뒷모습·병 정리·옆걸음', render: () => <Draft/> };
