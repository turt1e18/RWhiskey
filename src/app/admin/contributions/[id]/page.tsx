"use client";
import Link from 'next/link';
import {useParams} from 'next/navigation';
import {useCallback,useEffect,useState} from 'react';
import {ApiResponseError} from '@/api/apiClient';
import {contributionAdminApi,type AdminItem,type AdminView,type ApplyResult,type ItemDecision} from '@/api/contributionApi';
import {PaperPage} from '@/components/PaperPage';
import {adminFailure,applyLabel,decidedParts,decisionLabel,describeValue,evidenceTypes,fieldLabel,statusLabel,type Part} from '@/lib/contribution/contribution';
import {reportSourceOptions} from '@/lib/recommendations/informationReport';
import {useAuthStore} from '@/store/authStore';
import RetargetStep from './_components/RetargetStep';
import ReverifyStep from './_components/ReverifyStep';

const NO_APPLY=new Set(['FLAVOR','PHOTO_MISMATCH','OTHER']);
const PRODUCT_LEVEL=new Set(['NAME','DISTILLERY','CATEGORY_REGION']);
const verifiedLabel:Record<string,string>={VERIFIED:'인증됨(확인된 정보)',NEEDS_REVIEW:'검토 대기',DRAFT:'초안',REJECTED:'거절됨'};

