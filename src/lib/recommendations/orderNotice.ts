/** 주문 안내 중 사용자가 행동해야 다음으로 갈 수 있는 것만 모달로 띄운다. 나머지는 안내 칸에만 둔다. */
export type OrderNoticeKind='AUTH'|'DAILY_LIMITED'|'RECOVER';

const RECOVER_CODES=new Set(['RECOVER','RESULT_SAVE_UNCONFIRMED','RECOMMENDATION_BUSY','RESULT_UNCONFIRMED']);

export function orderNoticeKind(code:string|null,authRequired:boolean):OrderNoticeKind|null {
  if(authRequired||code==='AUTH_REQUIRED')return 'AUTH';
  if(code==='DAILY_LIMITED')return 'DAILY_LIMITED';
  if(code&&RECOVER_CODES.has(code))return 'RECOVER';
  return null;
}
