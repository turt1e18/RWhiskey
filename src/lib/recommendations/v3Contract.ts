import type { WhiskeyCandidateRequest, WhiskeyVerifiedRecommendationResponse } from '../../type/ApiInterface';

export interface V3Request {
  experienceLevel: NonNullable<WhiskeyCandidateRequest['experienceLevel']>;
  hardConditions: NonNullable<WhiskeyCandidateRequest['requirements']>;
  preferences: {
    aromas: NonNullable<WhiskeyCandidateRequest['aromaPreferences']>;
    taste: NonNullable<WhiskeyCandidateRequest['tastePreference']>;
    body: NonNullable<WhiskeyCandidateRequest['bodyPreference']>;
    smoke: NonNullable<WhiskeyCandidateRequest['smokePreference']>;
    category?: string; country?: string; region?: string; targetAbv?: number;
    maturationCask?: string; finishCask?: string;
  };
  explorationIntent: 'BALANCED';
  includeIndependentBottlings: boolean;
  includeOldBottles: boolean;
}
export interface V3Response {
  apiVersion: 'V3';
  state: 'SUCCESS' | 'IN_PROGRESS' | 'NO_MATCH' | 'NEEDS_CLARIFICATION' | 'NEEDS_REVIEW' | 'UNAVAILABLE';
  code?: string | null;
  nextAction: 'NONE' | 'RECOVER' | 'EDIT_REQUEST' | 'NEW_REQUEST' | 'LOGIN';
  operationId?: string | null;
  recommendationId?: number | null;
  historicalRecordId?: number | null;
  selected?: WhiskeyVerifiedRecommendationResponse['selected'];
  presentation?: WhiskeyVerifiedRecommendationResponse['presentation'];
  evidenceUrl?: string | null;
  appliedLevel?: WhiskeyCandidateRequest['experienceLevel'];
  recommendedAt?: string | null;
  verification?: { atRecommendation: 'V3_CERTIFIED'|'AI_SUGGESTED'; current: string; certificateId?: string|null; policyVersion?: string|null } | null;
  requestSummary?: V3Request | null;
  aiSuggestion?: AiSuggestionCard|null;
}

