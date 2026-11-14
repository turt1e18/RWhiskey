import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BarAmbience, { PixelBartender, TimeWindow } from '@/components/recommendations/BarAmbience';

// Enlarged preview of the result-screen ambience; the page renders these at 54-108px.
function Preview() {
  return <div className="flex min-h-screen flex-col items-center gap-10 bg-[#1a120d] p-10 text-stone-300">
    <div className="w-full">
      <BarAmbience/>
      <div className="mx-auto h-24 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#e5d5b7] lg:max-w-[864px]"/>
    </div>
    <PixelBartender className="h-[360px] w-[320px]"/>
    <div className="flex flex-wrap justify-center gap-6">
      {(['DAWN', 'DAY', 'SUNSET', 'NIGHT'] as const).map(t => <figure key={t} className="text-center text-xs">
        <TimeWindow time={t} className="h-[200px] w-[240px]"/><figcaption className="mt-2">{t}</figcaption></figure>)}
    </div>
  </div>;
}

const meta = { id: 'whiskey-bar-ambience', title: '위스키/결과 화면 분위기 장식', component: Preview } satisfies Meta<typeof Preview>;
export default meta;
export const Enlarged: StoryObj<typeof meta> = { name: '확대 보기 · 바텐더와 시간대별 창문' };