/** One decided-value part: coded values are picked from a list so a typo cannot reach the catalog. */
function PartInput({part,value,onChange}:{part:Part;value:string;onChange:(v:string)=>void}){
  const cls='w-full rounded-sm border border-[#4a3728]/40 bg-white/60 px-2 py-1.5 text-sm outline-none focus:border-[#2d2017] mt-0.5 min-h-11';
  if(part.kind==='select')return <select value={value} onChange={e=>onChange(e.target.value)} className={cls}>
    {!part.options?.some(o=>o.value==='')&&<option value="">선택하세요</option>}{part.options!.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  if(part.kind==='casks'){const picked=new Set(value?value.split(','):[]);
    return <span className="mt-1 flex flex-wrap gap-2">{part.options!.map(o=><label key={o.value} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-[#4a3728]/30 px-2">
      <input type="checkbox" checked={picked.has(o.value)} className="h-4 w-4 accent-[#3E2A1E]"
        onChange={()=>{const n=new Set(picked);if(!n.delete(o.value))n.add(o.value);onChange([...n].join(','));}}/>{o.label}</label>)}</span>;}
  return <input value={value} inputMode={part.kind==='number'?'decimal':undefined} onChange={e=>onChange(e.target.value)} className={cls}/>;
}
const input='w-full rounded-sm border border-[#4a3728]/40 bg-white/60 px-2 py-1.5 text-sm outline-none focus:border-[#2d2017]';
type Draft={decision:ItemDecision;values:Record<string,string>;reasonPublic:string;reasonInternal:string};
const codeOf=(e:unknown)=>e instanceof ApiResponseError?(e.data as {code?:string}|null)?.code??null:null;

export default function AdminContributionDetail(){
  const {id}=useParams<{id:string}>();
  const {isAuthenticated,isInitialized}=useAuthStore();
  const [view,setView]=useState<AdminView|null>(null);
  const [hidden,setHidden]=useState(false);
  const [drafts,setDrafts]=useState<Record<string,Draft>>({});
  const [message,setMessage]=useState<{text:string;error:boolean}|null>(null);
  const [busy,setBusy]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [ack,setAck]=useState(false);const [create,setCreate]=useState(false);
  const [evidence,setEvidence]=useState({url:'',publisher:'',sourceType:'MANUFACTURER'});
  const [infoRequest,setInfoRequest]=useState('');
  const [applied,setApplied]=useState<ApplyResult|null>(null);

  const applyView=useCallback((v:AdminView)=>{setView(v);
    setDrafts(Object.fromEntries(v.items.map(i=>[i.field,{decision:i.decision,values:{...(i.decidedValue??{})},reasonPublic:i.reasonPublic??'',reasonInternal:i.reasonInternal??''}])));},[]);
  const load=useCallback(()=>contributionAdminApi.detail(id).then(applyView)
    .catch(e=>{if(e instanceof ApiResponseError&&(e.status===403||e.status===401||e.status===404))setHidden(true);else setMessage({text:'불러오지 못했어요.',error:true});}),[id,applyView]);
  useEffect(()=>{if(isAuthenticated)void load();},[isAuthenticated,load]);

  const setDraft=(f:string,patch:Partial<Draft>)=>setDrafts(d=>({...d,[f]:{...d[f],...patch}}));
  async function decide(status?:'HELD'|'NEEDS_INFO'){
    if(!view)return; setBusy(true);setMessage(null);
    try {
      const items=view.items.filter(i=>i.apply!=='APPLIED').map(i=>{const d=drafts[i.field];const needs=d.decision==='SEPARATE_RELEASE'||d.decision==='APPROVED'&&!NO_APPLY.has(i.field);
        return {field:i.field,decision:d.decision,decidedValue:needs?Object.fromEntries(Object.entries(d.values).filter(([,v])=>v.trim()!=='')):null,
          reasonPublic:d.reasonPublic.trim()||null,reasonInternal:d.reasonInternal.trim()};}).filter(i=>i.decision!=='PENDING'||status);
      const next=await contributionAdminApi.decide(view.id,{version:view.version,items:status?[]:items,status:status??null,infoRequest:status==='NEEDS_INFO'?infoRequest.trim():null});
      applyView(next);setMessage({text:status==='HELD'?'보류했어요.':status==='NEEDS_INFO'?'추가 정보를 요청했어요.':'결정을 저장했어요.',error:false});
    } catch(e){setMessage({text:adminFailure(codeOf(e)),error:true});} finally {setBusy(false);}
  }
  async function apply(){
    if(!view)return; setBusy(true);setMessage(null);
    try {
      const r=await contributionAdminApi.apply(view.id,crypto.randomUUID(),{version:view.version,expectedBottlingVersion:view.target?.bottlingVersion??null,
        create,acknowledgeDowngrade:ack,evidence:evidence.url.trim()?{url:evidence.url.trim(),publisher:evidence.publisher.trim(),sourceType:evidence.sourceType,observedFields:{}}:null});
      setApplied(r);setConfirming(false);await load();
      setMessage({text:`반영했어요: ${r.applied.map(f=>fieldLabel(f as AdminItem['field'])).join(', ')||'없음'}${r.conflicts.length?` / 다시 검토 필요: ${r.conflicts.join(', ')}`:''}`,error:false});
    } catch(e){setMessage({text:adminFailure(codeOf(e)),error:true});} finally {setBusy(false);}
  }

  if(!isInitialized)return <PaperPage title="불러오는 중"><p role="status" className="text-sm">불러오는 중…</p></PaperPage>;
  if(!isAuthenticated||hidden)return <PaperPage title="페이지를 찾을 수 없어요"><p className="text-sm">주소를 다시 확인해 주세요.</p></PaperPage>;
  if(!view)return <PaperPage title="제보 확인" wide><p role="status" className="text-sm">{message?.text??'불러오는 중…'}</p></PaperPage>;

  const t=view.target;
  const approved=view.items.filter(i=>(i.decision==='APPROVED'&&!NO_APPLY.has(i.field)||i.decision==='SEPARATE_RELEASE')&&i.apply!=='APPLIED');
  const separate=approved.some(i=>i.decision==='SEPARATE_RELEASE');
  const downgradeRisk=!!t&&!separate&&(t.verificationStatus==='VERIFIED'||approved.some(i=>PRODUCT_LEVEL.has(i.field))&&t.verifiedSiblingCount>0);
  const needsCreate=!t||!separate&&view.targetType!=='CATALOG';
  const editable=!['APPLIED','WITHDRAWN'].includes(view.status);
  const retargetable=!t&&view.targetType!=='CATALOG'&&!['APPLIED','APPLYING','WITHDRAWN'].includes(view.status);
  // Apply uses the saved decision; unsaved edits would be silently dropped, so block until saved.
  const dirty=view.items.some(i=>{const d=drafts[i.field];if(!d||i.apply==='APPLIED')return false;
    const saved=i.decidedValue??{};const vals=Object.fromEntries(Object.entries(d.values).filter(([,v])=>v.trim()!==''));
    return d.decision!==i.decision||d.reasonInternal!==(i.reasonInternal??'')||d.reasonPublic!==(i.reasonPublic??'')||
      JSON.stringify(Object.entries(vals).sort())!==JSON.stringify(Object.entries(saved).sort());});
  const productWide=approved.some(i=>PRODUCT_LEVEL.has(i.field));

  return <PaperPage title="제보 확인" wide back={{href:'/admin/contributions',label:'목록'}}>
    <section aria-label="대상" className="rounded-sm border border-[#4a3728]/25 bg-white/40 p-3 text-sm">
      {t?<><p className="font-semibold">{t.displayName} <span className="font-normal text-stone-600">병 #{t.bottlingId} · {verifiedLabel[t.verificationStatus]??t.verificationStatus}{t.hasCertificate?' · 인증서 있음':''}</span></p>
        <p className="text-xs text-stone-600">같은 제품의 병 {t.siblingCount}개 (인증 {t.verifiedSiblingCount}개)</p></>
        :<><p className="font-semibold">카탈로그에 없는 대상 <span className="font-normal">{String(view.targetSnapshot.labelName??view.targetSnapshot.brand??'')} {String(view.targetSnapshot.expression??'')}</span></p>
          {retargetable&&<RetargetStep view={view} onDone={next=>{applyView(next);setMessage({text:'기존 병에 연결했어요. 항목을 다시 결정하세요.',error:false});}}/>}</>}
      {t?.verificationStatus==='NEEDS_REVIEW'&&<ReverifyStep key={t.bottlingId} bottlingId={t.bottlingId} onDone={r=>{void load();
        setMessage({text:`병 #${r.bottlingId}을 다시 인증했어요. 도수·숙성 연수는 '확인된 정보'로, 종류·생산국은 '참고 정보'로 보이고 검증 추천 후보로 돌아가요.${r.invalidated.length?` 옛 근거 ${r.invalidated.length}개는 무효로 표시했어요(삭제 안 함).`:''}`,error:false});}}/>}
      <p className="mt-1 text-xs text-stone-600">상태 {statusLabel[view.status]} · 제보자 uid {view.ownerUid} · {new Date(view.createdAt).toLocaleString('ko-KR')}</p>
      {(view.source||view.sourceUrl)&&<p className="mt-1 text-xs">출처: {reportSourceOptions.find(o=>o.value===view.source)?.label??view.source??'-'} {view.sourceUrl&&<a href={view.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{view.sourceUrl}</a>}</p>}
      {view.note&&<p className="mt-1 whitespace-pre-line text-xs">덧붙인 말: {view.note}</p>}
      {view.infoRequest&&<p className="mt-1 text-xs">추가 정보 요청: {view.infoRequest} / 답변: {view.infoReply??'(아직 없음)'}</p>}
    </section>

    <ol className="mt-4 flex flex-col gap-4">{view.items.map(i=>{const d=drafts[i.field];if(!d)return null;
      const parts=decidedParts[i.field]??[];const needs=d.decision==='SEPARATE_RELEASE'||d.decision==='APPROVED'&&!NO_APPLY.has(i.field);
      return <li key={i.field} className="rounded-sm border border-[#4a3728]/25 p-3 text-sm">
        <p className="font-semibold">{fieldLabel(i.field)} <span className="font-normal text-stone-600">· {decisionLabel[i.decision]} · {applyLabel[i.apply]}</span></p>
        <dl className="mt-2 grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-xs">
          <dt className="text-stone-600">사용자 제안</dt><dd className="whitespace-pre-line">{i.proposed??'—'}</dd>
          <dt className="text-stone-600">제출 때 값</dt><dd>{describeValue(i.field,i.baseValue)}</dd>
          <dt className="text-stone-600">지금 DB 값</dt><dd>{describeValue(i.field,t?.current?.[i.field])}</dd>
        </dl>
        {editable&&i.apply!=='APPLIED'&&<div className="mt-2 flex flex-col gap-2">
          <label className="text-xs font-semibold" htmlFor={`d-${i.field}`}>결정</label>
          <select id={`d-${i.field}`} value={d.decision} onChange={e=>setDraft(i.field,{decision:e.target.value as ItemDecision})} className={`${input} min-h-11`}>
            <option value="PENDING">미결정</option><option value="APPROVED">{NO_APPLY.has(i.field)?'확인함(반영 없음)':'승인(정정)'}</option>
            {view.targetType==='CATALOG'&&!NO_APPLY.has(i.field)&&<option value="SEPARATE_RELEASE">다른 에디션(판)으로 등록</option>}
            <option value="REJECTED">거절</option><option value="HELD">보류</option></select>
          {needs&&parts.map(p=>p.kind==='casks'
            ?<fieldset key={p.key} className="text-xs"><legend>{p.label}</legend><PartInput part={p} value={d.values[p.key]??''} onChange={v=>setDraft(i.field,{values:{...d.values,[p.key]:v}})}/></fieldset>
            :<label key={p.key} className="text-xs">{p.label}<PartInput part={p} value={d.values[p.key]??''} onChange={v=>setDraft(i.field,{values:{...d.values,[p.key]:v}})}/></label>)}
          <label className="text-xs">사용자에게 보일 사유 (선택)<input value={d.reasonPublic} maxLength={300} onChange={e=>setDraft(i.field,{reasonPublic:e.target.value})} className={`${input} mt-0.5 min-h-11`}/></label>
          <label className="text-xs">내부 사유 (필수, 사용자에게 안 보임)<input value={d.reasonInternal} maxLength={500} onChange={e=>setDraft(i.field,{reasonInternal:e.target.value})} className={`${input} mt-0.5 min-h-11`}/></label>
        </div>}
      </li>;})}</ol>

    {message&&<p role={message.error?'alert':'status'} className={`mt-4 text-sm ${message.error?'text-red-800':'text-emerald-800'}`}>{message.text}</p>}
    {editable&&<div className="mt-4 flex flex-col gap-2">
      <button type="button" disabled={busy} onClick={()=>void decide()} className="btn-stamp inline-flex min-h-11 items-center justify-center font-semibold disabled:opacity-50">결정 저장</button>
      <div className="flex gap-2"><button type="button" disabled={busy} onClick={()=>void decide('HELD')} className="min-h-11 flex-1 rounded-sm border border-[#4a3728]/40 text-sm">보류</button></div>
      {!view.infoRequest&&<div className="flex gap-2"><label htmlFor="info-req" className="sr-only">추가 정보 요청 내용</label>
        <input id="info-req" value={infoRequest} onChange={e=>setInfoRequest(e.target.value)} maxLength={300} placeholder="사용자에게 물어볼 내용" className={`${input} min-h-11`}/>
        <button type="button" disabled={busy||infoRequest.trim().length<2} onClick={()=>void decide('NEEDS_INFO')} className="min-h-11 shrink-0 rounded-sm border border-[#4a3728]/40 px-3 text-sm disabled:opacity-50">추가 정보 요청</button></div>}
    </div>}

    {(view.status==='DECIDED'||view.status==='APPLY_FAILED')&&approved.length>0&&<section aria-label="반영" className="mt-6 rounded-sm border-2 border-[#2d2017] p-3 text-sm">
      {!confirming?<button type="button" onClick={()=>setConfirming(true)} className="btn-stamp inline-flex min-h-11 w-full items-center justify-center font-semibold">카탈로그에 반영하기…</button>:<>
        <p className="font-semibold">이렇게 바뀌어요 {t?`(병 #${t.bottlingId})`:'(새 병으로 등록)'}{separate?' — 다른 에디션(판)으로 새 병 등록, 기존 병은 그대로':''}</p>
        <ul className="mt-2 list-disc pl-5 text-xs">{approved.map(i=><li key={i.field}>{fieldLabel(i.field)}: {describeValue(i.field,t?.current?.[i.field])} → {describeValue(i.field,i.decidedValue)}</li>)}</ul>
        {dirty&&<p role="alert" className="mt-3 text-xs font-semibold text-red-800">저장하지 않은 수정이 있어요. &apos;결정 저장&apos;을 누른 뒤 반영하세요.</p>}
        {downgradeRisk&&<div className="mt-3 rounded-sm border-2 border-red-700 bg-red-50 p-3 text-sm text-red-900">
          <p className="font-semibold">주의: {productWide?`이 병(#${t?.bottlingId})과 같은 제품의 인증된 병 ${t?.verifiedSiblingCount}개가`:`이 병(#${t?.bottlingId})이`} 재인증 전까지 &apos;참고 정보&apos;로 바뀌고 검증 추천에서 빠져요.</p>
          <label className="mt-2 flex min-h-11 items-center gap-2"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)} className="h-5 w-5 accent-[#8B1E1E]"/>위 내용을 확인했어요</label></div>}
        {needsCreate&&<label className="mt-3 flex min-h-11 items-start gap-2 text-xs"><input type="checkbox" checked={create} onChange={e=>setCreate(e.target.checked)} className="mt-1 h-5 w-5 accent-[#3E2A1E]"/>
          카탈로그에서 같은 이름의 병을 먼저 찾아봤고, 없어서 새 병으로 등록해요(검토 대기, 추천 후보 아님).</label>}
        <fieldset className="mt-3 grid gap-2 text-xs"><legend className="font-semibold">확인한 근거 (선택)</legend>
          <input value={evidence.url} onChange={e=>setEvidence(v=>({...v,url:e.target.value}))} placeholder="https:// 공식 페이지" className={`${input} min-h-11`} aria-label="근거 주소"/>
          <input value={evidence.publisher} onChange={e=>setEvidence(v=>({...v,publisher:e.target.value}))} placeholder="발행처 (예: 제조사 이름)" className={`${input} min-h-11`} aria-label="발행처"/>
          <select value={evidence.sourceType} onChange={e=>setEvidence(v=>({...v,sourceType:e.target.value}))} className={`${input} min-h-11`} aria-label="근거 종류">
            {evidenceTypes.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select>
        </fieldset>
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy||dirty||downgradeRisk&&!ack||needsCreate&&!create} onClick={()=>void apply()} className="btn-stamp inline-flex min-h-11 flex-1 items-center justify-center font-semibold disabled:opacity-50">{busy?'반영 중…':'반영 확정'}</button>
          <button type="button" onClick={()=>setConfirming(false)} className="min-h-11 rounded-sm border border-[#4a3728]/40 px-3">취소</button>
        </div></>}
    </section>}
    {applied&&applied.downgraded.length>0&&<p className="mt-2 text-xs text-stone-700">재인증이 필요한 병: {applied.downgraded.map(b=>`#${b}`).join(', ')}</p>}

    <details className="mt-6 text-xs"><summary className="min-h-11 cursor-pointer py-3 font-semibold">처리 이력 ({view.events.length})</summary>
      <ol className="space-y-1">{view.events.map(e=><li key={e.id}>{new Date(e.createdAt).toLocaleString('ko-KR')} · {e.action} {e.fromStatus??''}→{e.toStatus??''} · uid {e.actorUid??'-'} {e.reason?`· ${e.reason}`:''}</li>)}</ol></details>
    {view.similar.length>0&&<details className="mt-2 text-xs"><summary className="min-h-11 cursor-pointer py-3 font-semibold">같은 대상의 다른 제보 ({view.similar.length})</summary>
      <ul>{view.similar.map(s=><li key={s.id}><Link href={`/admin/contributions/${s.id}`} className="inline-flex min-h-11 items-center underline">{s.fields.map(fieldLabel).join(', ')} · {statusLabel[s.status]}</Link></li>)}</ul></details>}
  </PaperPage>;
}
