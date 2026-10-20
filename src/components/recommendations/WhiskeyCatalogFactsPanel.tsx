import type { CatalogFacts } from '@/lib/recommendations/v3Contract';
import { bilingualLabel } from './whiskeyPresentation';

const labels:Record<string,string>={brand:'브랜드',expression:'제품명',edition:'에디션',batch:'배치',bottler:'병입사',
  category:'종류',country:'생산 국가',region:'세부 산지',abv:'도수',volumeMl:'용량',ageStatement:'숙성 표기',
  ageYears:'숙성 년수',vintageYear:'증류 연도',releaseYear:'출시 연도',caskNumber:'캐스크 번호',
  maturationCask:'숙성 통',finishCask:'피니시 통',independentBottling:'독립 병입',oldBottle:'올드바틀',
  aromaTags:'향미',smokeLevel:'연기 향',sweetnessLevel:'단맛',fruitLevel:'과일 향',bodyLevel:'질감',
  market:'판매 지역',bottledYear:'병입 연도',tastingNote:'테이스팅 설명',
  tasteSweetness:'단맛',tasteAcidity:'산미',tasteBitterness:'쓴맛',tasteSalinity:'짠맛',tasteUmami:'감칠맛'};
const states={EXPIRED:'확인 기간이 지난 정보예요.',CHANGED:'저장된 병입 정보의 근거가 현재와 달라 다시 확인이 필요해요.',
  UNAVAILABLE:'현재 근거 상태를 확인하지 못했어요.',NOT_RECHECKED:'추천 당시의 정보예요. 현재 상태는 다시 확인 전이에요.'};
const aromas:Record<string,string>={VANILLA_CARAMEL:'바닐라·캐러멜',FRESH_FRUIT:'과일·감귤',DRIED_FRUIT:'건포도·말린 과일',
  FLORAL_HERBAL:'꽃·허브',CEREAL_NUTTY:'곡물·견과',ROASTED_COCOA:'커피·초콜릿',WOODY_SPICY:'나무·향신료'};
function display(field:CatalogFacts['fields'][number]) {
  const {field:key,value,unit}=field;
  if(key==='category' || key==='country')return bilingualLabel(key,value,null);
  if(key==='independentBottling' || key==='oldBottle')return value==='true'?'해당함':value==='false'?'해당하지 않음':value;
  if(key==='ageStatement')return value==='NAS'?'숙성 년수 표기 없음 (NAS)':value==='NUMBERED'?'숙성 년수 표기':value;
  if(key==='aromaTags')return value.split(',').map(v=>aromas[v]??v).join(', ');
  if(key.endsWith('Level') || key.startsWith('taste') && key!=='tastingNote')return `${['없음','은은함','뚜렷함','진함'][Number(value)]??value} (${value}/3)`;
  return `${value}${unit==='years'?'년':unit??''}`;
}
/** Facts apply only to this bottling, not to the AI prose or the user's tasting notes. */
export default function WhiskeyCatalogFactsPanel({facts}:{facts?:CatalogFacts|null}) {
  if(!facts)return null;
  const current=facts.status==='CURRENT' && Date.parse(facts.validUntil)>Date.now();
  const state=facts.status==='CURRENT'?'EXPIRED':facts.status;
  return <section aria-label="병입 정보 근거" className="mt-5 border-t border-[#4a3728]/25 pt-4 text-sm leading-6">
    <h3 className="font-semibold">{current?'현재 확인된 병입 정보':'이전에 확인한 병입 정보'}</h3>
    <p className="mt-2 text-xs leading-5 text-stone-600">{current?'아래 항목은 현재 근거를 확인한 정보이며, 추천을 저장한 뒤 추가될 수 있어요. 추천 당시의 AI 제안과 AI 설명 전체가 검증된 것은 아니에요.':states[state]}</p>
    <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 font-semibold">정보와 출처 보기</summary>
      <dl className="space-y-4">{facts.fields.map(f=><div key={f.field}><dt className="text-xs text-stone-600">{labels[f.field]??f.field}</dt>
        <dd className="mt-1 break-words">{display(f)}<div className="flex flex-wrap gap-x-4">{f.sources.map((s,i)=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-xs underline" aria-label={`${labels[f.field]??f.field} 출처 ${i+1} (새 창)`}>{new URL(s.url).hostname} · 출처 {i+1}</a>)}</div></dd></div>)}</dl>
    </details>
  </section>;
}
