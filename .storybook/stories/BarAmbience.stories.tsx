import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BarAmbience from '@/components/recommendations/BarAmbience';

// Seoul wall-clock moments on 15 June (sunrise 05:12, sunset 19:55) pinning each sky phase.
const at = (h: number, m = 0) => new Date(Date.UTC(2026, 5, 15, h - 9, m));
const PHASES: [string, Date][] = [
  ['새벽 04:40', at(4, 40)], ['아침 06:10', at(6, 10)], ['낮 13:00', at(13)],
  ['골든아워 18:50', at(18, 50)], ['노을 19:50', at(19, 50)], ['밤 22:30', at(22, 30)],
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
