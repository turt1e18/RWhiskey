import type {ReactNode} from 'react';
import type {ResultInformation} from '@/lib/recommendations/whiskeyResultInformation';

export default function WhiskeyCollectedBottlingPanel({display,children}:{display:ResultInformation;children?:ReactNode}) {
  const empty=display.bottling.length===0&&display.volumes.length===0;
  return <details className="mt-5 border-t border-[#4a3728]/25 text-sm leading-6">
    <summary className="min-h-11 cursor-pointer py-4 font-semibold">병입 정보 더보기</summary>
    <section aria-label="병입 추가 정보" className="pb-4">
      {empty?<p className="text-sm text-stone-700">현재 안내할 수 있는 병입 정보가 없어요.</p>:
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5">{display.bottling.map(f=><div key={f.field} className="min-w-0">
          <dt className="text-xs text-stone-600">{f.label}</dt><dd className="mt-1 break-words">{f.value}</dd>
        </div>)}
        {display.volumes.length>0&&<div className="min-w-0"><dt className="text-xs text-stone-600">알려진 제품 용량</dt><dd className="mt-1 break-words">{display.volumes.map(v=>`${v}ml`).join(', ')}</dd></div>}
        </dl>}
      {children}
    </section>
  </details>;
}
