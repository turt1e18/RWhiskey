import type {ContributionKind,ContributionStatus,ContributionView,ItemApply,ItemDecision} from '@/api/contributionApi';
import type {InformationReportField,InformationReportSource} from '@/api/whiskeyV3Api';
import {REPORT_MAX_LENGTH,reportFieldLabel} from '@/lib/recommendations/informationReport';

export const kindOptions:{value:ContributionKind;label:string;hint:string}[]=[
  {value:'CORRECTION',label:'정보가 달라요',hint:'도수·숙성 연수·이름 같은 정보가 실제와 달라요'},
  {value:'NEW_BOTTLE',label:'목록에 없는 위스키예요',hint:'찾는 위스키가 없으면 새로 알려 주세요'},
  {value:'OTHER',label:'같은 위스키가 두 번 있거나 그 밖의 이야기예요',hint:'중복된 제품이나 다른 의견을 적어 주세요'},
];

export const CONTENT_MIN=2;
const length=(v:string)=>[...v.trim()].length;
export const contentReady=(field:InformationReportField,v:string)=>
  length(v)===0?field==='PHOTO_MISMATCH':length(v)>=CONTENT_MIN&&length(v)<=REPORT_MAX_LENGTH;
export const urlAllowed=(source:InformationReportSource|null)=>source==='OFFICIAL_SITE'||source==='RETAILER';
export function urlReady(v:string):boolean {
  const t=v.trim(); if(!t)return true;
  try {const u=new URL(t);return (u.protocol==='https:'||u.protocol==='http:')&&!u.username&&!u.password&&t.length<=2000;}
  catch {return false;}
}

/** Same rules as the server: correction needs a picked bottle, a new bottle needs a label name, the rest a description. */
export function formReady(input:{kind:ContributionKind|null;targetId:number|null;labelName:string;fields:InformationReportField[];
  contents:Partial<Record<InformationReportField,string>>;otherText:string;source:InformationReportSource|null;url:string}):boolean {
  const itemsOk=input.fields.every(f=>contentReady(f,input.contents[f]??''));
  const urlOk=urlReady(input.url)&&(input.url.trim()===''||urlAllowed(input.source));
  if(!urlOk||!itemsOk)return false;
  if(input.kind==='CORRECTION')return input.targetId!==null&&input.fields.length>0;
  if(input.kind==='NEW_BOTTLE')return length(input.labelName)>=1&&length(input.labelName)<=250;
  if(input.kind==='OTHER'||input.kind==='DUPLICATE')return length(input.otherText)>=CONTENT_MIN&&length(input.otherText)<=REPORT_MAX_LENGTH;
  return false;
}

/** Design B-4: internal states map to plain words; hold and failed application are not shown as such. */
export function publicStatus(c:Pick<ContributionView,'status'|'items'|'kind'>):{label:string;tone:'wait'|'ask'|'done'|'no'} {
  const approved=c.items.filter(i=>i.decision==='APPROVED'||i.decision==='SEPARATE_RELEASE');
  switch(c.status){
    case 'SUBMITTED':return {label:'접수됐어요',tone:'wait'};
    case 'IN_REVIEW':case 'HELD':return {label:'확인하고 있어요',tone:'wait'};
    case 'NEEDS_INFO':return {label:'조금 더 알려주세요',tone:'ask'};
    case 'WITHDRAWN':return {label:'취소했어요',tone:'no'};
    case 'APPLIED':
      if(c.items.some(i=>i.decision==='SEPARATE_RELEASE'))return {label:'다른 에디션(판)으로 따로 등록했어요',tone:'done'};
      if(c.kind==='NEW_BOTTLE')return {label:'위스키 정보에 등록했어요',tone:'done'};
      return {label:c.items.some(i=>i.decision==='REJECTED')?'일부 반영됐어요':'반영됐어요',tone:'done'};
    default:
      if(c.items.length>0&&approved.length===0&&c.items.every(i=>i.decision==='REJECTED'))return {label:'이번에는 반영하지 않았어요',tone:'no'};
      return {label:'반영을 준비하고 있어요',tone:'wait'};
  }
}

export function itemResult(decision:ItemDecision,apply:ItemApply,status?:ContributionStatus):string {
  if(apply==='APPLIED')return '반영됐어요';
  if(status==='WITHDRAWN')return '취소해서 확인하지 않았어요';
  if(apply==='REVERTED')return '되돌렸어요';
  if(decision==='REJECTED')return '반영하지 않았어요';
  if(decision==='APPROVED'||decision==='SEPARATE_RELEASE')return '반영을 준비하고 있어요';
  return '확인하고 있어요';
}

export const fieldLabel=(f:InformationReportField)=>reportFieldLabel(f);