export interface AiSuggestionCard {
  id:string;
  identity:{brand:string;expression:string;edition?:string|null;batch?:string|null;bottler?:string|null;
    category?:string|null;country?:string|null;region?:string|null;abv?:number|null;
    ageStatement?:'UNKNOWN'|'NAS'|'NUMBERED';ageYears?:number|null;vintageYear?:number|null;bottledYear?:number|null;
    caskNumber?:string|null;maturationCask?:string|null;finishCask?:string|null;
    independentBottling?:boolean|null;oldBottle?:boolean|null;volumeMl?:number|null;releaseYear?:number|null};
  presentation:{summary:string[];pairings:{food:string;reason:string}[]};
  notice:string;
  reasons?:string[];
  localizedName?:string|null;
  servingSuggestion?:string|null;
  presentationSource?:{kind:'RULE'|'MODEL';provider?:string|null;model?:string|null;promptVersion?:string|null;status:string}|null;
  catalogFacts?:CatalogFacts|null;
  productSourceObservations?:ProductSourceObservations|null;
}
export interface ProductSourceObservations {
  scope:'PRODUCT_PAGE';status:'CURRENT';bottlingIdentityConfirmed:false;
  observedAt:string;validUntil:string;sourceUrl:string;publisher:string;
  fields:{field:string;value:string;unit?:string|null}[];
}
export function validProductSourceObservations(value:unknown):value is ProductSourceObservations {
  if(!value || typeof value!=='object')return false;
  const o=value as ProductSourceObservations;
  const allowed=['abv','maturationCask','finishCask','ageStatement','ageYears','volumeMl','region','country'];
  let safeUrl=false;
  try {const u=new URL(o.sourceUrl);safeUrl=u.protocol==='https:' && !u.username && !u.password && !u.hash &&
    (u.port==='' || u.port==='443') && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(u.hostname) &&
    !/^\d+$/.test(u.hostname.split('.').pop()??'') && !['.local','.internal','.localhost'].some(x=>u.hostname.endsWith(x)) &&
    Array.from(u.searchParams.keys()).every(k=>['edition','batch','market','release','vintage','year','lang','locale','product','id','sku'].includes(k.toLowerCase()));
  }catch{return false;}
  return safeUrl && o.scope==='PRODUCT_PAGE' && o.status==='CURRENT' && o.bottlingIdentityConfirmed===false &&
    typeof o.publisher==='string' && o.publisher.length>0 && o.publisher.length<=120 &&
    typeof o.observedAt==='string' && Number.isFinite(Date.parse(o.observedAt)) &&
    typeof o.validUntil==='string' && Date.parse(o.validUntil)>Date.parse(o.observedAt) &&
    Array.isArray(o.fields) && o.fields.length>0 && o.fields.length<=8 &&
    new Set(o.fields.map(x=>x?.field)).size===o.fields.length && o.fields.every(x=>x && allowed.includes(x.field) &&
      typeof x.value==='string' && x.value.length>0 && x.value.length<=200 && !/[\u0000-\u001f\u007f]/.test(x.value) &&
      (x.unit==null || ['%','ml','years'].includes(x.unit)) &&
      (x.field!=='abv' || /^\d+(?:\.\d{1,2})?$/.test(x.value) && Number(x.value)>0 && Number(x.value)<=100));
}
export interface CatalogFacts {
  status:'CURRENT'|'EXPIRED'|'CHANGED'|'UNAVAILABLE'|'NOT_RECHECKED';
  bottlingId:number;factsDigest:string;policyVersion:string;checkedAt:string;validUntil:string;
  fields:{field:string;value:string;unit?:string|null;sources:{url:string;observedAt:string}[]}[];
}
const factNames=new Set(['brand','expression','edition','batch','bottler','category','country','region','abv','volumeMl',
  'ageStatement','ageYears','vintageYear','releaseYear','caskNumber','maturationCask','finishCask','independentBottling',
  'oldBottle','market','bottledYear','aromaTags','tastingNote','smokeLevel','sweetnessLevel','fruitLevel','bodyLevel',
  'tasteSweetness','tasteAcidity','tasteBitterness','tasteSalinity','tasteUmami']);
