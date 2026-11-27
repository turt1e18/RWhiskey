"use client";
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {ApiResponseError} from '@/api/apiClient';
import {contributionApi,type ContributionSummary,type ContributionView} from '@/api/contributionApi';
import {PaperPage} from '@/components/PaperPage';
import {fieldLabel,itemResult,publicStatus} from '@/lib/contribution/contribution';
import {useAuthStore} from '@/store/authStore';

const tone={wait:'bg-[#4a3728]/10 text-[#2d2017]',ask:'bg-amber-100 text-amber-900',done:'bg-emerald-100 text-emerald-900',no:'bg-stone-200 text-stone-700'};
const day=(v:string)=>new Date(v).toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});

function Detail({id,onChanged}:{id:string;onChanged:()=>void}){
  const [view,setView]=useState<ContributionView|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [reply,setReply]=useState('');
  const [busy,setBusy]=useState(false);
  const [askWithdraw,setAskWithdraw]=useState(false);
  useEffect(()=>{contributionApi.detail(id).then(setView).catch(()=>setError('불러오지 못했어요. 다시 시도해 주세요.'));},[id]);
  async function act(run:()=>Promise<ContributionView>){
    setBusy(true);setError(null);
    try {setView(await run());onChanged();}
    catch(e){const s=e instanceof ApiResponseError?e.status:null;
      setError(s===401||s===403?'로그인이 만료되었어요. 새 탭에서 다시 로그인해 주세요. 입력한 내용은 그대로 있어요.':s===409?'이미 처리됐어요. 목록을 다시 불러와 주세요.':'처리하지 못했어요. 다시 시도해 주세요.');}
    finally {setBusy(false);}
  }
  if(error&&!view)return <p role="alert" className="text-sm text-red-800">{error}</p>;
  if(!view)return <p role="status" className="text-sm">불러오는 중…</p>;
  const canWithdraw=['SUBMITTED','IN_REVIEW','NEEDS_INFO','HELD'].includes(view.status);
  return <div className="mt-3 space-y-3 border-t border-[#4a3728]/20 pt-3 text-sm">
    <ul className="space-y-2">{view.items.map(i=><li key={i.field}>
      <p className="font-semibold">{fieldLabel(i.field)} <span className="font-normal text-stone-600">— {itemResult(i.decision,i.apply,view.status)}</span></p>
      {i.proposed&&<p className="whitespace-pre-line text-stone-700">{i.proposed}</p>}
      {i.reasonPublic&&<p className="text-stone-700">확인 결과: {i.reasonPublic}</p>}
    </li>)}</ul>
    {view.status==='NEEDS_INFO'&&!view.infoReply&&<div className="rounded-sm bg-amber-50 p-3">
      <p className="font-semibold">조금 더 알려주세요</p><p className="mt-1 whitespace-pre-line">{view.infoRequest}</p>
      <label htmlFor={`reply-${id}`} className="mt-3 block font-semibold">답변 (한 번 보낼 수 있어요)</label>
      <textarea id={`reply-${id}`} rows={3} maxLength={300} value={reply} onChange={e=>setReply(e.target.value)}
        className="mt-1 w-full resize-none rounded-sm border border-[#4a3728]/40 bg-white/60 p-3 outline-none focus:border-[#2d2017]"/>
      <button type="button" disabled={busy||[...reply.trim()].length<2} onClick={()=>void act(()=>contributionApi.reply(id,reply.trim()))}
        className="btn-stamp mt-2 inline-flex min-h-11 w-full items-center justify-center font-semibold disabled:opacity-50">{busy?'보내는 중…':'답변 보내기'}</button>
    </div>}
    {view.infoReply&&<p className="text-stone-700">보낸 답변: {view.infoReply}</p>}
    {error&&<p role="alert" className="text-red-800">{error}</p>}
    {canWithdraw&&!askWithdraw&&<button type="button" disabled={busy} onClick={()=>setAskWithdraw(true)}
      className="inline-flex min-h-11 items-center text-sm underline underline-offset-2 disabled:opacity-50">보낸 내용 취소하기</button>}
    {canWithdraw&&askWithdraw&&<div role="group" aria-label="보낸 내용 취소 확인" className="rounded-sm border border-red-800/30 bg-red-50 p-3">
      <p className="font-semibold">이 내용을 취소할까요?</p>
      <p className="mt-1 text-stone-700">취소하면 확인하지 않고, 되돌릴 수 없어요.</p>
      <div className="mt-3 flex gap-2">
        <button type="button" autoFocus disabled={busy} onClick={()=>void act(()=>contributionApi.withdraw(id))}
          className="inline-flex min-h-11 flex-1 items-center justify-center bg-[#8B1E1E] px-4 font-semibold text-white disabled:opacity-50">{busy?'취소하는 중…':'취소하기'}</button>
        <button type="button" disabled={busy} onClick={()=>setAskWithdraw(false)}
          className="btn-stamp inline-flex min-h-11 flex-1 items-center justify-center font-semibold disabled:opacity-50">그대로 두기</button>
      </div>
    </div>}
  </div>;
}

