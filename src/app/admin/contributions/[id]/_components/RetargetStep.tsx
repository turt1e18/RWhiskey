"use client";
import {useState} from 'react';
import {ApiResponseError} from '@/api/apiClient';
import {contributionAdminApi,contributionApi,type AdminView,type ContributionTargetCandidate} from '@/api/contributionApi';
import {adminFailure} from '@/lib/contribution/contribution';

const input='w-full rounded-sm border border-[#4a3728]/40 bg-white/60 px-2 py-1.5 text-sm outline-none focus:border-[#2d2017] min-h-11';
export const failureText=(e:unknown)=>e instanceof ApiResponseError&&(e.status===401||e.status===403)
  ?'로그인이 만료되었어요. 새 탭에서 다시 로그인한 뒤 다시 누르세요. 입력한 내용은 그대로 있어요.'
  :adminFailure(e instanceof ApiResponseError?(e.data as {code?:string}|null)?.code??null:null);

/** A card contribution that describes a bottle already in the catalog becomes a correction of that bottle (no duplicate row). */
export default function RetargetStep({view,onDone}:{view:AdminView;onDone:(next:AdminView)=>void}){
  const [query,setQuery]=useState(String(view.targetSnapshot.labelName??[view.targetSnapshot.brand,view.targetSnapshot.expression].filter(Boolean).join(' ')));
  const [results,setResults]=useState<ContributionTargetCandidate[]|null>(null);
  const [picked,setPicked]=useState<ContributionTargetCandidate|null>(null);
  const [asking,setAsking]=useState(false);const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);

  async function search(){
    setBusy(true);setError(null);setPicked(null);setAsking(false);
    try{setResults(await contributionApi.targets(query.trim()));}catch(e){setError(failureText(e));}finally{setBusy(false);}
  }
  async function link(){
    if(!picked)return;setBusy(true);setError(null);
    try{onDone(await contributionAdminApi.retarget(view.id,{version:view.version,bottlingId:picked.bottlingId}));}
    catch(e){setError(failureText(e));setAsking(false);}finally{setBusy(false);}
  }
  return <section aria-label="기존 병에 연결" className="mt-2 rounded-sm bg-amber-50 p-3 text-xs text-amber-950">
    <p className="font-semibold">이 제보는 추천 결과에서 들어와 카탈로그 병과 연결되지 않았어요.</p>
    <p className="mt-1">같은 병이 이미 카탈로그에 있으면 새로 등록하지 말고 그 병에 연결하세요. 연결하면 그 병에 대한 정정으로 바뀌고, 항목 결정은 처음부터 다시 해요.</p>
    <form className="mt-2 flex gap-2" onSubmit={e=>{e.preventDefault();if(!busy&&query.trim().length>=2)void search();}}>
      <label htmlFor="retarget-q" className="sr-only">카탈로그에서 찾을 이름</label>
      <input id="retarget-q" value={query} onChange={e=>setQuery(e.target.value)} className={input} placeholder="브랜드·제품명 (2자 이상)"/>
      <button type="submit" disabled={busy||query.trim().length<2} className="btn-stamp inline-flex min-h-11 shrink-0 items-center px-3 font-semibold disabled:opacity-50">찾기</button></form>
    {results&&results.length===0&&<p className="mt-2">찾은 병이 없어요. 카탈로그에 없다면 아래에서 새 병으로 등록하세요.</p>}
    {results&&results.length>0&&<fieldset className="mt-2 grid gap-1"><legend className="sr-only">연결할 병</legend>
      {results.map(r=><label key={r.bottlingId} className="flex min-h-11 items-center gap-2 rounded-sm border border-[#4a3728]/25 bg-white/60 px-2">
        <input type="radio" name="retarget" aria-label={`${r.displayName} 병 #${r.bottlingId}`} checked={picked?.bottlingId===r.bottlingId} onChange={()=>{setPicked(r);setAsking(false);}} className="h-4 w-4 accent-[#3E2A1E]"/>
        <span>{r.displayName} <span className="text-stone-600">병 #{r.bottlingId}{r.edition?` · ${r.edition}`:''}{r.batchCode?` · 배치 ${r.batchCode}`:''}{r.ageYears?` · ${r.ageYears}년`:''}{r.abv?` · ${r.abv}%`:''}{r.volumeMl?` · ${r.volumeMl}ml`:''}{r.verified?' · 인증됨(확인된 정보)':''}</span></span></label>)}
    </fieldset>}
    {picked&&!asking&&<button type="button" onClick={()=>setAsking(true)} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-[#4a3728]/40 font-semibold">병 #{picked.bottlingId}에 연결하기…</button>}
    {picked&&asking&&<div role="group" aria-label="연결 확인" className="mt-2 rounded-sm border border-[#4a3728]/40 bg-white/70 p-2">
      <p className="font-semibold">{picked.displayName} (병 #{picked.bottlingId})에 연결할까요?</p>
      <p className="mt-1">저장한 결정은 지워지고 &apos;검토 중&apos;으로 돌아가요. 제보자 화면에는 이 병 이름이 보여요.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={busy} onClick={()=>void link()} className="btn-stamp inline-flex min-h-11 flex-1 items-center justify-center font-semibold disabled:opacity-50">{busy?'연결하는 중…':'연결'}</button>
        <button type="button" autoFocus disabled={busy} onClick={()=>setAsking(false)} className="min-h-11 rounded-sm border border-[#4a3728]/40 px-3">취소</button></div>
    </div>}
    {error&&<p role="alert" className="mt-2 font-semibold text-red-800">{error}</p>}
  </section>;
}
