/** Source observations are separate from the model proposal and certified catalog facts. */
export const collectedBottlingFields=['maturationCask','finishCask','region','bottler','batch','caskNumber','vintageYear','bottledYear','releaseYear'] as const;
export type CollectedBottlingFieldName=typeof collectedBottlingFields[number];
export const collectedBasicFields=['category','country','abv','age'] as const;
export type CollectedBasicFieldName=typeof collectedBasicFields[number];
export interface CollectedSource {url:string;observedAt?:string|null;attribution?:string|null;licenseUrl?:string|null}
export interface CollectedBasicField {field:CollectedBasicFieldName;status:'OBSERVED'|'UNKNOWN';value:string|null;
  reason?:string|null;sources:CollectedSource[]}
export interface CollectedProductMatch {status:'MATCHED'|'REVIEW_REQUIRED'|'NOT_FOUND'|'UNAVAILABLE';
  method:'EXACT_NAME'|'REVIEWED_ALIAS'|'NORMALIZED_NAME'|null;reason?:string|null;sourceNames:string[]}
export interface CollectedBottlingInformation {
  status:'NAME_MATCH'|'NAME_ONLY'|'NO_MATCH'|'AMBIGUOUS'|'INSUFFICIENT_IDENTITY'|'UNAVAILABLE';
  checkedAt:string;evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED';bottlingIdentityConfirmed:false;
  datasetBuildId?:string|null;recordCount:number;availableVolumesMl:number[];
  fields:{field:CollectedBottlingFieldName;status:'OBSERVED'|'UNKNOWN';value:string|null;reason?:string|null;
    sources:CollectedSource[]}[];
  basicFields?:CollectedBasicField[];usageScope?:'PUBLIC'|'LOCAL_REFERENCE';productMatch?:CollectedProductMatch|null;
}
export function validProductMatch(value:unknown):value is CollectedProductMatch {
  if(!value || typeof value!=='object')return false;
  const p=value as CollectedProductMatch;
  return ['MATCHED','REVIEW_REQUIRED','NOT_FOUND','UNAVAILABLE'].includes(p.status) &&
    (p.status==='MATCHED'?['EXACT_NAME','REVIEWED_ALIAS','NORMALIZED_NAME'].includes(p.method??''):p.method===null) &&
    (p.reason==null||typeof p.reason==='string'&&p.reason.length<=80&&!/[\u0000-\u001f\u007f]/.test(p.reason)) &&
    Array.isArray(p.sourceNames)&&p.sourceNames.length<=8&&new Set(p.sourceNames).size===p.sourceNames.length &&
    p.sourceNames.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=350&&!/[\u0000-\u001f\u007f]/.test(n)) &&
    (p.status==='MATCHED'||p.sourceNames.length===0);
}
export function validCollectedBasicFields(value:unknown,status:string):value is CollectedBasicField[] {
  if(!Array.isArray(value)||value.length!==4||new Set(value.map(v=>v?.field)).size!==4)return false;
  return value.every(f=>f && collectedBasicFields.includes(f.field) && ['OBSERVED','UNKNOWN'].includes(f.status) &&
    (f.reason==null||typeof f.reason==='string'&&f.reason.length<=80) && Array.isArray(f.sources)&&f.sources.length<=3 &&
    (f.status==='UNKNOWN'?f.value===null&&f.sources.length===0:
      status==='NAME_MATCH'&&typeof f.value==='string'&&f.value.length>0&&f.value.length<=350&&!/[\u0000-\u001f\u007f]/.test(f.value)&&f.sources.length>0 &&
      (f.field!=='abv'||Number.isFinite(Number(f.value))&&Number(f.value)>0&&Number(f.value)<=100) &&
      (f.field!=='age'||f.value==='NAS'||/^\d+$/.test(f.value)&&Number(f.value)>=1&&Number(f.value)<=120)) &&
    f.sources.every((s:CollectedSource)=>safeCollectedSource(s)));
}
function safeCollectedSource(s:CollectedSource):boolean {
  return !!s&&safeSource(s.url)&&(s.observedAt==null||typeof s.observedAt==='string'&&Number.isFinite(Date.parse(s.observedAt))) &&
    (s.attribution==null||typeof s.attribution==='string'&&s.attribution.length<=300&&!/[\u0000-\u001f\u007f]/.test(s.attribution)) &&
    (s.licenseUrl==null||safeSource(s.licenseUrl));
}
function safeSource(value:unknown):boolean {
  if(typeof value!=='string' || value.length>2048)return false;
  try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password && !u.hash &&
    (!u.port || u.port==='443') && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(u.hostname) &&
    /[a-z]/i.test(u.hostname.split('.').pop()??'') && !['.local','.internal','.localhost'].some(s=>u.hostname.endsWith(s)) &&
    Array.from(u.searchParams.keys()).every(k=>['edition','batch','market','release','vintage','year','lang','locale','product','id','sku','categoryid','hslang','serno'].includes(k.toLowerCase()));
  }catch{return false;}
}
export function validCollectedBottlingInformation(value:unknown):value is CollectedBottlingInformation {
  if(!value || typeof value!=='object')return false;
  const p=value as CollectedBottlingInformation;
  if(!['NAME_MATCH','NAME_ONLY','NO_MATCH','AMBIGUOUS','INSUFFICIENT_IDENTITY','UNAVAILABLE'].includes(p.status) ||
    p.usageScope!==undefined && !['PUBLIC','LOCAL_REFERENCE'].includes(p.usageScope) ||
    p.evidenceStatus!=='SOURCE_OBSERVATION_UNVERIFIED' || p.bottlingIdentityConfirmed!==false ||
    typeof p.checkedAt!=='string' || !Number.isFinite(Date.parse(p.checkedAt)) ||
    p.datasetBuildId!=null && (typeof p.datasetBuildId!=='string' || !/^[a-f0-9]{64}$/.test(p.datasetBuildId)) ||
    !Number.isInteger(p.recordCount) || p.recordCount<0 || p.recordCount>64 ||
    ['NAME_MATCH','NAME_ONLY'].includes(p.status) && (!p.datasetBuildId || p.recordCount===0) ||
    !Array.isArray(p.availableVolumesMl) || p.availableVolumesMl.length>64 ||
    new Set(p.availableVolumesMl).size!==p.availableVolumesMl.length ||
    !p.availableVolumesMl.every(v=>Number.isInteger(v) && v>0 && v<=100000) ||
    !Array.isArray(p.fields) || p.fields.length!==collectedBottlingFields.length ||
    new Set(p.fields.map(f=>f?.field)).size!==collectedBottlingFields.length)return false;
  return p.fields.every(f=>f && collectedBottlingFields.includes(f.field) &&
    ['OBSERVED','UNKNOWN'].includes(f.status) && (f.reason==null || typeof f.reason==='string' && f.reason.length<=80) &&
    Array.isArray(f.sources) && f.sources.length<=3 &&
    (f.status==='UNKNOWN'?f.value===null && f.sources.length===0:
      p.status==='NAME_MATCH' && typeof f.value==='string' && f.value.length>0 && f.value.length<=350 &&
      !/[\u0000-\u001f\u007f]/.test(f.value) && f.sources.length>0) &&
    f.sources.every(s=>safeCollectedSource(s))) &&
    (p.status==='NAME_MATCH' || p.availableVolumesMl.length===0);
}
/** Reject only a damaged optional basic block; preserve the older nine-field contract. */
export function cleanCollectedInformation(value:CollectedBottlingInformation):CollectedBottlingInformation {
  if(value.basicFields===undefined&&value.usageScope===undefined&&value.productMatch===undefined)return value;
  return {...value,basicFields:validCollectedBasicFields(value.basicFields,value.status)?value.basicFields:undefined,
    productMatch:validProductMatch(value.productMatch)?value.productMatch:undefined,
    usageScope:value.usageScope==='LOCAL_REFERENCE'?'LOCAL_REFERENCE':'PUBLIC'};
}
export function collectedLookupMessage(info?:CollectedBottlingInformation|null):string {
  if(info?.productMatch?.status==='MATCHED')return info.status==='INSUFFICIENT_IDENTITY'?
    '제품 정보는 찾았지만, 출시판·배치가 같은지 확인이 필요해요.':
    info.status==='AMBIGUOUS'?'제품 정보는 찾았지만, 서로 다른 출시판의 정보를 구분해야 해요.':
    info.status==='NAME_ONLY'?'제품명은 연결했어요. 세부 정보는 아직 확인 중이에요.':'등록된 제품 정보와 연결했어요.';
  if(info?.productMatch?.reason==='CONFLICTING_PRODUCT_GROUPS')return '여러 제품과 이름이 겹쳐, 같은 제품인지 확인 중이에요.';
  if(info?.fields.some(f=>f.reason==='TRANSLATED_NAME_REVIEW_REQUIRED'))return '번역한 이름으로 후보를 찾았어요. 같은 제품인지 확인 중이에요.';
  if(info?.fields.some(f=>f.reason==='PUBLICATION_REVIEW_REQUIRED'))return '자료의 공개 이용 범위를 확인 중이에요. 미확인 표시는 유지합니다.';
  if(info?.productMatch?.status==='REVIEW_REQUIRED' && info.fields.some(f=>f.reason==='PRODUCT_NAME_REVIEW_REQUIRED'))return '비슷한 이름의 제품 정보가 있어요. 같은 제품인지 확인 중이에요.';
  if(info?.status==='UNAVAILABLE')return '지금 제품 정보를 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요.';
  if(info?.status==='NO_MATCH')return '이 이름과 조건에 맞는 등록 제품 정보를 아직 찾지 못했어요.';
  if(info?.status==='NAME_ONLY')return '제품명은 찾았어요. 병입별 세부 자료는 아직 확인 중이에요.';
  if(info?.status==='NAME_MATCH')return '조건에 맞는 출처 자료를 다시 확인했어요. 병입판 인증 정보는 아니에요.';
  return '조건에 맞는 추가 정보를 확인하지 못했어요. 미확인 항목은 그대로 표시합니다.';
}
