"use client";
import Link from 'next/link';
import {Suspense,useEffect,useId,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {ApiResponseError} from '@/api/apiClient';
import {contributionApi,type ContributionKind,type ContributionReceipt,type ContributionTargetCandidate} from '@/api/contributionApi';
import type {InformationReportField,InformationReportSource} from '@/api/whiskeyV3Api';
import {PaperPage} from '@/components/PaperPage';
import {REPORT_MAX_LENGTH,reportFieldGroups,reportFieldOptions,reportSourceOptions} from '@/lib/recommendations/informationReport';
import {contentReady,contributionFailure,fieldLabel,formReady,kindOptions,urlAllowed,urlReady} from '@/lib/contribution/contribution';
import {useAuthStore} from '@/store/authStore';

const chip=(active:boolean)=>`inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-3 py-1.5 text-[13px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a3728] ${
  active?'border-[#2d2017] bg-[#4a3728]/10 font-bold text-[#2d2017]':'border-[#4a3728]/30 bg-white/40 text-stone-700 hover:border-[#4a3728]/60'}`;
const field='w-full rounded-sm border border-[#4a3728]/40 bg-white/50 p-3 text-sm leading-6 outline-none placeholder:text-stone-500 focus:border-[#2d2017]';

function describe(c:ContributionTargetCandidate){
  return [c.edition,c.batchCode&&`배치 ${c.batchCode}`,c.ageYears?`${c.ageYears}년`:c.ageStatementType==='NAS'?'숙성 연수 표기 없음':null,
    c.abv&&`${Number(c.abv)}%`,c.volumeMl&&`${c.volumeMl}ml`].filter(Boolean).join(' · ');
}

function ContributeForm(){
  const params=useSearchParams();
  const {isAuthenticated,isInitialized}=useAuthStore();
  const ids=useId();
  const [kind,setKind]=useState<ContributionKind|null>(null);
  const [query,setQuery]=useState(params.get('q')??'');
  const [results,setResults]=useState<ContributionTargetCandidate[]|null>(null);
  const [searching,setSearching]=useState(false);
  const [searchError,setSearchError]=useState<{message:string;relogin:boolean}|null>(null);
  const [target,setTarget]=useState<ContributionTargetCandidate|null>(null);
  const [labelName,setLabelName]=useState('');
  const [picked,setPicked]=useState<Set<InformationReportField>>(new Set());
  const [contents,setContents]=useState<Partial<Record<InformationReportField,string>>>({});
  const [otherText,setOtherText]=useState('');
  const [source,setSource]=useState<InformationReportSource|null>(null);
  const [url,setUrl]=useState('');
  const [note,setNote]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<{message:string;authExpired:boolean;showMine?:boolean}|null>(null);
  const [receipt,setReceipt]=useState<ContributionReceipt|null>(null);
  const entry=params.get('from')==='notes'?'NOTES_AI':params.get('from')==='nav'?'NAV':'STANDALONE';

  const fields=reportFieldOptions.filter(o=>picked.has(o.value)).map(o=>o.value);
  const ready=formReady({kind,targetId:target?.bottlingId??null,labelName,fields,contents,otherText,source,url})&&!busy;

  async function search(q=query.trim()){
    if([...q].length<2){setSearchError({message:'두 글자 이상 입력해 주세요.',relogin:false});return;}
    setSearching(true);setSearchError(null);setTarget(null);
    try {setResults(await contributionApi.targets(q));}
    catch(e){
      const s=e instanceof ApiResponseError?e.status:null;
      setSearchError(s===401||s===403?{message:'로그인이 만료되었어요. 새 탭에서 다시 로그인한 뒤 다시 찾아 주세요.',relogin:true}
        :{message:s===429?'잠시 뒤에 다시 검색해 주세요.':'검색하지 못했어요. 다시 시도해 주세요.',relogin:false});
    } finally {setSearching(false);}
  }

  // Coming from a saved note with a name: open on "correction" and run the search once.
  const initialQ=params.get('q');
  useEffect(()=>{ if(initialQ&&isAuthenticated){setKind('CORRECTION');void search(initialQ.trim());}
  },[initialQ,isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps -- run once per arriving query, not on every render
  // What the catalog says now, shown beside the field being corrected.
  const currentOf=(f:InformationReportField)=>!target?null:f==='ABV'&&target.abv?`${Number(target.abv)}%`
    :f==='AGE_STATEMENT'?(target.ageYears?`${target.ageYears}년`:target.ageStatementType==='NAS'?'연수 표기 없음':null)
    :f==='VOLUME'&&target.volumeMl?`${target.volumeMl}ml`:f==='EDITION'?([target.edition,target.batchCode].filter(Boolean).join(' · ')||null):null;
  function toggle(f:InformationReportField){
    setPicked(cur=>{const next=new Set(cur);if(!next.delete(f))next.add(f);return next;});setError(null);
  }
  function switchToNew(){setKind('NEW_BOTTLE');setLabelName(query.trim());setTarget(null);setError(null);}

  async function submit(e:React.FormEvent){
    e.preventDefault(); if(!ready||!kind)return;
    setBusy(true);setError(null);
    const items=kind==='OTHER'?[{field:'OTHER' as const,content:otherText.trim()}]
      :fields.map(f=>({field:f,content:contents[f]?.trim()||null}));
    try {
      setReceipt(await contributionApi.submit({kind,entryPoint:entry,items,source,
        sourceUrl:url.trim()&&urlAllowed(source)?url.trim():null,note:note.trim()||null,
        target:kind==='CORRECTION'&&target?{type:'CATALOG',id:target.bottlingId}:null,
        newBottle:kind==='NEW_BOTTLE'?{name:labelName.trim()}:null}));
    } catch(err){
      const code=err instanceof ApiResponseError?(err.data as {code?:string}|null)?.code??null:null;
      setError(contributionFailure(err instanceof ApiResponseError?err.status:null,code));
    } finally {setBusy(false);}
  }

  if(!isInitialized)return <PaperPage title="위스키 정보 알려주기" wide><p role="status" className="text-sm">불러오는 중…</p></PaperPage>;
  if(!isAuthenticated)return <PaperPage title="위스키 정보 알려주기" wide>
    <p className="text-sm leading-relaxed">위스키 정보를 알려주시려면 먼저 로그인해 주세요. 보내 주신 내용이 어떻게 처리됐는지 나중에 확인할 수 있어요.</p>
    <Link href="/login" className="btn-stamp mt-5 inline-flex min-h-11 w-full items-center justify-center font-semibold">로그인하러 가기</Link>
  </PaperPage>;

  if(receipt)return <PaperPage title="보내주셔서 고마워요" wide>
    <div role="status" className="space-y-2 text-sm leading-relaxed">
      <p className="font-semibold">확인한 뒤 맞으면 위스키 정보에 반영해요. 바로 바뀌지는 않아요.</p>
      <p>보낸 항목: {receipt.fields.map(fieldLabel).join(', ')}</p>
      {receipt.skippedPending.length>0&&<p>이전에 보내주신 내용이 아직 확인을 기다리고 있어 이번에는 뺐어요: {receipt.skippedPending.map(fieldLabel).join(', ')}</p>}
    </div>
    <Link href="/contribute/mine" className="btn-stamp mt-6 inline-flex min-h-11 w-full items-center justify-center font-semibold">내가 알려준 정보 보기</Link>
    <button type="button" onClick={()=>{setReceipt(null);setKind(null);setPicked(new Set());setContents({});setTarget(null);setResults(null);setOtherText('');setNote('');setUrl('');setSource(null);setLabelName('');}}
      className="mt-2 inline-flex min-h-11 w-full items-center justify-center text-sm underline underline-offset-2">하나 더 알려주기</button>
  </PaperPage>;

  return <PaperPage title="위스키 정보 알려주기" wide>
    <p className="text-sm leading-relaxed">알고 계신 위스키 정보를 알려주세요. 확인한 뒤 맞으면 반영해요. 바로 화면이 바뀌지는 않아요.</p>
    <p className="mt-1 text-xs text-stone-700">이름·연락처·주문번호 같은 개인정보는 적지 말아 주세요. 맛과 향 이야기는 <Link href="/notes" className="inline-flex min-h-11 items-center underline underline-offset-2">시음 노트</Link>에 남겨 주세요.</p>
    <form onSubmit={submit} className="mt-5 flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm font-bold">무엇을 알려주실래요?</legend>
        <div className="mt-2 grid gap-2">{kindOptions.map(o=><label key={o.value} className={`${chip(kind===o.value)} flex-col items-start gap-0.5 py-2`}>
          <input type="radio" name={`${ids}-kind`} className="sr-only" checked={kind===o.value} onChange={()=>{setKind(o.value);setError(null);}}/>
          <span className="text-sm">{o.label}</span><span className="text-xs font-normal text-stone-600">{o.hint}</span></label>)}</div>
      </fieldset>

      {kind==='CORRECTION'&&<section aria-labelledby={`${ids}-find`} className="flex flex-col gap-2">
        <h2 id={`${ids}-find`} className="text-sm font-bold">어떤 위스키인가요?</h2>
        <div className="flex gap-2">
          <label htmlFor={`${ids}-q`} className="sr-only">위스키 이름</label>
          <input id={`${ids}-q`} value={query} onChange={e=>setQuery(e.target.value)} maxLength={80} placeholder="예: Glenfiddich 12"
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void search(query.trim());}}} className={field}/>
          <button type="button" onClick={()=>void search(query.trim())} disabled={searching} className="btn-stamp inline-flex min-h-11 shrink-0 items-center px-4 text-sm font-semibold disabled:opacity-50">{searching?'찾는 중…':'찾기'}</button>
        </div>
        {searchError&&<div role="alert" className="text-sm text-red-800"><p>{searchError.message}</p>
          {searchError.relogin&&<Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold underline">새 탭에서 다시 로그인</Link>}</div>}
        {results&&<div role="group" aria-label="검색 결과" className="flex flex-col gap-2">
          {results.length===0&&<p className="text-sm">찾는 위스키가 목록에 없어요.</p>}
          {results.map(r=><label key={r.bottlingId} className={`${chip(target?.bottlingId===r.bottlingId)} flex-col items-start gap-0.5 py-2`}>
            <input type="radio" name={`${ids}-target`} className="sr-only" checked={target?.bottlingId===r.bottlingId} onChange={()=>setTarget(r)}/>
            <span className="text-sm">{r.displayName}</span>{describe(r)&&<span className="text-xs font-normal text-stone-600">{describe(r)}</span>}</label>)}
          <button type="button" onClick={switchToNew} className="inline-flex min-h-11 items-center text-sm underline underline-offset-2">찾는 위스키가 없어요 — 새로 알려주기</button>
        </div>}
      </section>}

      {kind==='NEW_BOTTLE'&&<div className="flex flex-col gap-1">
        <label htmlFor={`${ids}-name`} className="text-sm font-bold">라벨에 적힌 이름</label>
        <input id={`${ids}-name`} value={labelName} onChange={e=>setLabelName(e.target.value)} maxLength={250} placeholder="예: Kilchoman Machir Bay" className={field}/>
        <p className="text-xs text-stone-600">이름만 적어도 보낼 수 있어요. 아래에서 아는 정보를 더 고를 수 있어요.</p>
      </div>}

      {(kind==='CORRECTION'&&target||kind==='NEW_BOTTLE')&&<fieldset>
        <legend className="text-sm font-bold">{kind==='CORRECTION'?'어떤 정보가 다른가요?':'더 아는 정보 (선택)'} <span className="font-normal text-stone-600">(여러 개 고를 수 있어요)</span></legend>
        {reportFieldGroups.map(g=><div key={g.title} className="mt-3"><p className="text-xs font-semibold text-stone-600">{g.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">{g.options.filter(o=>!(kind==='NEW_BOTTLE'&&o.value==='NAME')).map(o=>
            <label key={o.value} className={chip(picked.has(o.value))}><input type="checkbox" className="sr-only" checked={picked.has(o.value)} onChange={()=>toggle(o.value)}/>{o.label}
              {o.value==='FLAVOR'&&<span className="ml-1 text-[11px] font-normal text-stone-500">(참고만 해요, 반영되지 않아요)</span>}</label>)}</div></div>)}
        {fields.length>0&&<div className="mt-4 space-y-4 border-t border-[#4a3728]/25 pt-4">{fields.map(f=>{
          const o=reportFieldOptions.find(x=>x.value===f)!;const v=contents[f]??'';const id=`${ids}-${f}`;const bad=v.trim()!==''&&!contentReady(f,v);
          const now=kind==='CORRECTION'?currentOf(f):null;
          return <div key={f}><label htmlFor={id} className="text-sm font-bold">{o.label}{now?` — 지금 목록: ${now} → 바른 정보`:kind==='CORRECTION'?' — 바른 정보':''}{f==='PHOTO_MISMATCH'?' (선택)':''}</label>
            <textarea id={id} rows={2} maxLength={REPORT_MAX_LENGTH} value={v} placeholder={o.placeholder} aria-invalid={bad} aria-describedby={`${id}-n`}
              onChange={e=>{const t=e.target.value;setContents(c=>({...c,[f]:t}));setError(null);}} className={`mt-1.5 resize-none ${field}`}/>
            <p id={`${id}-n`} className="flex justify-between text-xs text-stone-600"><span className={bad?'text-red-800':''}>{bad?'2자 이상 적어 주세요':''}</span>{[...v].length}/{REPORT_MAX_LENGTH}</p></div>;
        })}</div>}
      </fieldset>}

      {kind==='OTHER'&&<div className="flex flex-col gap-1">
        <label htmlFor={`${ids}-other`} className="text-sm font-bold">어떤 내용인가요?</label>
        <textarea id={`${ids}-other`} rows={4} maxLength={REPORT_MAX_LENGTH} value={otherText} onChange={e=>setOtherText(e.target.value)}
          placeholder="예: 'Glenfiddich 12'가 두 번 나와요 / 단종된 제품이에요" className={`resize-none ${field}`}/>
        <p className="text-right text-xs text-stone-600">{[...otherText].length}/{REPORT_MAX_LENGTH}</p>
      </div>}

      {kind&&<>
        <fieldset>
          <legend className="text-sm font-bold">어떻게 알게 되셨나요? <span className="font-normal text-stone-600">(선택)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">{reportSourceOptions.map(o=><button key={o.value} type="button" aria-pressed={source===o.value}
            onClick={()=>setSource(c=>c===o.value?null:o.value)} className={chip(source===o.value)}>{o.label}</button>)}</div>
          {urlAllowed(source)&&<div className="mt-3 flex flex-col gap-1">
            <label htmlFor={`${ids}-url`} className="text-sm font-bold">확인한 페이지 주소 (선택)</label>
            <input id={`${ids}-url`} type="url" inputMode="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://" aria-invalid={!urlReady(url)} className={field}/>
            {!urlReady(url)&&<p className="text-xs text-red-800">http 또는 https로 시작하는 주소를 적어 주세요.</p>}
          </div>}
        </fieldset>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-note`} className="text-sm font-bold">덧붙일 말 (선택)</label>
          <textarea id={`${ids}-note`} rows={2} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} className={`resize-none ${field}`}/>
        </div>
        {error&&<div role="alert" className="rounded-sm border border-red-700/30 bg-red-100 p-3 text-sm leading-6 text-red-900"><p>{error.message}</p>
          {error.authExpired&&<Link href="/login" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center font-semibold underline">새 탭에서 다시 로그인</Link>}
          {error.showMine&&<Link href="/contribute/mine" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center font-semibold underline">내가 알려준 정보 보기</Link>}</div>}
        <button type="submit" disabled={!ready} className="btn-stamp inline-flex min-h-12 items-center justify-center font-semibold disabled:opacity-50">{busy?'보내는 중…':'보내기'}</button>
        {!ready&&!busy&&<p className="-mt-4 text-center text-xs text-stone-600">{kind==='CORRECTION'?(target?'다른 정보를 하나 이상 고르고 내용을 적어 주세요.':'먼저 위스키를 찾아 골라 주세요.')
          :kind==='NEW_BOTTLE'?'라벨에 적힌 이름을 적어 주세요.':'내용을 2자 이상 적어 주세요.'}</p>}
      </>}
      <Link href="/contribute/mine" className="inline-flex min-h-11 items-center justify-center text-sm underline underline-offset-2">내가 알려준 정보 보기</Link>
    </form>
  </PaperPage>;
}

export default function ContributePage(){
  return <Suspense fallback={null}><ContributeForm/></Suspense>;
}
