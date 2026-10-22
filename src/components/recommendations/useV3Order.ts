import { useEffect, useRef, useState } from 'react';
import { ApiResponseError } from '../../api/apiClient';
import { whiskeyV3Api } from '../../api/whiskeyV3Api';
import { isV3Response, toV3Request, toVerifiedCard, toAiSuggestion } from '../../lib/recommendations/v3Contract';
import type { V3Response } from '../../lib/recommendations/v3Contract';
import type { WhiskeyCandidateRequest, WhiskeyVerifiedRecommendationResponse } from '../../type/ApiInterface';
import { logVerifiedResponse } from '../../lib/recommendations/debugResponse';

const messages: Record<string,string> = {
  UNRECEIVED_REQUEST_CLOSED:'이전 주문의 뒤늦은 접수를 막는 확인을 마쳤어요. 원하시면 새 주문을 넣어주세요.',
  REQUEST_ROUTE_CONFLICT:'다른 추천 방식에서 접수한 주문이에요. 원래 추천 화면에서 결과를 확인해 주세요.',
  ADMISSION_UNAVAILABLE:'지금은 주문을 안전하게 접수할 수 없어요. 잠시 뒤 다시 시도해 주세요.',
  RECOMMENDATION_BUSY:'아직 살펴보는 주문이 있어요. 잠시 기다린 뒤 다시 확인해 주세요.',
  V3_DISABLED:'새 추천 접수가 잠시 닫혀 있어요. 이전 주문 결과는 계속 확인할 수 있어요.',
  AI_SUGGESTION_DISABLED:'AI 추천 접수가 잠시 닫혀 있어요. 저장된 추천과 시음 기록은 계속 볼 수 있어요.',
  INTERRUPTED_REQUEST:'이 주문은 완료되지 않았어요. 조건을 확인하고 새 주문을 넣어주세요.',
  DAILY_LIMITED:'오늘 이용할 수 있는 추천을 모두 사용했어요.',
  RATE_LIMITED:'잠시 기다린 뒤 다시 요청해 주세요.',
  AI_RESULT_SAVE_FAILED:'이번 추천을 저장하지 못했어요. 추천 횟수는 사용하지 않았어요. 조건을 확인하고 새 주문을 넣어주세요.',
  RESULT_SAVE_UNCONFIRMED:'추천 저장과 횟수 처리를 확인하고 있어요. 새 주문 대신 이전 주문 결과를 확인해 주세요.',
  HISTORICAL_EVIDENCE_NOT_CURRENT:'이전 추천의 제품 정보를 다시 확인해야 해요. 당시 기록은 시음 노트에서 볼 수 있어요.',
};
export function useV3Order(uid: number | undefined, enabled: boolean,
  onSuccess:(card:WhiskeyVerifiedRecommendationResponse, response:V3Response)=>void,
  onAiSuccess?:(response:V3Response)=>void) {
  const [pending,setPending]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);
  const [historicalId,setHistoricalId]=useState<number|null>(null);
  const [busy,setBusy]=useState(false);
  const [authRequired,setAuthRequired]=useState(false);
  const [missing,setMissing]=useState(false);
  const running=useRef(false); const owner=useRef(uid); owner.current=uid;
  const storageKey=uid ? `rwhiskey:order:v3:${uid}` : null;
  useEffect(()=>{
    setPending(null);setMessage(null);setHistoricalId(null);setAuthRequired(false);setMissing(false);
    if(!storageKey)return;
    try {
      const saved=sessionStorage.getItem(storageKey);
      if(saved && /^[A-Za-z0-9_-]{8,80}$/.test(saved)){setPending(saved);setMessage('이전 주문이 있어요. 결과를 확인하면 새 호출 없이 저장된 주문을 찾아요.');}
    } catch { setMessage('이 브라우저에서는 주문 복구 정보를 보관할 수 없어요. 화면을 닫기 전에 결과를 확인해 주세요.'); }
  },[storageKey,enabled]);
  function remember(key:string|null) {
    setPending(key);
    if(storageKey)try {if(key)sessionStorage.setItem(storageKey,key);else sessionStorage.removeItem(storageKey);} catch { /* In-memory recovery remains available. */ }
  }
  function accept(response:V3Response) {
    if(toAiSuggestion(response) && onAiSuccess){remember(null);setMessage(null);setHistoricalId(null);onAiSuccess(response);return;}
    const card=toVerifiedCard(response);
    if(card){remember(null);setMessage(null);setHistoricalId(null);onSuccess(card,response);return;}
    if(response.state==='SUCCESS'){setMessage('저장된 추천 정보를 확인하지 못했어요. 이전 주문 결과를 다시 확인해 주세요.');return;}
    setHistoricalId(response.historicalRecordId ?? null);
    if(response.nextAction!=='RECOVER')remember(null);
    setMessage(messages[response.code ?? ''] ?? (response.nextAction==='RECOVER'
      ? '주문 처리 결과를 아직 확인 중이에요. 새 주문 대신 이전 주문 결과를 확인해 주세요.'
      : response.state==='UNAVAILABLE' ? '지금은 추천 서비스를 이용할 수 없어요. 잠시 뒤 다시 시도해 주세요.'
      : response.state==='NEEDS_CLARIFICATION' ? '입력한 조건을 다시 확인해 주세요.'
      : response.state==='NO_MATCH' ? '선택한 조건에 맞는 추천 후보를 고르지 못했어요. 조건은 유지돼요. 다시 살펴보고 새 주문을 넣어주세요.'
      : '제품의 병입 정보를 충분히 확인하지 못해 이번 추천을 보류했어요. 제품이 없다는 뜻은 아니에요. 선택한 조건은 그대로 유지돼요.'));
  }
  async function run(request?:WhiskeyCandidateRequest,closeMissing=false) {
    if(!uid || running.current)return;
    const requestOwner=uid;running.current=true;setBusy(true);setMessage(null);setAuthRequired(false);
    const operation=pending ? closeMissing ? 'close-unreceived' : 'recover' : 'recommend';
    // Preserve a known missing order across authentication/transport failures until the server resolves it.
    if(!pending)setMissing(false);
    try {
      let response:V3Response;
      if(pending) response=closeMissing ? await whiskeyV3Api.closeUnreceived(pending) : await whiskeyV3Api.recover(pending);
      else {
        if(!request)return;
        const payload=toV3Request(request);const key=crypto.randomUUID();remember(key);
        response=await (process.env.NEXT_PUBLIC_WHISKEY_AI_SUGGESTION_ENABLED === 'true' ? whiskeyV3Api.suggest(payload,key) : whiskeyV3Api.recommend(payload,key));
      }
      if(owner.current!==requestOwner)return;
      logVerifiedResponse('V3',operation,response);
      if(!isV3Response(response))throw new Error('INVALID_RESPONSE');
      setMissing(false);
      accept(response);
    } catch(e) {
      if(owner.current!==requestOwner)return;
      if(e instanceof ApiResponseError)logVerifiedResponse('V3',`${operation}-error`,e.data,e.status);
      if(e instanceof ApiResponseError && e.status===401) {setAuthRequired(true);setMessage('다시 로그인한 뒤 이전 주문 결과를 확인해 주세요.');}
      else if(e instanceof ApiResponseError && e.status===403)setMessage('화면을 새로고침해 요청 인증을 갱신한 뒤 이전 주문 결과를 확인해 주세요.');
      else if(closeMissing){setMissing(true);setMessage('서버에서 이전 주문 확인을 종료하지 못했어요. 주문 키는 보관 중이에요. 잠시 뒤 다시 확인해 주세요.');}
      else if(e instanceof ApiResponseError && isV3Response(e.data)) {
        // A missing ledger row does not prove the POST was never received. Do not dispatch it again.
        if(e.status===404){setMissing(true);setMessage('이 계정에서 이전 주문을 찾지 못했어요. 다시 확인하거나 서버에서 이전 주문 확인을 종료해 주세요.');}
        else if(e.data.state==='SUCCESS')setMessage('저장 결과와 응답 상태가 달라요. 이전 주문 결과를 다시 확인해 주세요.');
        else accept(e.data);
      } else setMessage('연결 또는 저장 결과를 확인하지 못했어요. 새 주문을 보내지 말고 이전 주문 결과를 확인해 주세요.');
    } finally {running.current=false;setBusy(false);}
  }
  return { pending,message,historicalId,busy,authRequired,missing,run,closeMissing:()=>run(undefined,true) };
}