function validFacts(value:unknown):value is CatalogFacts {
  if(!value || typeof value!=='object')return false;
  const f=value as CatalogFacts;
  const date=(v:unknown)=>typeof v==='string' && Number.isFinite(Date.parse(v));
  const url=(v:unknown)=>{try {if(typeof v!=='string' || v.length>2048)return false;const u=new URL(v);
    return u.protocol==='https:' && !u.username && !u.password && !u.hash && (u.port==='' || u.port==='443') &&
      Array.from(u.searchParams.keys()).every(k=>['edition','batch','market','release','vintage','year','lang','locale','product','id','sku'].includes(k.toLowerCase())) &&
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(u.hostname) && !/^\d+$/.test(u.hostname.split('.').pop()??'') &&
      !['.local','.internal','.localhost'].some(s=>u.hostname.endsWith(s));
  }catch{return false;}};
  return ['CURRENT','EXPIRED','CHANGED','UNAVAILABLE','NOT_RECHECKED'].includes(f.status) &&
    Number.isSafeInteger(f.bottlingId) && f.bottlingId>0 && /^[0-9a-f]{64}$/.test(f.factsDigest) &&
    f.policyVersion==='S4_EVIDENCE_V1' && date(f.checkedAt) && date(f.validUntil) &&
    Date.parse(f.checkedAt)<Date.parse(f.validUntil) && Array.isArray(f.fields) && f.fields.length>0 && f.fields.length<=32 &&
    new Set(f.fields.map(x=>x?.field)).size===f.fields.length && f.fields.every(x=>x && factNames.has(x.field) &&
      typeof x.value==='string' && x.value.length>0 && x.value.length<=2000 &&
      (x.unit==null || ['%','ml','years'].includes(x.unit)) && Array.isArray(x.sources) && x.sources.length>0 && x.sources.length<=4 &&
      x.sources.every(s=>s && url(s.url) && date(s.observedAt) && Date.parse(s.observedAt)<=Date.parse(f.checkedAt)));
}
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** AI output is deliberately incompatible with the certified card guard below. */
export function toAiSuggestion(v:V3Response):AiSuggestionCard|null {
  const a=v.aiSuggestion;
  if(v.state!=='SUCCESS' || v.verification?.atRecommendation!=='AI_SUGGESTED' || v.verification.current!=='UNVERIFIED' ||
    v.verification.certificateId!=null || v.selected!=null || v.recommendationId!=null || v.evidenceUrl!=null ||
    !a || typeof a.id!=='string' || !uuid.test(a.id) || a.id!==v.operationId ||
    !v.recommendedAt || !Number.isFinite(Date.parse(v.recommendedAt)) ||
    !['BEGINNER','INTERMEDIATE','ADVANCED'].includes(v.appliedLevel ?? '') ||
    !a.identity || typeof a.identity.brand!=='string' || !a.identity.brand.trim() || a.identity.brand.length>200 ||
    typeof a.identity.expression!=='string' || !a.identity.expression.trim() || a.identity.expression.length>240 ||
    typeof a.notice!=='string' || !a.notice.trim() || a.notice.length>1000 ||
    !a.presentation || !Array.isArray(a.presentation.summary) || a.presentation.summary.length>12 ||
    !a.presentation.summary.every(x=>typeof x==='string' && x.length<=2000) ||
    !Array.isArray(a.presentation.pairings) || a.reasons!=null && (!Array.isArray(a.reasons) || !a.reasons.every(x=>typeof x==='string')))return null;
  const p=a.identity;
  const source=a.presentationSource;
  if(a.localizedName!=null && (typeof a.localizedName!=='string' || a.localizedName.length<2 || a.localizedName.length>140 ||
      !/[가-힣]/.test(a.localizedName) || /[\u3400-\u9fff<>\u0000-\u001f\u007f]/.test(a.localizedName)) ||
    a.servingSuggestion!=null && (typeof a.servingSuggestion!=='string' || a.servingSuggestion.length>240) ||
    source!=null && (!['RULE','MODEL'].includes(source.kind) || typeof source.status!=='string' || source.status.length>80 ||
      [source.provider,source.model,source.promptVersion].some(x=>x!=null && (typeof x!=='string' || x.length>100 || !/^[A-Za-z0-9_.-]+$/.test(x))) ||
      source.kind==='MODEL' && (!source.provider || !source.model || !source.promptVersion || !['GENERATED','GENERATED_FILTERED'].includes(source.status)))) return null;
  if([p.edition,p.batch,p.bottler,p.category,p.country,p.region,p.caskNumber,p.maturationCask,p.finishCask]
    .some(x=>x!=null && (typeof x!=='string' || x.length>240)) ||
    p.abv!=null && (typeof p.abv!=='number' || !Number.isFinite(p.abv) || p.abv<=0 || p.abv>100) ||
    p.ageYears!=null && (!Number.isInteger(p.ageYears) || p.ageYears<1 || p.ageYears>100) ||
    p.vintageYear!=null && (!Number.isInteger(p.vintageYear) || p.vintageYear<1700 || p.vintageYear>new Date().getFullYear()) ||
    p.volumeMl!=null && (!Number.isInteger(p.volumeMl) || p.volumeMl<1 || p.volumeMl>100000) ||
    p.releaseYear!=null && (!Number.isInteger(p.releaseYear) || p.releaseYear<1700 || p.releaseYear>new Date().getFullYear()) ||
    p.bottledYear!=null && (!Number.isInteger(p.bottledYear) || p.bottledYear<1700 || p.bottledYear>new Date().getFullYear()) ||
    [p.independentBottling,p.oldBottle].some(x=>x!=null && typeof x!=='boolean'))return null;
  // An invalid optional enhancement must not hide an otherwise usable saved AI recommendation.
  const clean=a.catalogFacts==null || validFacts(a.catalogFacts)?a:{...a,catalogFacts:null};
  return clean.productSourceObservations==null || validProductSourceObservations(clean.productSourceObservations)?clean:
    {...clean,productSourceObservations:null};
}

