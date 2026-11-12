import type {AiSuggestionCard,CatalogFacts} from './v3Contract';
import {validProductSourceObservations} from './v3Contract';
import {collectedBodyHidden} from './collectedCandidate';
import {collectedBasicFields,validCollectedBasicFields} from './collectedBottlingInformation';
import type {CollectedBasicFieldName} from './collectedBottlingInformation';
import {bottlingLabels,caskDisplay} from './bottlingDisplay';
import {bilingualLabel} from '@/components/recommendations/whiskeyPresentation';

export interface ResultBasicFact {field:CollectedBasicFieldName;label:string;value:string;kind:'KNOWN'|'AI'|'MISSING'|'HELD'}
export interface ResultInformation {basic:ResultBasicFact[];bottling:{field:string;label:string;value:string;raw?:string}[];volumes:number[];notice:string|null}
const labels={category:'위스키 종류',country:'위스키 생산국',abv:'알코올 도수',age:'숙성 연수'};
const heldReasons=new Set(['CONFLICTING_OBSERVATIONS','UNCERTAIN_SCOPE_OR_VALUE','AGE_NOT_CONFIRMED','VARIANT_NOT_CONFIRMED','MULTIPLE_PRODUCT_LINES','CONFLICTING_PRODUCT_GROUPS']);
const extraLabels:Record<string,string>={edition:'에디션',market:'판매 지역',independentBottling:'독립 병입',oldBottle:'올드바틀',
  aromaTags:'향미',tastingNote:'테이스팅 설명',smokeLevel:'연기 향',sweetnessLevel:'단맛',fruitLevel:'과일 향',bodyLevel:'질감',
  tasteSweetness:'단맛',tasteAcidity:'산미',tasteBitterness:'쓴맛',tasteSalinity:'짠맛',tasteUmami:'감칠맛'};
