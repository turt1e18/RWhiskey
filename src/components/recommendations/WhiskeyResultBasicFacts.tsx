import type {ResultInformation} from '@/lib/recommendations/whiskeyResultInformation';
import WhiskeyCollectedBasicFact from './WhiskeyCollectedBasicFact';

export default function WhiskeyResultBasicFacts({display,beginner=false}:{display:ResultInformation;beginner?:boolean}) {
  const hasAbv=display.basic.some(f=>f.field==='abv'&&(f.kind==='KNOWN'||f.kind==='AI'));
  return <section aria-label="위스키 기본 정보">
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm">{display.basic.map(fact=><WhiskeyCollectedBasicFact key={fact.field} fact={fact}/>)}</dl>
    {display.notice&&<p className="mt-3 text-xs leading-5 text-stone-700">{display.notice}</p>}
    {beginner&&hasAbv&&<p className="mt-3 text-xs leading-5 text-stone-700">도수가 높을수록 알코올이 더 강하게 느껴질 수 있어요. 병의 도수 표기도 확인해 주세요.</p>}
  </section>;
}