/** No silently dropped hard constraints or free text from an older contract. */
export function toV3Request(input: WhiskeyCandidateRequest): V3Request {
  const h = input.requirements ?? {}; const c = input.context ?? {};
  if (h.excludedBottlingIds?.length || c.weather || c.mood || c.additionalContext || c.preferredFlavor ||
      (input.preferredFlavor && input.preferredFlavor !== 'UNKNOWN')) throw new Error('UNSUPPORTED_V3_INPUT');
  const { excludedBottlingIds: _excluded, ...hardConditions } = h;
  void _excluded;
  return {
    experienceLevel: input.experienceLevel ?? 'BEGINNER', hardConditions,
    preferences: { aromas: input.aromaPreferences ?? [], taste: input.tastePreference ?? 'UNKNOWN',
      body: input.bodyPreference ?? 'UNKNOWN', smoke: input.smokePreference ?? 'UNKNOWN',
      category: c.preferredCategory, country: c.preferredCountry, region: c.preferredRegion,
      targetAbv: c.targetAbv, maturationCask: c.preferredMaturationCask, finishCask: c.preferredFinishCask },
    explorationIntent: 'BALANCED', includeIndependentBottlings: input.includeIndependentBottlings ?? false,
    includeOldBottles: input.includeOldBottles ?? false,
  };
}
export function isV3Response(input: unknown): input is V3Response {
  if (!input || typeof input !== 'object') return false;
  const v = input as Record<string, unknown>;
  return v.apiVersion === 'V3' && ['SUCCESS','IN_PROGRESS','NO_MATCH','NEEDS_CLARIFICATION','NEEDS_REVIEW','UNAVAILABLE'].includes(String(v.state)) &&
    ['NONE','RECOVER','EDIT_REQUEST','NEW_REQUEST','LOGIN'].includes(String(v.nextAction));
}
/** Reuse visual card only after a durable, currently verified result. */
export function toVerifiedCard(v: V3Response): WhiskeyVerifiedRecommendationResponse | null {
  if (v.state !== 'SUCCESS' || v.verification?.atRecommendation !== 'V3_CERTIFIED' || v.verification.current !== 'CURRENT' ||
      !v.verification.certificateId || !v.selected || !v.presentation || !Array.isArray(v.presentation.summary) ||
      !Array.isArray(v.presentation.pairings) || !v.evidenceUrl?.startsWith('https://') ||
      !Number.isSafeInteger(v.recommendationId) || (v.recommendationId ?? 0) < 1 ||
      !v.recommendedAt || !Number.isFinite(Date.parse(v.recommendedAt)) ||
      typeof v.selected.displayName !== 'string' || !v.selected.displayName.trim() ||
      !Number.isSafeInteger(v.selected.productId) || v.selected.productId < 1 ||
      !Number.isSafeInteger(v.selected.bottlingId) || v.selected.bottlingId < 1 ||
      !v.presentation.summary.every(x=>typeof x==='string') ||
      !v.presentation.pairings.every(x=>typeof x?.food==='string' && typeof x?.reason==='string')) return null;
  return { state:'SUCCESS', code:'V3_SAVED', retryable:false, selected:v.selected, presentation:v.presentation,
    recommendationId:v.recommendationId, evidenceUrl:v.evidenceUrl, appliedLevel:v.appliedLevel, reasonCodes:[] };
}
