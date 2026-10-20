"use client";
import type { ProductSourceObservations } from '@/lib/recommendations/v3Contract';
const labels:Record<string,string>={abv:'출처 안내 도수',maturationCask:'숙성 통',finishCask:'피니시 통',
  ageStatement:'숙성 년수 표기',ageYears:'숙성 년수',volumeMl:'용량',region:'세부 산지',country:'생산 국가'};
const casks:Record<string,string>={BOURBON:'버번 캐스크',SHERRY:'셰리 캐스크',WINE:'와인 캐스크',PORT:'포트 캐스크',
  RUM:'럼 캐스크',VIRGIN_OAK:'새 오크 통(버진 오크)',OTHER:'기타 캐스크'};
export default function WhiskeyProductSourcePanel({information}:{information?:ProductSourceObservations|null}) {
  if(!information || Date.parse(information.validUntil)<=Date.now())return null;
  return <section aria-label="제품 출처 정보" className="mt-5 border-t border-[#4a3728]/25 pt-4 text-sm leading-6">
    <h3 className="font-semibold">제품 페이지에 기재된 정보</h3>
    <p className="mt-2 text-xs leading-5 text-stone-600">아래는 제품 페이지의 안내값이에요. 특정 배치·병입판의 인증값은 아니며, 실제 병의 라벨과 다를 수 있어요.</p>
    <dl className="mt-3 grid grid-cols-2 gap-4">{information.fields.map(f=><div key={f.field}>
      <dt className="text-xs text-stone-600">{labels[f.field]??f.field}</dt>
      <dd className="mt-1 break-words">{casks[f.value] ?? (f.value==='NAS'?'숙성 년수 표기 없음':f.value)}{f.unit==='%'?'%':f.unit==='years'?'년':f.unit==='ml'?'ml':''}</dd>
    </div>)}</dl>
    <a href={information.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs underline"
      aria-label="제품 안내 출처 보기 (새 창)">{new URL(information.sourceUrl).hostname} · 출처 보기</a>
  </section>;
}
