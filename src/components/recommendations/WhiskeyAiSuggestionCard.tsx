"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { whiskeyV3Api } from '@/api/whiskeyV3Api';
import { authApi } from '@/api/whiskeyApi';
import { ApiResponseError } from '@/api/apiClient';
import { toAiSuggestion } from '@/lib/recommendations/v3Contract';
import type { V3Response } from '@/lib/recommendations/v3Contract';
import type { WhiskeyFeedbackReason, WhiskeyFeedbackSentiment } from '@/type/ApiInterface';
import ExpectationFeedback from './ExpectationFeedback';
import { bilingualLabel } from './whiskeyPresentation';
import { aiKoreanName, displayExpression } from '@/lib/recommendations/aiPresentation';
import {useAuthStore} from '@/store/authStore';
import WhiskeyResultImage from './WhiskeyResultImage';
import WhiskeyResultBasicFacts from './WhiskeyResultBasicFacts';
import WhiskeyCollectedBottlingPanel from './WhiskeyCollectedBottlingPanel';
import {caskPreferenceNote} from '@/lib/recommendations/caskPreference';
import {bartenderPresentation} from '@/lib/recommendations/bartenderPresentation';
import {collectedBodyHidden,sourceReadFailure} from '@/lib/recommendations/collectedCandidate';
import {useCollectedLease} from '@/lib/recommendations/useCollectedLease';
import {refreshResultInformation,whiskeyResultInformation} from '@/lib/recommendations/whiskeyResultInformation';

