"use client";
import { displayExpression } from '@/lib/recommendations/aiPresentation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { whiskeyV3Api } from '@/api/whiskeyV3Api';
import type { AiFeedbackInput } from '@/api/whiskeyV3Api';
import { useAuthStore } from '@/store/authStore';
import { toAiSuggestion } from '@/lib/recommendations/v3Contract';
import { ApiResponseError } from '@/api/apiClient';
import type { AiSuggestionCard } from '@/lib/recommendations/v3Contract';
import WhiskeyResultBasicFacts from '@/components/recommendations/WhiskeyResultBasicFacts';
import WhiskeyCollectedBottlingPanel from '@/components/recommendations/WhiskeyCollectedBottlingPanel';
import {collectedBodyHidden,sourceReadFailure} from '@/lib/recommendations/collectedCandidate';
import {useCollectedLease} from '@/lib/recommendations/useCollectedLease';
import {refreshResultInformation,whiskeyResultInformation} from '@/lib/recommendations/whiskeyResultInformation';

export default function AiTastingNotePage(){
  const params=useParams<{operationId:string}>();const id=params.operationId;
  const uid=useAuthStore(s=>s.user?.uid);const initialized=useAuthStore(s=>s.isInitialized);const fetchUser=useAuthStore(s=>s.fetchUser);
  const owner=useRef({uid,id});owner.current={uid,id};const generation=useRef(0);
  const [name,setName]=useState('');const [note,setNote]=useState<AiFeedbackInput>({});
  const [product,setProduct]=useState<AiSuggestionCard|null>(null);
  const [recordLoaded,setRecordLoaded]=useState(false);const [restricted,setRestricted]=useState(false);
  const leaseNow=useCollectedLease(product?.candidateOrigin);
  const hidden=restricted||collectedBodyHidden(product,leaseNow);
  const [sourceBusy,setSourceBusy]=useState(false);const [sourceStatus,setSourceStatus]=useState<string|null>(null);
  const [busy,setBusy]=useState(true);const [status,setStatus]=useState<string|null>(null);const [auth,setAuth]=useState(false);
  const [reload,setReload]=useState(0);const [loadError,setLoadError]=useState(false);
  useEffect(()=>{if(!initialized)void fetchUser();},[initialized,fetchUser]);
  useEffect(()=>{
    generation.current++;setRecordLoaded(false);setRestricted(false);
    let active=true;setName('');setProduct(null);setSourceBusy(false);setSourceStatus(null);setNote({});setBusy(true);setStatus(null);setAuth(false);setLoadError(false);
    if(!initialized)return;
    if(!uid){setBusy(false);setAuth(true);setStatus('로그인한 뒤 본인의 시음 기록을 확인해 주세요.');return;}
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)){setBusy(false);setStatus('올바르지 않은 추천 주소예요.');return;}
    void Promise.all([whiskeyV3Api.byId(id),whiskeyV3Api.aiFeedback(id,'CONSUMED')]).then(([response,saved])=>{
      const card=toAiSuggestion(response);if(!card&&!sourceReadFailure(response))throw new Error('INVALID_AI_RECORD');
      if(active){setName(card?`${card.identity.brand} ${displayExpression(card.identity.expression)}`:'');setProduct(card);setRestricted(!card);setRecordLoaded(true);setNote(saved?.feedback??{});}
    }).catch(e=>{if(active){const expired=e instanceof ApiResponseError&&(e.status===401||e.status===403);setLoadError(true);setStatus(expired?'로그인을 다시 확인한 뒤 시음 기록을 불러와 주세요.':e instanceof ApiResponseError && e.status===404 ? '이 계정에서 해당 AI 추천 기록을 찾지 못했어요. 주소와 계정을 확인해 주세요.' : '시음 기록을 불러오지 못했어요. 잠시 뒤 다시 불러와 주세요.');setAuth(expired);}})
      .finally(()=>{if(active)setBusy(false);});
    return ()=>{active=false;};
  },[id,uid,initialized,reload]);
  async function refreshSources(){
    if(!uid||sourceBusy)return;const requestOwner=uid;const version=generation.current;
    const current=()=>owner.current.uid===requestOwner && owner.current.id===id && generation.current===version;
    setSourceBusy(true);setSourceStatus(null);
    try{const response=await whiskeyV3Api.byId(id);if(!current())return;
      const failure=sourceReadFailure(response);
      if(failure==='RESTRICTED'){setRestricted(true);setSourceStatus('제품 정보를 다시 확인해야 해요. 작성 중인 내용은 유지돼요.');return;}
      if(failure==='TEMPORARY'){setSourceStatus('제품 정보를 불러오지 못했어요. 작성 중인 내용은 유지돼요.');return;}
      const card=toAiSuggestion(response);
      if(!card||card.id!==id)throw new Error('INVALID_AI_RECORD');
      const result=product?refreshResultInformation(product,card):{card,unavailable:false,changed:true};setProduct(result.card);setName(`${card.identity.brand} ${displayExpression(card.identity.expression)}`);setRestricted(false);
      setSourceStatus(result.unavailable?result.changed?'제품 정보가 업데이트됐지만 일부 정보를 불러오지 못했어요. 작성 중인 내용은 유지돼요.':'일부 제품 정보를 불러오지 못했어요. 작성 중인 내용은 유지돼요.':result.changed?'제품 정보가 업데이트됐어요.':'표시할 정보에 변경이 없어요.');
    }catch(error){if(current()){setSourceStatus('제품 정보를 불러오지 못했어요. 작성 중인 내용은 유지돼요. 잠시 뒤 다시 확인해 주세요.');setAuth(error instanceof ApiResponseError&&(error.status===401||error.status===403));}}
    finally{if(current())setSourceBusy(false);}
  }
  async function save(e:React.FormEvent){e.preventDefault();if(busy||!recordLoaded||!uid)return;const requestOwner=uid;const version=generation.current;
    const current=()=>owner.current.uid===requestOwner && owner.current.id===id && generation.current===version;
    setBusy(true);setStatus(null);
    try{const row=await whiskeyV3Api.saveAiFeedback(id,'CONSUMED',note);if(!current())return;setNote(row.feedback);setStatus('실제 시음 기록을 저장했어요. 첫인상과는 따로 보관해요.');}
    catch(e){if(!current())return;setStatus('저장하지 못했어요. 입력은 유지돼요. 다시 시도해 주세요.');setAuth(e instanceof ApiResponseError && e.status===401);}
    finally{if(current())setBusy(false);}
  }
  const field='mt-2 min-h-11 w-full rounded border border-[#4a3728]/40 bg-white/50 p-3';
  const display=product&&!hidden?whiskeyResultInformation(product,leaseNow):null;
  return <main className="min-h-dvh bg-[#1a120d] px-4 py-8 text-stone-900"><div className="mx-auto max-w-xl rounded border border-[#4a3728] bg-[#efe2c9] p-6">
    <Link href="/notes" className="inline-flex min-h-11 items-center text-sm underline">내 시음 노트로</Link>
    <h1 className="mt-4 font-serif text-2xl font-bold">마신 뒤 남기는 한 잔의 기록</h1>
    <p className="mt-3 break-words font-semibold">{!hidden?name:''}</p>
    <p className="mt-3 text-xs leading-6">추천으로 만난 한 잔에 대한 나의 시음 기록이에요.</p>
    {hidden&&<div className="mt-4 rounded border border-[#4a3728]/30 p-4"><p className="text-sm leading-6">제품 정보를 다시 확인해 주세요. 작성 중인 시음 기록은 계속 저장할 수 있어요.</p>
      <button disabled={sourceBusy} onClick={()=>void refreshSources()} className="mt-2 min-h-11 text-sm underline">{sourceBusy?'불러오는 중…':'제품 정보 다시 확인'}</button>
      {sourceStatus&&<p role="status" className="text-sm leading-6">{sourceStatus}</p>}
    </div>}
    {display&&<>
      <WhiskeyResultBasicFacts display={display}/>
      <WhiskeyCollectedBottlingPanel display={display}>
        <button disabled={sourceBusy} onClick={()=>void refreshSources()} className="mt-3 min-h-11 text-sm underline disabled:opacity-60">{sourceBusy?'불러오는 중…':'제품 정보 다시 확인'}</button>
        {sourceStatus&&<p role="status" className="mt-3 text-sm leading-6">{sourceStatus}</p>}
      </WhiskeyCollectedBottlingPanel>
    </>}
    {status && <p role="status" className="mt-4 text-sm leading-6">{status}</p>}
    {auth && <Link href="/login" target="_blank" rel="noopener noreferrer" className="my-3 inline-flex min-h-11 items-center underline">새 탭에서 다시 로그인</Link>}
    {loadError && <button disabled={busy} onClick={()=>setReload(n=>n+1)} className="mt-3 min-h-11 underline">기록 다시 불러오기</button>}
    {busy && !name && <p role="status" className="mt-4">기록을 불러오고 있어요…</p>}
    {recordLoaded && <form onSubmit={save} className="mt-6 space-y-5"><fieldset disabled={busy} className="space-y-5">
      <label className="block text-sm">마신 날짜 (선택)<input type="date" value={note.tastedOn??''} onChange={e=>setNote({...note,tastedOn:e.target.value||null})} className={field}/></label>
      <label className="block text-sm">마신 뒤 느낌 (선택)<select value={note.sentiment??''} onChange={e=>setNote({...note,sentiment:(e.target.value||null) as AiFeedbackInput['sentiment'],reason:e.target.value?'TASTE':'NONE',comment:null})} className={field}>
        <option value="">아직 평가하지 않음</option><option value="LIKE">마음에 들었어요</option><option value="NEUTRAL">어느 쪽도 아니에요</option><option value="DISLIKE">취향과 달랐어요</option>
      </select></label>
      <label className="block text-sm">직접 느낀 연기 향 (선택)<select value={note.userFeatures?.smokeLevel??''} onChange={e=>setNote({...note,userFeatures:{...note.userFeatures,smokeLevel:e.target.value===''?null:Number(e.target.value)}})} className={field}>
        <option value="">잘 모르겠어요</option><option value="0">느끼지 못했어요</option><option value="1">은은했어요</option><option value="2">뚜렷했어요</option><option value="3">매우 진했어요</option>
      </select></label>
      {(['nose','palate','finish','memo'] as const).map((key,i)=><label className="block text-sm" key={key}>{['향','맛','여운','한 잔의 메모'][i]} (선택)<textarea maxLength={key==='memo'?1000:500} value={note[key]??''} onChange={e=>setNote({...note,[key]:e.target.value||null})} className={field+' min-h-24'}/></label>)}
      <label className="block text-sm">별점 (선택)<select value={note.rating??''} onChange={e=>setNote({...note,rating:e.target.value?Number(e.target.value):null})} className={field}><option value="">선택하지 않음</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}점</option>)}</select></label>
      <button disabled={busy} className="min-h-11 w-full bg-[#4a3728] p-3 font-bold text-white disabled:opacity-50">{busy?'저장 중…':'시음 기록 저장'}</button>
    </fieldset></form>}
  </div></main>;
}
