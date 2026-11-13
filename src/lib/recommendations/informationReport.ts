import type {InformationReportField,InformationReportSource} from '@/api/whiskeyV3Api';
import type {CollectedBasicFieldName} from './collectedBottlingInformation';

export const reportFieldOptions:{value:InformationReportField;label:string}[]=[
  {value:'AGE_STATEMENT',label:'숙성 연수'},{value:'ABV',label:'도수'},{value:'CATEGORY_REGION',label:'종류·산지'},
  {value:'CASK',label:'숙성·피니시 통'},{value:'NAME',label:'이름 표기'},{value:'PHOTO_MISMATCH',label:'사진이 다른 병'},{value:'OTHER',label:'기타'},
];
export const reportSourceOptions:{value:InformationReportSource;label:string}[]=[
  {value:'LABEL',label:'병 라벨을 직접 봤어요'},{value:'OFFICIAL_SITE',label:'공식 사이트'},{value:'RETAILER',label:'판매처'},{value:'MEMORY',label:'기억'},
];
export const REPORT_MAX_LENGTH=300;

/** 결과 카드 기본 정보 칸에서 열었을 때 미리 고를 제보 항목. */
export function reportFieldForFact(field:CollectedBasicFieldName):InformationReportField {
  return field==='abv'?'ABV':field==='age'?'AGE_STATEMENT':'CATEGORY_REGION';
}

/** 서버 규칙과 같은 기준: 사진 오류만 내용 생략 가능, 그 외 2~300자. */
export function reportReady(field:InformationReportField|null,content:string):boolean {
  if(!field)return false;
  const length=[...content.trim()].length;
  if(length===0)return field==='PHOTO_MISMATCH';
  return length>=2&&length<=REPORT_MAX_LENGTH;
}

/** 실패 응답을 사용자 문구로. authExpired면 새 탭 로그인 안내를 함께 보여 준다. */
export function reportFailure(status:number|null,code:string|null):{message:string;authExpired:boolean} {
  if(status===401||status===403)return {message:'로그인이 만료되었어요. 새 탭에서 다시 로그인한 뒤 보내 주세요. 입력한 내용은 그대로 있어요.',authExpired:true};
  if(code==='INFORMATION_REPORT_PERSONAL_DATA')return {message:'연락처나 이메일처럼 보이는 내용이 있어요. 그 부분을 빼고 보내 주세요.',authExpired:false};
  if(code==='INFORMATION_REPORT_PENDING')return {message:'이 병의 같은 항목에 대해 보내주신 내용이 이미 확인을 기다리고 있어요.',authExpired:false};
  if(code==='RATE_LIMITED')return {message:'오늘은 더 보낼 수 없어요. 내일 다시 알려주세요.',authExpired:false};
  if(status===404)return {message:'이 추천에 대해서는 보낼 수 없어요.',authExpired:false};
  if(status===400)return {message:'입력한 내용을 확인해 주세요.',authExpired:false};
  return {message:'보내지 못했어요. 입력한 내용은 그대로 있으니 다시 보내 주세요.',authExpired:false};
}
