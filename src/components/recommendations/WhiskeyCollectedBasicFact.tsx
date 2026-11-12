import type {ResultBasicFact} from '@/lib/recommendations/whiskeyResultInformation';

/** 값마다 단계를 보여 준다. 초심자는 "참고 정보" 한 종류만 보인다. */
export default function WhiskeyCollectedBasicFact({fact,beginner=false}:{fact:ResultBasicFact;beginner?:boolean}) {
  return <div className="min-w-0">
    <dt className="text-xs text-stone-600">{fact.label}</dt>
    <dd className="mt-1 break-words leading-6">{fact.value}
      {fact.kind==='AI'&&<span className="ml-1 inline-block rounded-sm border border-stone-500/40 px-1 text-xs leading-5 text-stone-700">참고 정보</span>}
      {fact.kind==='KNOWN'&&!beginner&&<span className="ml-1 inline-block rounded-sm border border-stone-500/40 px-1 text-xs leading-5 text-stone-700">확인된 정보</span>}
    </dd>
  </div>;
}
