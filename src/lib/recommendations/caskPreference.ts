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
