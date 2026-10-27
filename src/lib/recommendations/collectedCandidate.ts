import type {AiSuggestionCard,V3Response} from './v3Contract';

export interface CollectedCandidateOrigin {
  kind:'COLLECTED_REFERENCE';buildId:string;recordIds:string[];usageScope:'PUBLIC'|'LOCAL_REFERENCE';
  observedFields:string[];checkedAt:string;validUntil:string;
}
const fields=new Set(['brand','expression','category','country','abv','age','maturationCask','finishCask','region',
  'bottler','batch','caskNumber','vintageYear','bottledYear','releaseYear','volumeMl','edition','market','independentBottling','oldBottle']);
export function validCandidateOrigin(value:unknown):value is CollectedCandidateOrigin {
  if(!value||typeof value!=='object')return false;
  const o=value as CollectedCandidateOrigin;
  return o.kind==='COLLECTED_REFERENCE'&&typeof o.buildId==='string'&&/^[a-f0-9]{64}$/.test(o.buildId)&&
    Array.isArray(o.recordIds)&&o.recordIds.length===1&&o.recordIds.every(id=>typeof id==='string'&&/^REC-[a-f0-9]{64}$/.test(id))&&
    ['PUBLIC','LOCAL_REFERENCE'].includes(o.usageScope)&&Array.isArray(o.observedFields)&&o.observedFields.length>=3&&o.observedFields.length<=32&&
    o.observedFields.includes('brand')&&o.observedFields.includes('expression')&&new Set(o.observedFields).size===o.observedFields.length&&
    o.observedFields.every(f=>fields.has(f))&&typeof o.checkedAt==='string'&&typeof o.validUntil==='string'&&
    Number.isFinite(Date.parse(o.checkedAt))&&Date.parse(o.validUntil)>Date.parse(o.checkedAt)&&
    Date.parse(o.validUntil)-Date.parse(o.checkedAt)<=900000;
}
export function collectedBodyHidden(card:AiSuggestionCard|null|undefined,now=Date.now()):boolean {
  if(!card)return false;
  if(card.candidateOrigin==null)return card.reasons?.includes('COLLECTED_CANDIDATE')===true;
  return !validCandidateOrigin(card.candidateOrigin)||Date.parse(card.candidateOrigin.validUntil)<=now;
}
export function sourceReadFailure(response:V3Response):'RESTRICTED'|'TEMPORARY'|null {
  return response.code==='COLLECTED_SOURCE_RESTRICTED'?'RESTRICTED':response.code==='COLLECTED_SOURCE_UNAVAILABLE'?'TEMPORARY':null;
}
export function collectedRecoveryId(response:V3Response):string|null {
  return sourceReadFailure(response)&&typeof response.operationId==='string'&&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(response.operationId)?response.operationId:null;
}
