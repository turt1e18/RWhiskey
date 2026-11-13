import type {V3Request} from './v3Contract';
import {aromaOptions} from '@/components/recommendations/WhiskeyTasteFields';

const levelLabels:Record<V3Request['experienceLevel'],string>={BEGINNER:'초심자',INTERMEDIATE:'중급',ADVANCED:'상급'};
const smokeLabels:Partial<Record<V3Request['preferences']['smoke'],string>>={
  ALLOW:'연기 향 괜찮음',MILD:'연기 향 은은하게',BOLD:'진한 연기 향',AVOID:'연기 향 피하기',
};

/** 결과 카드의 "내 주문" 칩. 주문 당시 요청에 실제로 있던 값만 보여 주고, 나머지 조건은 개수로 묶는다. */
export function orderSummaryChips(request:V3Request|null|undefined):string[] {
  if(!request)return [];
  const p=request.preferences;
  const chips=[levelLabels[request.experienceLevel]];
  if(smokeLabels[p.smoke])chips.push(smokeLabels[p.smoke]!);
  for(const aroma of p.aromas)chips.push(aromaOptions.find(o=>o.value===aroma)?.label??aroma);
  const others=[
    p.taste!=='UNKNOWN',p.body!=='UNKNOWN',
    ...[p.category,p.country,p.region,p.maturationCask,p.finishCask].map(Boolean),p.targetAbv!=null,
    // 제외 병 목록은 사용자가 고른 조건이 아니라 내부 재추천용이라 세지 않는다.
    ...Object.entries(request.hardConditions??{}).map(([key,v])=>key!=='excludedBottlingIds'&&v!=null&&v!==''),
    request.includeIndependentBottlings,request.includeOldBottles,
  ].filter(Boolean).length;
  if(others>0)chips.push(`그 외 조건 ${others}개`);
  if(chips.length===1)chips.push('조건 없이 주문');
  return chips;
}

/** 주문 시각을 영수증 머리 형식(YYYY/MM/DD)으로. 값이 없거나 잘못되면 표시하지 않는다. */
export function receiptDate(value:string|null|undefined):string|null {
  if(!value)return null;
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return null;
  return `${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;
}
