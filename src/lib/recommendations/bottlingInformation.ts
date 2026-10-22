import type {AiSuggestionCard} from './v3Contract';

/** Explains missing data without turning a product-family page into a particular bottle's facts. */
export function bottlingInformationNotes(p:AiSuggestionCard['identity']):string[] {
  const notes:string[]=[];
  if(p.abv==null)notes.push('도수는 병입판마다 다를 수 있어, 해당 판본의 값을 알 수 없으면 표시하지 않아요.');
  if(p.independentBottling===true)notes.push('독립 병입은 병입사의 해당 제품 자료가 필요해요. 원래 증류소의 기본 제품 정보로 대신 채우지 않아요.');
  else if(p.oldBottle===true)notes.push('올드바틀은 당시 출시판이나 라벨 자료가 필요해요. 현재 판매 제품의 정보와 다를 수 있어요.');
  else if(!p.batch || !p.caskNumber)notes.push('배치·캐스크 번호는 제품에 표기되지 않거나 해당 판본 자료가 없으면 비워 둡니다.');
  return notes;
}