export function contributionFailure(status:number|null,code:string|null):{message:string;authExpired:boolean;showMine?:boolean} {
  if(status===401||status===403)return {message:'로그인이 만료되었어요. 새 탭에서 다시 로그인한 뒤 보내 주세요. 입력한 내용은 그대로 있어요.',authExpired:true};
  if(code==='CONTRIBUTION_PERSONAL_DATA')return {message:'연락처나 이메일처럼 보이는 내용이 있어요. 그 부분을 빼고 보내 주세요.',authExpired:false};
  if(code==='CONTRIBUTION_PENDING')return {message:'같은 위스키의 같은 항목이 아직 확인을 기다리고 있어요. 그 항목을 빼면 나머지는 보낼 수 있어요.',authExpired:false,showMine:true};
  if(code==='RATE_LIMITED')return {message:'오늘은 더 보낼 수 없어요. 내일 다시 알려주세요.',authExpired:false};
  if(code==='TARGET_NOT_FOUND')return {message:'고른 위스키를 찾을 수 없어요. 다시 검색해 주세요.',authExpired:false};
  if(code==='CONTRIBUTION_DISABLED'||status===503)return {message:'지금은 정보를 받을 수 없어요. 잠시 뒤에 다시 시도해 주세요. 입력한 내용은 그대로 있어요.',authExpired:false};
  if(status===400)return {message:'입력한 내용을 확인해 주세요.',authExpired:false};
  if(status===409)return {message:'이미 같은 내용이 접수됐어요. \'내가 알려준 정보\'에서 확인해 주세요.',authExpired:false,showMine:true};
  return {message:'보내지 못했어요. 입력한 내용은 그대로 있으니 다시 보내 주세요.',authExpired:false};
}

export type Part={key:string;label:string;kind?:'text'|'number'|'select'|'casks';options?:{value:string;label:string}[]};
const CASKS=[{value:'BOURBON',label:'버번'},{value:'SHERRY',label:'셰리'},{value:'WINE',label:'와인'},{value:'PORT',label:'포트'},
  {value:'RUM',label:'럼'},{value:'VIRGIN_OAK',label:'버진 오크'},{value:'OTHER',label:'기타'}];
/** Operator form: the parts each field's decided value has (matches the server registry). Coded values are chosen, not typed. */
export const decidedParts:Partial<Record<InformationReportField,Part[]>>={
  NAME:[{key:'brand',label:'브랜드'},{key:'expressionName',label:'제품명'}],
  DISTILLERY:[{key:'distillery',label:'증류소'}],
  CATEGORY_REGION:[{key:'category',label:'종류'},{key:'country',label:'국가'},{key:'region',label:'지역'}],
  AGE_STATEMENT:[{key:'ageStatementType',label:'표기',kind:'select',options:[{value:'NUMBERED',label:'숫자 연수 표기'},{value:'NAS',label:'연수 표기 없음(NAS)'}]},
    {key:'ageYears',label:'연수',kind:'number'}],
  ABV:[{key:'abv',label:'도수(%)',kind:'number'}],
  VOLUME:[{key:'volumeMl',label:'용량(ml)',kind:'number'}],
  EDITION:[{key:'edition',label:'에디션'},{key:'batchCode',label:'배치'}],
  BOTTLING_YEAR:[{key:'vintageYear',label:'증류(빈티지) 연도',kind:'number'},{key:'bottledYear',label:'병입 연도',kind:'number'}],
  BOTTLER:[{key:'bottlerName',label:'병입사'},{key:'independentBottling',label:'병입 방식',kind:'select',
    options:[{value:'',label:'모름'},{value:'true',label:'독립 병입'},{value:'false',label:'증류소 병입'}]}],
  RELEASE_TYPE:[{key:'releaseType',label:'출시 유형',kind:'select',options:[{value:'CORE',label:'정규'},{value:'LIMITED',label:'한정'},{value:'UNKNOWN',label:'모름'}]}],
  CASK:[{key:'maturationCasks',label:'숙성 통',kind:'casks',options:CASKS},{key:'finishCasks',label:'피니시 통',kind:'casks',options:CASKS}],
};

/** Field value as words for operators: part labels instead of keys, coded values translated. */
export function describeValue(field:InformationReportField,v:Record<string,string|null>|null|undefined):string {
  if(!v)return '—';
  const parts=decidedParts[field]??[];
  const text=Object.entries(v).filter(([,x])=>x!=null&&x!=='').map(([k,x])=>{
    const p=parts.find(q=>q.key===k);
    const shown=p?.kind==='casks'?String(x).split(',').map(c=>CASKS.find(o=>o.value===c)?.label??c).join(', ')
      :p?.options?.find(o=>o.value===x)?.label??(x==='UNKNOWN'?'모름':x);
    return `${p?.label??k}: ${shown}`;
  }).join(', ');
  return text||'(비어 있음)';
}