export default function WhiskeyAiSuggestionCard({response,ownerUid}:{response:V3Response;ownerUid:number|null}) {
  const uid=useAuthStore(s=>s.user?.uid)??null;
  const id=toAiSuggestion(response)?.id;
  if(!id)return null;
  if(ownerUid==null||uid!==ownerUid)return <UnavailableRecommendation/>;
  return <WhiskeyAiSuggestionBody key={`${ownerUid}:${id}`} response={response} ownerUid={ownerUid}/>;
}
function UnavailableRecommendation({onRetry,busy=false,message,checking=false}:{onRetry?:()=>void;busy?:boolean;message?:string|null;checking?:boolean}) {
  return <section role="status" className="mx-auto w-full max-w-md rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 text-stone-900" aria-label="저장한 추천 확인">
    <h2 className="text-lg font-semibold">{checking?'저장한 추천을 확인하고 있어요':'저장한 추천을 확인할 수 없어요'}</h2>
    <p className="mt-3 text-sm leading-6">{checking?'로그인 상태를 확인하고 있어요. 잠시만 기다려 주세요.':'로그인한 계정과 추천 주소를 확인해 주세요.'}</p>
    {message&&<p role="status" className="mt-2 text-sm leading-6">{message}</p>}
    {onRetry&&<button type="button" disabled={busy} onClick={onRetry} className="mt-3 min-h-11 text-sm underline disabled:opacity-60">{busy?'확인하는 중…':'추천 정보 다시 확인'}</button>}
    {!checking&&<Link href="/login" target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-11 items-center text-sm underline">새 탭에서 다시 로그인</Link>}
  </section>;
}
function WhiskeyAiSuggestionBody({response,ownerUid}:{response:V3Response;ownerUid:number|null}) {
  const [currentResponse,setCurrentResponse]=useState(response);
  const requestVersion=useRef(0);const refreshing=useRef(false);
  useEffect(()=>()=>{requestVersion.current++;},[]);
  const [sourceBusy,setSourceBusy]=useState(false);
  const [sourceStatus,setSourceStatus]=useState<string|null>(null);
  const [sourceAuth,setSourceAuth]=useState(false);
  const [ownerUnavailable,setOwnerUnavailable]=useState(false);
  const [viewerConfirmed,setViewerConfirmed]=useState(false);
  const accessBlocked=useRef(false);
  const a=toAiSuggestion(currentResponse)??toAiSuggestion(response);
  const leaseNow=useCollectedLease(a?.candidateOrigin);
  const hidden=sourceReadFailure(currentResponse)==='RESTRICTED'||collectedBodyHidden(a,leaseNow);
  const [sentiment,setSentiment]=useState<WhiskeyFeedbackSentiment>('NEUTRAL');
  const [saved,setSaved]=useState<WhiskeyFeedbackSentiment|null>(null);
  const [reason,setReason]=useState<WhiskeyFeedbackReason>('NONE');const [comment,setComment]=useState('');
  const [busy,setBusy]=useState(true);const [status,setStatus]=useState<string|null>(null);const [auth,setAuth]=useState(false);
  const [loaded,setLoaded]=useState(false);const [reload,setReload]=useState(0);
  const id=a?.id;
  useEffect(()=>{
    if(!id||accessBlocked.current)return;
    const version=requestVersion.current;
    let active=true;setBusy(true);setLoaded(false);setStatus(null);setAuth(false);
    const current=()=>active&&version===requestVersion.current&&!accessBlocked.current&&(useAuthStore.getState().user?.uid??null)===ownerUid;
    void (async()=>{
      if(!await confirmOwner(current))return;
      const row=await whiskeyV3Api.aiFeedback(id,'EXPECTED',10000);
      if(!current()||!await confirmOwner(current))return;
      if(current()){
      setOwnerUnavailable(false);setViewerConfirmed(true);
      setSentiment(row?.feedback.sentiment ?? 'NEUTRAL');setSaved(row?.feedback.sentiment ?? null);
      setReason(row?.feedback.reason ?? 'NONE');setComment(row?.feedback.comment ?? '');setLoaded(true);
    }})().catch(e=>{if(current()){
      if(e instanceof ApiResponseError&&[401,403,404].includes(e.status)){denyAccess(e.status!==404);return;}
      denyAccess(false,true);
    }}).finally(()=>{if(current())setBusy(false);});
    return ()=>{active=false;};
  // The bound order owner and API clients are stable for this keyed card.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[id,reload,ownerUid]);
  if(!a)return null;
  const p=a.identity;
  const display=whiskeyResultInformation(a);
  const koreanName=aiKoreanName(p,a.localizedName);
  const introduction=bartenderPresentation(a.presentation.summary,a.servingSuggestion);
  const pref=response.requestSummary?.preferences;
  const differences=[
    pref?.category && !a.reasons?.includes('PROPOSED_CATEGORY_MATCH')?`선호하신 종류는 ${bilingualLabel('category',pref.category,null)}이며, 이번 한 잔은 ${bilingualLabel('category',p.category??null,null)||'종류 정보 없음'}이에요.`:null,
    pref?.country && !a.reasons?.includes('PROPOSED_COUNTRY_MATCH')?`선호하신 생산국은 ${bilingualLabel('country',pref.country,null)}이며, 이번 한 잔은 ${bilingualLabel('country',p.country??null,null)||'생산국 정보 없음'}이에요.`:null,
    pref?.region && !a.reasons?.includes('PROPOSED_REGION_MATCH')?`선호하신 산지는 ${pref.region}이며, 이번 한 잔의 산지는 ${p.region||'정보 없음'}이에요.`:null,
    pref?.targetAbv!=null && !a.reasons?.includes('PROPOSED_ABV_MATCH')?`선호하신 도수는 ${pref.targetAbv}%이며, 이번 한 잔의 도수는 ${p.abv==null?'정보 없음':p.abv+'%'}이에요.`:null,
    pref?.maturationCask?caskPreferenceNote('숙성 통',pref.maturationCask,display.bottling.find(b=>b.field==='maturationCask')):null,
    pref?.finishCask?caskPreferenceNote('피니시 통',pref.finishCask,display.bottling.find(b=>b.field==='finishCask')):null,
  ].filter(Boolean);
  function denyAccess(authRequired=false,temporary=false){
    requestVersion.current++;accessBlocked.current=true;refreshing.current=false;
    setOwnerUnavailable(true);setViewerConfirmed(false);setLoaded(false);setBusy(false);setSourceBusy(false);
    setSentiment('NEUTRAL');setSaved(null);setReason('NONE');setComment('');setStatus(null);setAuth(false);
    setSourceAuth(authRequired);setSourceStatus(temporary?'저장한 추천 정보를 확인하지 못했어요. 잠시 뒤 다시 확인해 주세요.':authRequired?'다시 로그인한 뒤 저장한 추천을 확인해 주세요.':null);
  }
  async function confirmOwner(current:()=>boolean):Promise<boolean>{
    try{
      const viewer=await authApi.me(5000);if(!current())return false;
      if(!viewer.authenticated||viewer.uid!==ownerUid){denyAccess(!viewer.authenticated);return false;}
      return true;
    }catch(error){if(current())denyAccess(error instanceof ApiResponseError&&[401,403].includes(error.status),true);return false;}
  }
  function restoreAccess(){
    if(!accessBlocked.current)return;
    accessBlocked.current=false;setViewerConfirmed(false);setLoaded(false);setReload(n=>n+1);
  }
  async function refreshSources(){
    if(!id||!a||refreshing.current)return;
    // A new explicit check supersedes any feedback still pending behind the privacy gate.
    if(ownerUnavailable){requestVersion.current++;accessBlocked.current=true;setBusy(false);}
    refreshing.current=true;const version=requestVersion.current;
    const current=()=>version===requestVersion.current&&(useAuthStore.getState().user?.uid??null)===ownerUid;
    setSourceBusy(true);setSourceStatus(null);setSourceAuth(false);
    try{
      if(!await confirmOwner(current))return;
      const next=await whiskeyV3Api.byId(id);if(!current()||!await confirmOwner(current))return;
      const failure=sourceReadFailure(next);
      if(failure==='RESTRICTED'){setCurrentResponse(next);restoreAccess();setSourceStatus('제품 정보를 다시 확인해야 해요. 저장한 첫인상은 유지돼요.');return;}
      if(failure==='TEMPORARY'){setSourceStatus('제품 정보를 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요.');return;}
      const card=toAiSuggestion(next);if(!card||card.id!==id)throw new Error('INVALID_SAVED_RESPONSE');
      const result=refreshResultInformation(a,card);setCurrentResponse({...response,aiSuggestion:result.card});
      restoreAccess();
      setSourceStatus(result.unavailable?'일부 제품 정보를 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요.':result.changed?'제품 정보가 업데이트됐어요.':'표시할 정보에 변경이 없어요.');
    }catch(error){if(!current())return;const expired=error instanceof ApiResponseError&&(error.status===401||error.status===403);
      if(error instanceof ApiResponseError&&(expired||error.status===404)){denyAccess(expired);return;}
      setSourceAuth(expired);setSourceStatus(expired?'로그인이 만료되었어요. 다시 로그인한 뒤 제품 정보를 확인해 주세요.':'제품 정보를 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요.');
    }finally{if(current()){refreshing.current=false;setSourceBusy(false);}}
  }
  async function save(){if(!id || busy || !loaded||accessBlocked.current)return;
    const version=requestVersion.current;const current=()=>version===requestVersion.current&&!accessBlocked.current&&(useAuthStore.getState().user?.uid??null)===ownerUid;
    setBusy(true);setStatus(null);setAuth(false);
    try {if(!await confirmOwner(current))return;
      const row=await whiskeyV3Api.saveAiFeedback(id,'EXPECTED',{sentiment,reason:sentiment==='NEUTRAL'?'NONE':reason,
      comment:sentiment!=='NEUTRAL' && reason==='OTHER'?comment.trim()||null:null});if(!current()||!await confirmOwner(current))return;setSaved(row.feedback.sentiment??null);setStatus('첫인상을 저장했어요. 실제 시음 후기와는 따로 보관해요.');}
    catch(e){if(!current())return;if(e instanceof ApiResponseError&&[401,403,404].includes(e.status)){denyAccess(e.status!==404);return;}
      setStatus('저장하지 못했어요. 선택은 그대로예요. 다시 시도해 주세요.');}
    finally{if(current())setBusy(false);}
  }
  if(ownerUnavailable||!viewerConfirmed)return <UnavailableRecommendation checking={sourceBusy||busy} onRetry={ownerUnavailable?()=>void refreshSources():undefined} busy={sourceBusy} message={sourceStatus}/>;
  return <div className="mx-auto flex w-full max-w-md flex-col items-center px-4">
    <article className="w-full break-words rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 text-stone-900 shadow-xl md:p-10">
      {hidden?<div><h2 className="text-lg font-semibold">제품 정보를 다시 확인해 주세요</h2>
        <p className="mt-3 text-sm leading-6">저장한 같은 추천의 제품 정보를 다시 확인해요. 첫인상은 그대로 유지돼요.</p>
        <button type="button" disabled={sourceBusy} onClick={()=>void refreshSources()} className="mt-3 min-h-11 text-sm underline disabled:opacity-60">{sourceBusy?'불러오는 중…':'제품 정보 다시 확인'}</button>
        {sourceStatus&&<p role="status" className="mt-2 text-sm">{sourceStatus}</p>}
        {sourceAuth&&<Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm underline">새 탭에서 다시 로그인</Link>}
        <Link href={`/notes/ai/${a.id}`} className="mt-2 flex min-h-11 items-center text-sm underline">내 시음 기록 열기</Link>
      </div>:<>
      <h2 className="text-[22px] font-semibold leading-snug tracking-tight md:text-2xl">{p.brand} {displayExpression(p.expression)}</h2>
      {koreanName && <p lang="ko" className="mt-2 text-[13px] leading-5 text-stone-700">{koreanName}</p>}
      {p.edition && <p className="mt-2 text-sm">{p.edition}</p>}
      <WhiskeyResultImage identity={p}/>
      <WhiskeyResultBasicFacts display={display} beginner={response.appliedLevel==='BEGINNER'} notice={a.notice}/>
      {(p.independentBottling || p.oldBottle) && <p className="mt-4 text-sm font-semibold">{[p.independentBottling?'독립 병입':null,p.oldBottle?'올드바틀':null].filter(Boolean).join(' · ')}</p>}
      <h3 className="mt-6 border-t border-[#4a3728]/25 pt-4 font-bold">오늘 권해드리는 한 잔</h3>
      <div className="mt-3 space-y-2 text-sm leading-7">{introduction.introduction.map((text,i)=><p key={i}>{text}</p>)}
        <p className="pt-1"><span className="font-semibold">곁들이면 좋은 한 입 · </span>{introduction.food}</p>
      </div>
      <WhiskeyCollectedBottlingPanel display={display}>
      <button type="button" disabled={sourceBusy} className="mt-3 min-h-11 py-2 text-left text-xs font-semibold underline disabled:opacity-60"
        onClick={()=>void refreshSources()}>{sourceBusy?'불러오는 중…':'제품 정보 다시 확인'}</button>
      {sourceStatus && <p role="status" className="text-xs leading-5 text-stone-600">{sourceStatus}</p>}
      {sourceAuth && <Link href="/login" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-xs underline">새 탭에서 다시 로그인</Link>}
      </WhiskeyCollectedBottlingPanel>
      {differences.length>0 && <div className="mt-5 border-t border-[#4a3728]/25 pt-4 text-sm leading-6"><h3 className="font-semibold">추천 당시 취향 비교</h3>
        <p className="mt-2 text-xs text-stone-600">추천 당시 선택한 조건과 비교했어요.</p>
        {differences.map(text=><p key={text} className="mt-2">{text}</p>)}</div>}
      <Link href={`/notes/ai/${a.id}`} className="mt-6 block min-h-11 border border-[#4a3728] px-3 py-3 text-center text-sm font-semibold">마신 뒤 시음 기록 남기기</Link>
      <p className="mt-2 text-xs leading-5 text-stone-600">내 시음 노트 목록에서 이 추천을 다시 찾을 수 있어요.</p>
      </>}
    </article>
    {hidden&&<p className="mt-4 w-full text-sm text-stone-200">이전에 남긴 첫인상을 확인하거나 수정할 수 있어요.</p>}
    {!loaded ? <div className="mt-6 w-full rounded border border-[#4a3728] bg-[#efe2c9] p-5 text-sm text-stone-900">
      <p role="status">{busy?'저장한 첫인상을 확인하고 있어요…':status}</p>
      {!busy && (auth?<Link href="/login" className="mt-2 inline-flex min-h-11 items-center underline">다시 로그인</Link>:
        <button onClick={()=>setReload(n=>n+1)} className="mt-2 min-h-11 underline">첫인상 다시 불러오기</button>)}
    </div> : <ExpectationFeedback sentiment={sentiment} reason={reason} savedSentiment={saved} loading={busy} status={status} authExpired={auth}
      comment={comment} onComment={setComment} onSentiment={v=>{setSentiment(v);setReason('NONE');setComment('');setStatus(null);}}
      onReason={v=>{setReason(v);setComment('');setStatus(null);}} onSave={()=>void save()}/>}
  </div>;
}
