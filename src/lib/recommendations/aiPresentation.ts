/** Display aliases for existing snapshots; never used in candidate discovery or ranking. */
const aliases:Record<string,string>={
  'the balvenie|doublewood 12 year old':'발베니 더블우드 12년',
  'woodford reserve|distiller s select':'우드포드 리저브 디스틸러스 셀렉트',
  'glenmorangie|the original 10 year old':'글렌모렌지 오리지널 10년',
  'redbreast|12 year old':'레드브레스트 12년',
};
const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function aiKoreanName(identity:{brand:string;expression:string},localizedName?:string|null):string|null {
  return localizedName ?? aliases[`${normalize(identity.brand)}|${normalize(identity.expression)}`] ?? null;
}
