import type {ResultBasicFact} from '@/lib/recommendations/whiskeyResultInformation';

export default function WhiskeyCollectedBasicFact({fact}:{fact:ResultBasicFact}) {
  return <div className="min-w-0">
    <dt className="text-xs text-stone-600">{fact.label}</dt>
    <dd className="mt-1 break-words leading-6">{fact.value}
      {fact.kind==='AI'&&<span className="ml-1 inline-block rounded-sm border border-stone-500/40 px-1 text-[11px] leading-5 text-stone-700">AI 추정</span>}
    </dd>
  </div>;
}
