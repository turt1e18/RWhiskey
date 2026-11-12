import {caskDisplay} from './bottlingDisplay';

/** Unverified model vocabulary for soft preferences only; never a certified fact or a hard-filter repair. */
const groups:Record<string,string[]>={
  SHERRY:['셰리 캐스크','sherry cask','sherry barrel','ex sherry cask','ex sherry barrel'],
  BOURBON:['버번 캐스크','bourbon cask','bourbon barrel','ex bourbon cask','ex bourbon barrel'],
  VIRGIN_OAK:['버진 오크','new oak','new oak cask','new oak barrel','charred new oak','charred new white oak','virgin oak cask'],
  WINE:['와인 캐스크','wine cask','wine barrel'],PORT:['포트 캐스크','port cask','port barrel'],
  RUM:['럼 캐스크','rum cask','rum barrel'],OTHER:['기타 캐스크'],
};
const fold=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/[\s_-]+/g,' ');
export function proposedCaskCategory(value?:string|null):string|null {
  if(!value)return null;
  return Object.entries(groups).find(([key,aliases])=>[key,...aliases].some(x=>fold(x)===fold(value)))?.[0]??null;
}
export function sameProposedCaskPreference(expected?:string|null,actual?:string|null):boolean {
  const a=proposedCaskCategory(expected);return a!==null && a===proposedCaskCategory(actual);
}

/**
 * 취향 비교 문장. AI가 제안한 통(캐스크) 값은 보여 주지 않고, 확인된 값만 비교한다.
 * 확인된 값이 없으면 일치 여부를 단정하지 않고 "아직 정보가 없어요"라고 말한다.
 */
export function caskPreferenceNote(label:string,preferred:string,confirmed?:{value:string;raw?:string}|null):string|null {
  const want=caskDisplay(preferred);
  if(!confirmed)return `선호하신 ${label}은 ${want}이에요. 이번 한 잔의 ${label}은 아직 정보가 없어요.`;
  const same=sameProposedCaskPreference(preferred,confirmed.raw)||want===confirmed.value;
  return same?null:`선호하신 ${label}은 ${want}이며, 이번 한 잔의 ${label}은 ${confirmed.value}이에요.`;
}