export default function MyContributionsPage(){
  const {isAuthenticated,isInitialized}=useAuthStore();
  const [list,setList]=useState<ContributionSummary[]|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [open,setOpen]=useState<string|null>(null);
  const load=useCallback(()=>{contributionApi.mine().then(l=>{setList(l);setError(null);})
    .catch(e=>setError(e instanceof ApiResponseError&&(e.status===401||e.status===403)?'로그인이 만료되었어요. 다시 로그인해 주세요.':'목록을 불러오지 못했어요. 다시 시도해 주세요.'));},[]);
  useEffect(()=>{if(isAuthenticated)load();},[isAuthenticated,load]);

  return <PaperPage title="내가 알려준 정보" wide back={{href:'/contribute',label:'알려주기'}}>
    {!isInitialized?<p role="status" className="text-sm">불러오는 중…</p>
    :!isAuthenticated?<div className="text-sm"><p>로그인하면 보내 주신 정보의 처리 상태를 볼 수 있어요.</p>
      <Link href="/login" className="btn-stamp mt-4 inline-flex min-h-11 w-full items-center justify-center font-semibold">로그인하러 가기</Link></div>
    :<>
      {error&&<div role="alert" className="text-sm text-red-800"><p>{error}</p><button type="button" onClick={load} className="inline-flex min-h-11 items-center underline">다시 불러오기</button></div>}
      {!list&&!error&&<p role="status" className="text-sm">불러오는 중…</p>}
      {list&&list.length===0&&<div className="text-sm"><p>아직 알려주신 정보가 없어요.</p>
        <Link href="/contribute" className="btn-stamp mt-4 inline-flex min-h-11 w-full items-center justify-center font-semibold">위스키 정보 알려주기</Link></div>}
      {list&&list.length>0&&<ul className="flex flex-col gap-3">{list.map(c=>{
        const s=publicStatus({status:c.status,kind:c.kind,items:c.decisions.map(d=>({field:'OTHER',proposed:null,decision:d,apply:'NONE',reasonPublic:null}))});
        return <li key={c.id} className="rounded-sm border border-[#4a3728]/25 bg-white/40 p-3">
          <button type="button" aria-expanded={open===c.id} onClick={()=>setOpen(o=>o===c.id?null:c.id)} className="flex min-h-11 w-full items-start justify-between gap-3 text-left">
            <span><span className="block text-sm font-semibold">{c.targetName??'이름 없이 보낸 내용'}</span>
              <span className="block text-xs text-stone-600">{day(c.createdAt)} · 항목 {c.itemCount}개</span></span>
            <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold ${tone[s.tone]}`}>{s.label}</span>
          </button>
          {open===c.id&&<Detail id={c.id} onChanged={load}/>}
        </li>;})}</ul>}
      <Link href="/contribute" className="mt-6 inline-flex min-h-11 w-full items-center justify-center text-sm underline underline-offset-2">새로 알려주기</Link>
    </>}
  </PaperPage>;
}