const aromas:Record<string,string>={VANILLA_CARAMEL:'바닐라·캐러멜',FRESH_FRUIT:'과일·감귤',DRIED_FRUIT:'건포도·말린 과일',FLORAL_HERBAL:'꽃·허브',CEREAL_NUTTY:'곡물·견과',ROASTED_COCOA:'커피·초콜릿',WOODY_SPICY:'나무·향신료'};
const aliases:Record<string,string>={age:'ageYears',bottler:'bottler'};
function text(value:unknown):string|null {
  return typeof value==='string'&&value.trim()&&value.length<=2000&&!/[\u0000-\u001f\u007f]/.test(value)&&
    !['UNKNOWN','N/A','NOT_AVAILABLE'].includes(value.trim().toUpperCase())?value.trim():null;
}
function normalized(field:string,value:unknown):string|null {
  const v=text(value);if(!v)return null;
  if(field==='abv')return /^\d+(?:\.\d+)?$/.test(v)&&Number(v)>0&&Number(v)<=100?String(Number(v)):null;
  if(field==='age')return v==='NAS'?v:/^\d+$/.test(v)&&Number(v)>=1&&Number(v)<=120?String(Number(v)):null;
  if(field==='volumeMl')return /^\d+$/.test(v)&&Number(v)>0&&Number(v)<=100000?String(Number(v)):null;
  if(field.endsWith('Year'))return /^\d{4}$/.test(v)&&Number(v)>=1700&&Number(v)<=new Date().getUTCFullYear()?v:null;
  if(field==='category'||field==='country')return bilingualLabel(field,v,null);
  return v;
}
function ageValue(fields:{field:string;value:string}[]):string|null {
  const years=fields.find(f=>f.field==='ageYears');const statement=fields.find(f=>f.field==='ageStatement');
  if(statement?.value==='NAS')return years?'INVALID':'NAS';
  return years?.value??null;
}
function basicFormat(field:CollectedBasicFieldName,value:string):string {
  return field==='abv'?`${value}%`:field==='age'?(value==='NAS'?'숙성 연수 미표기':`${value}년`):value;
}
function detailFormat(field:string,value:string):string|null {
  const clean=text(value);if(!clean)return null;value=clean;
  if(field==='maturationCask'||field==='finishCask')return caskDisplay(value);
  if(field.endsWith('Year'))return normalized(field,value)?`${value}년`:null;
  if(field==='independentBottling'||field==='oldBottle')return value==='true'?'해당함':value==='false'?'해당하지 않음':null;
  if(field==='aromaTags')return value.split(',').map(v=>aromas[v.trim()]??v.trim()).join(', ');
  if(field.endsWith('Level')||field.startsWith('taste')&&field!=='tastingNote')return /^[0-3]$/.test(value)?['없음','은은함','뚜렷함','진함'][Number(value)]:null;
  return text(value);
}
/** Preserve source/rights/expiry checks in the input contract; only customer presentation is reduced. */
export function whiskeyResultInformation(card:AiSuggestionCard,now=Date.now()):ResultInformation {
  if(collectedBodyHidden(card,now))return {basic:collectedBasicFields.map(field=>({field,label:labels[field],value:'정보 확인 필요',kind:'HELD'})),
    bottling:[],volumes:[],notice:'제품 정보를 다시 확인해 주세요.'};
  const p=card.identity;const info=card.collectedBottlingInformation;
  const catalog:CatalogFacts|null=card.catalogFacts?.status==='CURRENT'&&Date.parse(card.catalogFacts.validUntil)>now?card.catalogFacts:null;
  const catalogFields=catalog?.fields??[];
  const page=card.productSourceObservations&&validProductSourceObservations(card.productSourceObservations)&&Date.parse(card.productSourceObservations.validUntil)>now?card.productSourceObservations:null;
  const hasVariant=!!(p.edition||p.batch||p.bottler||p.caskNumber||p.market||p.volumeMl||p.vintageYear||p.bottledYear||p.releaseYear||p.independentBottling||p.oldBottle);
  const pageAge=page?ageValue(page.fields):null;const pageAbv=page?.fields.find(f=>f.field==='abv')?.value;
  const pageConflict=!!page&&(pageAge==='INVALID'||pageAge!=null&&p.ageStatement==='NUMBERED'&&normalized('age',pageAge)!==String(p.ageYears)||
    pageAge!=null&&p.ageStatement==='NAS'&&pageAge!=='NAS'||pageAbv!=null&&p.abv!=null&&Number(pageAbv)!==p.abv);
  const pageFields=page&&!hasVariant&&!pageConflict?page.fields:[];
  const globalHold=info?.status==='AMBIGUOUS'||info?.status==='INSUFFICIENT_IDENTITY'||card.catalogFacts?.status==='CHANGED';
  const basics=validCollectedBasicFields(info?.basicFields,info?.status??'')?info?.basicFields:undefined;
  let held=!!globalHold||pageConflict;
  const basic=collectedBasicFields.map((field:CollectedBasicFieldName):ResultBasicFact=>{
    const certified=field==='age'?ageValue(catalogFields):catalogFields.find(f=>f.field===field)?.value;
    if(certified!=null){const value=normalized(field,certified);if(value)return {field,label:labels[field],value:basicFormat(field,value),kind:'KNOWN'};held=true;return {field,label:labels[field],value:'정보 확인 필요',kind:'HELD'};}
    const source=basics?.find(f=>f.field===field);
    if(globalHold||source?.reason&&heldReasons.has(source.reason)){held=true;return {field,label:labels[field],value:'정보 확인 필요',kind:'HELD'};}
    if(info?.status==='NAME_MATCH'&&source?.status==='OBSERVED'&&source.value){
      // A field with explicit credit requirements is not republished without that credit.
      if(!source.sources.some(s=>s.attribution||s.licenseUrl)){
        const value=normalized(field,source.value);if(value)return {field,label:labels[field],value:basicFormat(field,value),kind:'KNOWN'};
        held=true;return {field,label:labels[field],value:'정보 확인 필요',kind:'HELD'};
      }
    }
    const pageValue=field==='age'?ageValue(pageFields):pageFields.find(f=>f.field===field)?.value;
    if(pageValue!=null){const value=normalized(field,pageValue);if(value)return {field,label:labels[field],value:basicFormat(field,value),kind:'KNOWN'};held=true;return {field,label:labels[field],value:'정보 확인 필요',kind:'HELD'};}
    if(pageConflict){return {field,label:labels[field],value:'정보 확인 필요',kind:'HELD'};}
    const proposed=field==='age'?(p.ageStatement==='NAS'?'NAS':p.ageStatement==='NUMBERED'&&p.ageYears!=null?String(p.ageYears):null):p[field];
    const value=normalized(field,typeof proposed==='number'?String(proposed):proposed);
    return {field,label:labels[field],value:value&&!card.candidateOrigin?basicFormat(field,value):'아직 정보가 없어요',kind:value&&!card.candidateOrigin?'AI':'MISSING'};
  });
  const bottling:ResultInformation['bottling']=[];
  for(const field of Object.keys(bottlingLabels)){
    const certified=catalogFields.find(f=>f.field===(aliases[field]??field));
    const source=info?.fields.find(f=>f.field===field);
    if(!certified&&(globalHold||source?.reason&&heldReasons.has(source.reason))){held=true;continue;}
    let raw=certified?.value??null;
    if(!raw&&info?.status==='NAME_MATCH'&&source?.status==='OBSERVED'&&!source.sources.some(s=>s.attribution||s.licenseUrl))raw=source.value;
    if(!raw)raw=pageFields.find(f=>f.field===field)?.value??null;
    const value=raw?detailFormat(field,raw):null;
    if(value)bottling.push({field,label:bottlingLabels[field],value,...(field==='maturationCask'||field==='finishCask'?{raw:String(raw)}:{})});
  }
  for(const f of catalogFields){
    if(!extraLabels[f.field])continue;
    if(f.field==='sweetnessLevel'&&catalogFields.some(other=>other.field==='tasteSweetness'&&detailFormat(other.field,other.value)))continue;
    const value=detailFormat(f.field,f.value);if(value)bottling.push({field:f.field,label:extraLabels[f.field],value});
  }
  const certifiedVolume=normalized('volumeMl',catalogFields.find(f=>f.field==='volumeMl')?.value);
  const pageVolume=normalized('volumeMl',pageFields.find(f=>f.field==='volumeMl')?.value);
  const volumes=[...(certifiedVolume?[Number(certifiedVolume)]:[]),
    ...(!globalHold&&info?.status==='NAME_MATCH'?info.availableVolumesMl:[]),
    ...(!globalHold&&pageVolume?[Number(pageVolume)]:[])].filter(value=>
      Number.isInteger(value)&&value>0&&value<=100000&&(!p.volumeMl||p.volumeMl===value));
  return {basic,bottling,volumes:[...new Set(volumes)].sort((a,b)=>a-b),notice:held?'제품 정보를 정확히 구분하기 어려워 일부 항목은 표시하지 않았어요.':null};
}
export function resultInformationDigest(card:AiSuggestionCard,now=Date.now()):string {return JSON.stringify(whiskeyResultInformation(card,now));}
/** Read-side enrichment never replaces the saved identity, prose, preferences or feedback. */
export function refreshResultInformation(current:AiSuggestionCard,next:AiSuggestionCard) {
  if(current.id!==next.id)throw new Error('INVALID_SAVED_RESPONSE');
  if(current.candidateOrigin&&(!next.candidateOrigin || current.candidateOrigin.usageScope!==next.candidateOrigin.usageScope ||
      JSON.stringify(current.candidateOrigin.recordIds)!==JSON.stringify(next.candidateOrigin.recordIds)))throw new Error('INVALID_SAVED_SOURCE_ORIGIN');
  const collectedFailed=next.collectedBottlingInformation?.status==='UNAVAILABLE';
  const catalogFailed=next.catalogFacts?.status==='UNAVAILABLE';
  const withdrawal=next.catalogFacts?.status==='CHANGED'||next.catalogFacts?.status==='EXPIRED'||
    ['AMBIGUOUS','INSUFFICIENT_IDENTITY'].includes(next.collectedBottlingInformation?.status??'')||
    !!next.collectedBottlingInformation?.fields.some(f=>f.reason==='PUBLICATION_REVIEW_REQUIRED'||f.reason!=null&&heldReasons.has(f.reason));
  const card={...current,
    candidateOrigin:next.candidateOrigin,
    catalogFacts:catalogFailed&&!withdrawal?current.catalogFacts:next.catalogFacts,
    productSourceObservations:next.productSourceObservations,
    collectedBottlingInformation:collectedFailed&&!withdrawal?current.collectedBottlingInformation:next.collectedBottlingInformation};
  const now=Date.now();
  return {card,unavailable:collectedFailed||catalogFailed,changed:resultInformationDigest(current,now)!==resultInformationDigest(card,now)};
}
