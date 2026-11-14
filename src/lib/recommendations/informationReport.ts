import type {InformationReportField,InformationReportSource} from '@/api/whiskeyV3Api';
import type {CollectedBasicFieldName} from './collectedBottlingInformation';

export interface ReportFieldOption {value:InformationReportField;label:string;placeholder:string}
/** DB의 병·병입 정보 칸을 기준으로 묶은 제보 항목. 한 번에 여러 개를 고를 수 있다. */
export const reportFieldGroups:{title:string;options:ReportFieldOption[]}[]=[
  {title:'기본 정보',options:[
    {value:'NAME',label:'이름 표기',placeholder:"예: 라벨에 'Old Pulteney 12'로 적혀 있어요"},
    {value:'DISTILLERY',label:'증류소',placeholder:'예: Pulteney Distillery'},
    {value:'CATEGORY_REGION',label:'종류·산지',placeholder:'예: 싱글 몰트, 하이랜드'},
    {value:'AGE_STATEMENT',label:'숙성 연수',placeholder:"예: 라벨에 'Aged 12 Years'"},
    {value:'ABV',label:'도수',placeholder:'예: 46%'},
    {value:'CASK',label:'숙성·피니시 통',placeholder:'예: 버번 캐스크 숙성, 셰리 캐스크 피니시'},
  ]},
  {title:'병입 정보',options:[
    {value:'EDITION',label:'에디션·배치',placeholder:'예: Batch 7'},
    {value:'BOTTLING_YEAR',label:'증류·병입 연도',placeholder:'예: 2014년 증류, 2023년 병입'},
    {value:'VOLUME',label:'용량',placeholder:'예: 700ml'},
    {value:'BOTTLER',label:'병입사·독립 병입',placeholder:'예: Gordon & MacPhail 독립 병입'},
    {value:'RELEASE_TYPE',label:'한정·정규 여부',placeholder:'예: 3,000병 한정'},
  ]},
  {title:'그 밖에',options:[
    {value:'FLAVOR',label:'향·맛 인상',placeholder:'예: 바닐라와 바다 내음이 먼저 와요'},
    {value:'PHOTO_MISMATCH',label:'사진이 다른 병',placeholder:'어떤 점이 다른지 적어 주셔도 돼요'},
    {value:'OTHER',label:'기타',placeholder:'알고 계신 내용을 적어 주세요'},
  ]},
];
export const reportFieldOptions=reportFieldGroups.flatMap(g=>g.options);
export const reportFieldLabel=(field:InformationReportField)=>reportFieldOptions.find(o=>o.value===field)?.label??field;
export const reportSourceOptions:{value:InformationReportSource;label:string}[]=[
  {value:'LABEL',label:'병 라벨을 직접 봤어요'},{value:'OFFICIAL_SITE',label:'공식 사이트'},{value:'RETAILER',label:'판매처'},{value:'MEMORY',label:'기억'},
];
export const REPORT_MAX_LENGTH=300;

/** 결과 카드 기본 정보 칸에서 열었을 때 미리 고를 제보 항목. */
export function reportFieldForFact(field:CollectedBasicFieldName):InformationReportField {
  return field==='abv'?'ABV':field==='age'?'AGE_STATEMENT':'CATEGORY_REGION';
}

/** 서버 규칙과 같은 기준: 사진 오류만 내용 생략 가능, 그 외 2~300자. */
export function reportItemReady(field:InformationReportField,content:string):boolean {
  const length=[...content.trim()].length;
  if(length===0)return field==='PHOTO_MISMATCH';
  return length>=2&&length<=REPORT_MAX_LENGTH;
}

/** 고른 항목이 하나 이상이고 모두 보낼 수 있을 때만 참. 서버도 한 항목이라도 틀리면 전부 거절한다. */
export function reportReady(selected:InformationReportField[],contents:Partial<Record<InformationReportField,string>>):boolean {
  return selected.length>0&&selected.every(field=>reportItemReady(field,contents[field]??''));
}

/** 실패 응답을 사용자 문구로. authExpired면 새 탭 로그인 안내를 함께 보여 준다. */
export function reportFailure(status:number|null,code:string|null):{message:string;authExpired:boolean} {
  if(status===401||status===403)return {message:'로그인이 만료되었어요. 새 탭에서 다시 로그인한 뒤 보내 주세요. 입력한 내용은 그대로 있어요.',authExpired:true};
  if(code==='INFORMATION_REPORT_PERSONAL_DATA')return {message:'연락처나 이메일처럼 보이는 내용이 있어요. 그 부분을 빼고 보내 주세요.',authExpired:false};
  if(code==='INFORMATION_REPORT_PENDING')return {message:'고르신 항목은 모두 이미 보내주셔서 확인을 기다리고 있어요.',authExpired:false};
  if(code==='RATE_LIMITED')return {message:'오늘은 더 보낼 수 없어요. 내일 다시 알려주세요.',authExpired:false};
  if(status===404)return {message:'이 추천에 대해서는 보낼 수 없어요.',authExpired:false};
  if(status===400)return {message:'입력한 내용을 확인해 주세요.',authExpired:false};
  return {message:'보내지 못했어요. 입력한 내용은 그대로 있으니 다시 보내 주세요.',authExpired:false};
}