export const statusLabel:Record<ContributionStatus,string>={SUBMITTED:'새로 들어옴',IN_REVIEW:'검토 중',NEEDS_INFO:'추가 정보 대기',HELD:'보류',
  DECIDED:'반영 대기',APPLYING:'반영 중',APPLIED:'반영됨',APPLY_FAILED:'반영 실패',WITHDRAWN:'사용자 취소'};
export const decisionLabel:Record<ItemDecision,string>={PENDING:'미결정',APPROVED:'승인',SEPARATE_RELEASE:'다른 에디션(판)으로 등록',REJECTED:'거절',HELD:'보류'};
export const applyLabel:Record<ItemApply,string>={NONE:'미반영',APPLIED:'반영됨',FAILED:'반영 실패',CONFLICT:'다시 검토 필요(값이 바뀜)',REVERTED:'되돌림'};
export const evidenceTypes=[{value:'MANUFACTURER',label:'제조사'},{value:'BOTTLER',label:'병입사'},{value:'IMPORTER',label:'수입사'},
  {value:'LABEL_REGISTRY',label:'라벨 등록처'},{value:'RETAILER',label:'판매처'},{value:'COMMUNITY',label:'커뮤니티'},{value:'OTHER',label:'기타'}];

/** Field names the reverification evidence must state, in operator words. */
export const evidenceFieldLabel:Record<string,string>={brand:'브랜드',expressionName:'제품명',edition:'에디션',batchCode:'배치',
  vintageYear:'증류 연도',releaseYear:'출시 연도',abv:'도수(%)',volumeMl:'용량(ml)',ageStatementType:'숙성 표기',ageYears:'숙성 연수'};
export function adminFailure(code:string|null):string {
  const map:Record<string,string>={CONTRIBUTION_CHANGED:'다른 운영자가 먼저 처리했어요. 새로 고친 뒤 다시 확인하세요.',
    TARGET_CHANGED:'검토하는 동안 이 병의 정보가 바뀌었어요. 새로 고친 뒤 다시 확인하세요.',
    DOWNGRADE_CONFIRM_REQUIRED:'인증된 병이에요. 반영하면 재인증 전까지 확인된 정보에서 빠져요. 확인 칸을 체크하세요.',
    CREATE_CONFIRM_REQUIRED:'새 병으로 등록하려면 등록 확인 칸을 체크하세요.',INVALID_DECIDED_VALUE:'결정값 형식이 맞지 않아요.',
    REASON_REQUIRED:'처리 사유(내부)를 적어 주세요.',NAME_REQUIRED:'새 병은 이름(브랜드·제품명)을 승인해야 등록돼요.',
    RELEASE_KEY_REQUIRED:'다른 판으로 등록하려면 에디션·배치나 연도를 함께 승인하세요.',RELEASE_EXISTS:'같은 판이 이미 있어요.',
    MIXED_RELEASE:'정정과 다른 판 등록을 한 제보에서 함께 할 수 없어요.',PRODUCT_NAME_EXISTS:'같은 이름의 제품이 이미 있어요. 중복 제품으로 처리하세요.',
    NOTHING_TO_APPLY:'반영할 승인 항목이 없어요.',APPLY_FAILED:'반영하지 못했어요. 카탈로그는 바뀌지 않았어요. 다시 시도하세요.',
    ALREADY_CATALOG:'이미 카탈로그 병과 연결된 제보예요.',NOT_RETARGETABLE:'반영했거나 취소된 제보는 다른 병에 연결할 수 없어요.',
    TARGET_NOT_FOUND:'그 병을 찾을 수 없어요. 다시 검색하세요.',NOT_REVERIFIABLE:'검토 대기 상태인 병만 다시 인증할 수 있어요.',
    IDENTITY_KEY_MISSING:'이 병은 식별 키가 없어 다시 인증할 수 없어요.',SOURCE_NOT_TRUSTED:'다시 인증에는 제조사·병입사·수입사·라벨 등록처 근거만 쓸 수 있어요.',
    EVIDENCE_MISMATCH:'근거에 적은 값이 병의 현재 값과 달라요. 값을 확인하거나, 병 값을 먼저 정정하세요.',
    STALE_EVIDENCE_NOT_MARKED:'병 값과 어긋나는 옛 근거를 모두 체크해야 해요.',INVALID_EVIDENCE:'근거 주소(https)와 발행처를 확인하세요.',
    REVERIFY_CHECK_FAILED:'추천에 쓰는 기존 검증 검사를 통과하지 못했어요. 아무것도 바뀌지 않았어요. 근거 주소가 공식 페이지 주소인지 확인하세요.'};
  return (code&&map[code])||'처리하지 못했어요. 다시 시도하세요.';
}
