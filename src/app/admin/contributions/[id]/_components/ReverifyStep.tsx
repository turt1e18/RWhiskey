"use client";
import {useCallback,useEffect,useId,useState} from 'react';
import {contributionAdminApi,type ReverifyPreview,type ReverifyResult} from '@/api/contributionApi';
import {evidenceFieldLabel,evidenceTypes} from '@/lib/contribution/contribution';
import {failureText} from './RetargetStep';

const input='w-full rounded-sm border border-[#4a3728]/40 bg-white/60 px-2 py-1.5 text-sm outline-none focus:border-[#2d2017] min-h-11 mt-0.5';

/**
 * Operator reverification (D-10): an official source that states every checked value brings a NEEDS_REVIEW bottle back to
 * "확인된 정보". Values are prefilled from the bottle; the operator must confirm them against the page, not just submit.
 */
export default function ReverifyStep({bottlingId,onDone}:{bottlingId:number;onDone:(r:ReverifyResult)=>void}){
  const [preview,setPreview]=useState<ReverifyPreview|null>(null);
  const [form,setForm]=useState({url:'',publisher:'',sourceType:'MANUFACTURER',reason:''});
  const [values,setValues]=useState<Record<string,string>>({});
  const [checked,setChecked]=useState<Set<number>>(new Set());
  const [open,setOpen]=useState(false);const [asking,setAsking]=useState(false);const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const uid=useId();

  // The select must show the value that is sent, so it starts at the first source type the server allows.
  const load=useCallback(()=>contributionAdminApi.reverifyPreview(bottlingId).then(p=>{setPreview(p);setValues(p.required);setError(null);
    setForm(f=>p.trustedSourceTypes.includes(f.sourceType)?f:{...f,sourceType:p.trustedSourceTypes[0]??f.sourceType});})
    .catch(e=>setError(failureText(e))),[bottlingId]);
  useEffect(()=>{if(open&&!preview)void load();},[open,preview,load]);

  async function submit(){
    if(!preview)return;setBusy(true);setError(null);
    try{
      const r=await contributionAdminApi.reverify(bottlingId,{expectedBottlingVersion:preview.bottlingVersion,
        evidence:{url:form.url.trim(),publisher:form.publisher.trim(),sourceType:form.sourceType,
          observedFields:Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v.trim()]).filter(([,v])=>v!==''))},
        invalidateEvidenceIds:[...checked],reason:form.reason.trim()});
      setAsking(false);onDone(r); // the bottle is VERIFIED now, so the page unmounts this step and shows the result
    }catch(e){setError(failureText(e));setAsking(false);}finally{setBusy(false);}
  }

  if(!open)return <button type="button" onClick={()=>setOpen(true)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-sm border-2 border-[#2d2017] text-sm font-semibold">병 #{bottlingId} 다시 인증하기…</button>;

  const trusted=evidenceTypes.filter(t=>preview?.trustedSourceTypes.includes(t.value));
  const unchecked=preview?preview.stale.filter(s=>!checked.has(s.id)).length:0;
  const missing=[!form.url.trim().startsWith('https://')&&'주소(https://로 시작)',!form.publisher.trim()&&'발행처',
    Object.keys(preview?.required??{}).some(k=>!values[k]?.trim())&&'비어 있는 값',form.reason.trim().length<2&&'사유 2자 이상',
    unchecked>0&&`옛 근거 체크 ${unchecked}개`].filter(Boolean);
  const ready=!!preview&&preview.verificationStatus==='NEEDS_REVIEW'&&missing.length===0;
  return <section aria-label="다시 인증" className="mt-3 rounded-sm border-2 border-[#2d2017] p-3 text-sm">
    <p className="font-semibold">병 #{bottlingId} 다시 인증</p>
    {!preview&&!error&&<p role="status" className="mt-2 text-xs">불러오는 중…</p>}
    {preview&&preview.verificationStatus!=='NEEDS_REVIEW'&&<p className="mt-2 text-xs">이 병은 지금 &apos;검토 대기&apos;가 아니라서 다시 인증할 수 없어요.</p>}
    {preview&&preview.verificationStatus==='NEEDS_REVIEW'&&<>
      <p className="mt-1 text-xs text-stone-700">공식 페이지에서 아래 값을 하나씩 확인하세요. 페이지와 다른 값이 있으면 인증하지 말고 먼저 병 값을 정정하세요.{preview.hasCertificate?' 이전 인증서는 이력으로만 남아요.':''}</p>
      <fieldset className="mt-2 grid gap-2 text-xs"><legend className="font-semibold">공식 출처</legend>
        <div><label htmlFor={`${uid}-url`}>주소</label><input id={`${uid}-url`} value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://" className={input}/></div>
        <div><label htmlFor={`${uid}-pub`}>발행처</label><input id={`${uid}-pub`} value={form.publisher} onChange={e=>setForm(f=>({...f,publisher:e.target.value}))} placeholder="예: 제조사 이름" className={input}/></div>
        <div><label htmlFor={`${uid}-type`}>종류</label><select id={`${uid}-type`} value={form.sourceType} onChange={e=>setForm(f=>({...f,sourceType:e.target.value}))} className={input}>
          {trusted.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
      </fieldset>
      <fieldset className="mt-3 grid gap-2 text-xs sm:grid-cols-2"><legend className="font-semibold">페이지에 적힌 값 — 병 현재 값으로 채워 뒀어요. 모든 항목이 페이지에 있어야 인증돼요(없는 항목이 있으면 인증하지 마세요).</legend>
        {Object.keys(preview.required).map(k=><div key={k}><label htmlFor={`${uid}-${k}`}>{evidenceFieldLabel[k]??k}</label>
          <input id={`${uid}-${k}`} value={values[k]??''} onChange={e=>setValues(v=>({...v,[k]:e.target.value}))} className={input}/></div>)}
      </fieldset>
      {preview.stale.length>0&&<fieldset className="mt-3 rounded-sm border border-red-800/30 bg-red-50 p-2 text-xs"><legend className="font-semibold">병 값과 어긋나는 옛 근거 — 모두 체크해야 해요 (삭제하지 않고 무효로만 표시)</legend>
        {preview.stale.map(s=><label key={s.id} className="flex min-h-11 items-start gap-2"><input type="checkbox" checked={checked.has(s.id)} className="mt-1 h-4 w-4 accent-[#8B1E1E]"
          onChange={()=>setChecked(c=>{const n=new Set(c);if(!n.delete(s.id))n.add(s.id);return n;})}/>
          <span className="break-all">#{s.id} {s.publisher} — {s.url} <span className="text-red-900">(다른 항목: {s.mismatched.map(m=>evidenceFieldLabel[m]??m).join(', ')})</span></span></label>)}
      </fieldset>}
      <label htmlFor={`${uid}-reason`} className="mt-3 block text-xs">처리 사유 (내부)</label>
      <input id={`${uid}-reason`} value={form.reason} maxLength={500} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} className={input}/>
      {!asking&&missing.length>0&&<p className="mt-3 text-xs text-stone-700">남은 항목: {missing.join(' · ')}</p>}
      {!asking?<button type="button" disabled={!ready||busy} onClick={()=>setAsking(true)} className="btn-stamp mt-3 inline-flex min-h-11 w-full items-center justify-center font-semibold disabled:opacity-50">다시 인증…</button>
      :<div role="group" aria-label="다시 인증 확인" className="mt-3 rounded-sm border border-[#4a3728]/40 bg-white/70 p-2 text-xs">
        <p className="font-semibold">이 병의 도수·숙성 연수를 &apos;확인된 정보&apos;로 올릴까요?</p>
        <p className="mt-1">추천에 쓰는 검증 검사를 통과해야만 바뀌고, 통과하지 못하면 아무것도 바뀌지 않아요.</p>
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} onClick={()=>void submit()} className="btn-stamp inline-flex min-h-11 flex-1 items-center justify-center font-semibold disabled:opacity-50">{busy?'확인하는 중…':'다시 인증'}</button>
          <button type="button" autoFocus disabled={busy} onClick={()=>setAsking(false)} className="min-h-11 rounded-sm border border-[#4a3728]/40 px-3">취소</button></div></div>}
    </>}
    {error&&<div role="alert" className="mt-2 text-xs font-semibold text-red-800"><p>{error}</p>
      <button type="button" onClick={()=>{setPreview(null);void load();}} className="inline-flex min-h-11 items-center underline">병 정보 다시 불러오기 (주소·발행처·사유는 유지, 값은 병 현재 값으로 다시 채움)</button></div>}
  </section>;
}
