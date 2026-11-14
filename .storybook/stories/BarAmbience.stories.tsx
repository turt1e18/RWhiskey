import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BarAmbience from '@/components/recommendations/BarAmbience';

// The real result-screen band at each time of day, plus the bartender sheet enlarged frame by frame.
function Preview() {
  return <div className="min-h-screen space-y-8 bg-[#1a120d] py-8 text-xs text-stone-300">
    {(['MORNING', 'DAY', 'EVENING', 'NIGHT'] as const).map(t => <figure key={t}>
      <figcaption className="mb-2 text-center">{t}</figcaption>
      <BarAmbience time={t}/>
      <div className="mx-auto h-16 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#e5d5b7] lg:max-w-[864px]"/>
    </figure>)}
    <figure className="px-4">
      <figcaption className="mb-2 text-center">바텐더 13프레임 (P01–P12, B01) · 6배</figcaption>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/pixel-bar/bartender.png" alt="" className="mx-auto w-[3120px] max-w-none" style={{ imageRendering: 'pixelated' }}/>
    </figure>
  </div>;
}

const meta = { id: 'whiskey-bar-ambience', title: '위스키/결과 화면 바 장면', component: Preview, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof Preview>;
export default meta;
export const AllTimes: StoryObj<typeof meta> = { name: '시간대별 장면과 바텐더 프레임' };
