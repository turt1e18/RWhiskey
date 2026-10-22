"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { whiskeyV3Api } from '@/api/whiskeyV3Api';
import { ApiResponseError } from '@/api/apiClient';
import { toAiSuggestion } from '@/lib/recommendations/v3Contract';
import type { V3Response } from '@/lib/recommendations/v3Contract';
import type { WhiskeyFeedbackReason, WhiskeyFeedbackSentiment } from '@/type/ApiInterface';
import ExpectationFeedback from './ExpectationFeedback';
import { bilingualLabel } from './whiskeyPresentation';
import { aiKoreanName } from '@/lib/recommendations/aiPresentation';
import WhiskeySearchPhoto from './WhiskeySearchPhoto';
import WhiskeyCatalogFactsPanel from './WhiskeyCatalogFactsPanel';
import WhiskeyProductSourcePanel from './WhiskeyProductSourcePanel';
import {sameProposedCaskPreference} from '@/lib/recommendations/caskPreference';
import {bottlingInformationNotes} from '@/lib/recommendations/bottlingInformation';

export default function WhiskeyAiSuggestionCard({response}:{response:V3Response}) {
  const [currentResponse,setCurrentResponse]=useState(response);
  const [sourceBusy,setSourceBusy]=useState(false);
  const [sourceStatus,setSourceStatus]=useState<string|null>(null);
  const a=toAiSuggestion(currentResponse);
  const [sentiment,setSentiment]=useState<WhiskeyFeedbackSentiment>('NEUTRAL');
  const [saved,setSaved]=useState<WhiskeyFeedbackSentiment|null>(null);
  const [reason,setReason]=useState<WhiskeyFeedbackReason>('NONE');const [comment,setComment]=useState('');
  const [busy,setBusy]=useState(true);const [status,setStatus]=useState<string|null>(null);const [auth,setAuth]=useState(false);
  const [loaded,setLoaded]=useState(false);const [reload,setReload]=useState(0);
  const id=a?.id;
  useEffect(()=>{
    if(!id)return;
    let active=true;setBusy(true);setLoaded(false);setStatus(null);setAuth(false);
    void whiskeyV3Api.aiFeedback(id,'EXPECTED').then(row=>{if(active){
      setSentiment(row?.feedback.sentiment ?? 'NEUTRAL');setSaved(row?.feedback.sentiment ?? null);
      setReason(row?.feedback.reason ?? 'NONE');setComment(row?.feedback.comment ?? '');setLoaded(true);
    }}).catch(e=>{if(active){setStatus('저장한 첫인상을 확인하지 못했어요. 다시 화면을 열어 확인해 주세요.');setAuth(e instanceof ApiResponseError && e.status===401);}})
      .finally(()=>{if(active)setBusy(false);});
    return ()=>{active=false;};
  },[id,reload]);
  if(!a)return null;
  const p=a.identity;
  const koreanName=aiKoreanName(p,a.localizedName);
  const pref=response.requestSummary?.preferences;
  const differences=[
    pref?.category && !a.reasons?.includes('PROPOSED_CATEGORY_MATCH')?`선호 종류 ${pref.category} → 제안된 종류 ${p.category||'정보 미확인'}`:null,
    pref?.country && !a.reasons?.includes('PROPOSED_COUNTRY_MATCH')?`선호 국가 ${pref.country} → 제안된 국가 ${p.country||'정보 미확인'}`:null,
    pref?.region && !a.reasons?.includes('PROPOSED_REGION_MATCH')?`선호 산지 ${pref.region} → 제안된 산지 ${p.region||'정보 미확인'}`:null,
    pref?.targetAbv!=null && !a.reasons?.includes('PROPOSED_ABV_MATCH')?`선호 도수 ${pref.targetAbv}% → 제안된 도수 ${p.abv==null?'정보 미확인':p.abv+'%'}`:null,
    pref?.maturationCask && !a.reasons?.includes('PROPOSED_MATURATION_MATCH') && !sameProposedCaskPreference(pref.maturationCask,p.maturationCask)?`선호 숙성 통 ${pref.maturationCask} → 제안된 통 ${p.maturationCask||'정보 미확인'}`:null,
    pref?.finishCask && !a.reasons?.includes('PROPOSED_FINISH_MATCH') && !sameProposedCaskPreference(pref.finishCask,p.finishCask)?`선호 피니시 통 ${pref.finishCask} → 제안된 통 ${p.finishCask||'정보 미확인'}`:null,
  ].filter(Boolean);
  async function save(){if(!id || busy || !loaded)return;setBusy(true);setStatus(null);setAuth(false);
    try {const row=await whiskeyV3Api.saveAiFeedback(id,'EXPECTED',{sentiment,reason:sentiment==='NEUTRAL'?'NONE':reason,
      comment:sentiment!=='NEUTRAL' && reason==='OTHER'?comment.trim()||null:null});setSaved(row.feedback.sentiment??null);setStatus('첫인상을 저장했어요. 실제 시음 후기와는 따로 보관해요.');}
    catch(e){setStatus('저장하지 못했어요. 선택은 그대로예요. 다시 시도해 주세요.');setAuth(e instanceof ApiResponseError && e.status===401);}
    finally{setBusy(false);}
  }
  return <div className="mx-auto flex w-full max-w-md flex-col items-center px-4">
    <article className="w-full break-words rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 text-stone-900 shadow-xl md:p-10">
      <p className="text-xs font-bold tracking-wide text-[#63431f]">{a.catalogFacts?.status==='CURRENT' && Date.parse(a.catalogFacts.validUntil)>Date.now()?'현재 일부 병입 정보 확인':'상세정보 검증 전'}</p>
      <h2 className="mt-4 text-[22px] font-semibold leading-snug tracking-tight md:text-2xl">{p.brand} {p.expression}</h2>
      {koreanName && <p lang="ko" className="mt-2 text-[13px] leading-5 text-stone-700">{koreanName}</p>}
      {p.edition && <p className="mt-2 text-sm">{p.edition}</p>}
      <WhiskeySearchPhoto identity={p}/>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Fact label="제안된 종류" value={p.category?bilingualLabel('category',p.category,null):null}/>
        <Fact label="제안된 생산 국가" value={p.country?bilingualLabel('country',p.country,null):null}/>
        <Fact label="제안된 도수" value={p.abv==null?null:`${p.abv}%`}/>
        <Fact label="제안된 숙성 년수" value={p.ageStatement==='NUMBERED' && p.ageYears!=null?`${p.ageYears}년`:p.ageStatement==='NAS'?'숙성 년수 표기 없음 (NAS)':null}/>
      </dl>
      {(p.independentBottling || p.oldBottle) && <p className="mt-4 text-sm font-semibold">{[p.independentBottling?'독립 병입 제안':null,p.oldBottle?'올드바틀 제안':null].filter(Boolean).join(' · ')}</p>}
      <h3 className="mt-6 border-t border-[#4a3728]/25 pt-4 font-bold">이 한 잔을 고른 이유</h3>
      <div className="mt-3 space-y-3 text-sm leading-7">{a.presentation.summary.map((text,i)=><p key={i}>{text}</p>)}</div>
      <WhiskeyCatalogFactsPanel facts={a.catalogFacts}/>
      <WhiskeyProductSourcePanel information={a.productSourceObservations}/>
      <button type="button" disabled={sourceBusy} className="mt-3 min-h-11 py-2 text-left text-xs font-semibold underline disabled:opacity-60"
        onClick={async()=>{if(!id || sourceBusy)return;setSourceBusy(true);setSourceStatus(null);
          try {const next=await whiskeyV3Api.byId(id);const card=toAiSuggestion(next);
            if(!card || card.id!==id)throw new Error('INVALID_SAVED_RESPONSE');setCurrentResponse(next);
            setSourceStatus(card.productSourceObservations?'제품 출처 정보를 확인했어요.':'현재 추가로 확인된 제품 출처 정보가 없어요.');
          }catch{setSourceStatus('제품 출처 정보를 불러오지 못했어요. 추천 결과는 그대로 확인할 수 있어요.');}
          finally{setSourceBusy(false);}}}>{sourceBusy?'저장 정보 확인 중…':'저장된 출처 정보 다시 확인'}</button>
      {sourceStatus && <p role="status" className="text-xs leading-5 text-stone-600">{sourceStatus}</p>}
      {a.servingSuggestion && <div className="mt-5 border-t border-[#4a3728]/25 pt-4 text-sm leading-7"><h3 className="font-semibold">한 잔을 즐기는 제안</h3><p className="mt-2">{a.servingSuggestion}</p></div>}
      {differences.length>0 && <div className="mt-5 border-t border-[#4a3728]/25 pt-4 text-sm leading-6"><h3 className="font-semibold">선택한 취향과 다른 점</h3>{differences.map(text=><p key={text} className="mt-2">{text}</p>)}</div>}
      <details className="mt-5 border-t border-[#4a3728]/25 pt-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">제안된 병입 정보 더 보기</summary>
        <p className="mb-3 text-xs leading-5">아래 정보도 모델의 제안이며, 정확한 병입판은 확인 전이에요.</p>
        <div className="mb-4 space-y-1 text-xs leading-5 text-stone-600">
          {bottlingInformationNotes(p).map(note=><p key={note}>{note}</p>)}
        </div>
        <dl className="grid grid-cols-2 gap-4">
          <Fact label="세부 산지" value={p.region}/><Fact label="병입사" value={p.bottler}/>
          <Fact label="배치" value={p.batch}/><Fact label="캐스크 번호" value={p.caskNumber}/>
          <Fact label="숙성 통" value={p.maturationCask}/><Fact label="피니시 통" value={p.finishCask}/>
          <Fact label="증류 연도" value={p.vintageYear==null?null:String(p.vintageYear)}/>
          {p.bottledYear!=null && <Fact label="병입 연도" value={String(p.bottledYear)+'년'}/>}
          {p.releaseYear!=null && <Fact label="출시 연도" value={String(p.releaseYear)+'년'}/>}
        </dl>
      </details>
      <Link href={`/notes/ai/${a.id}`} className="mt-6 block min-h-11 border border-[#4a3728] px-3 py-3 text-center text-sm font-semibold">마신 뒤 시음 기록 남기기</Link>
      <p className="mt-2 text-xs leading-5 text-stone-600">내 시음 노트 목록에서 이 추천을 다시 찾을 수 있어요.</p>
    </article>
    {!loaded ? <div className="mt-6 w-full rounded border border-[#4a3728] bg-[#efe2c9] p-5 text-sm text-stone-900">
      <p role="status">{busy?'저장한 첫인상을 확인하고 있어요…':status}</p>
      {!busy && (auth?<Link href="/login" className="mt-2 inline-flex min-h-11 items-center underline">다시 로그인</Link>:
        <button onClick={()=>setReload(n=>n+1)} className="mt-2 min-h-11 underline">첫인상 다시 불러오기</button>)}
    </div> : <ExpectationFeedback sentiment={sentiment} reason={reason} savedSentiment={saved} loading={busy} status={status} authExpired={auth}
      comment={comment} onComment={setComment} onSentiment={v=>{setSentiment(v);setReason('NONE');setComment('');setStatus(null);}}
      onReason={v=>{setReason(v);setComment('');setStatus(null);}} onSave={()=>void save()}/>}
  </div>;
}
function Fact({label,value}:{label:string;value?:string|null}){return <div className="min-w-0"><dt className="text-xs text-stone-600">{label}</dt><dd className="mt-1 break-words">{value||'정보 미확인'}</dd></div>;}
