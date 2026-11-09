import type {AiSuggestionCard} from './v3Contract';
import {collectedBottlingFields} from './collectedBottlingInformation';
import type {CollectedBottlingInformation} from './collectedBottlingInformation';
export const bottlingLabels:Record<string,string>={maturationCask:'숙성 통',finishCask:'피니시 통 (추가 숙성)',region:'세부 산지',bottler:'병입사',
  batch:'배치 (생산 묶음)',caskNumber:'캐스크 번호',vintageYear:'증류 연도',bottledYear:'병입 연도',releaseYear:'출시 연도'};
const casks:Record<string,string>={BOURBON:'Bourbon (버번)',SHERRY:'Sherry (셰리)',WINE:'Wine (와인)',PORT:'Port (포트)',
  RUM:'Rum (럼)',VIRGIN_OAK:'Virgin Oak (새 오크 통)'};
export function caskDisplay(value?:string|null):string {return value?casks[value]??value:'미확인';}
function text(value:unknown):string|null {
  if(typeof value==='number')return Number.isFinite(value)?String(value):null;
  return typeof value==='string' && value.trim() && !['UNKNOWN','N/A','NOT_AVAILABLE'].includes(value.trim().toUpperCase())?value.trim():null;
}
export function bottlingRows(information?:CollectedBottlingInformation|null,identity?:AiSuggestionCard['identity']) {
  return collectedBottlingFields.map(field=>{
    const source=information?.fields.find(f=>f.field===field);
    const observed=information?.status==='NAME_MATCH' && source?.status==='OBSERVED';
    const reference=text(identity?.[field]);
    const format=(s:string)=>field.endsWith('Year')?`${s}년`:caskDisplay(s);
    return {field,label:bottlingLabels[field],value:observed&&source.value?format(source.value):'미확인',observed,
      reference:!observed && (!source?.reason || source.reason==='PRODUCT_FIELDS_NOT_COLLECTED') && reference?format(reference):null,
      reason:source?.reason,sources:observed?source.sources:[]};
  });
}
