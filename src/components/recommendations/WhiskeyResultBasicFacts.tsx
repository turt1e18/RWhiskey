import type {ResultInformation} from '@/lib/recommendations/whiskeyResultInformation';
import WhiskeyCollectedBasicFact from './WhiskeyCollectedBasicFact';

export default function WhiskeyResultBasicFacts({display}:{display:ResultInformation}) {
  return <section aria-label="위스키 기본 정보">
    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 text-sm">{display.basic.map(fact=><WhiskeyCollectedBasicFact key={fact.field} fact={fact}/>)}</dl>
    {display.notice&&<p className="mt-3 text-xs leading-5 text-stone-700">{display.notice}</p>}
  </section>;
}
