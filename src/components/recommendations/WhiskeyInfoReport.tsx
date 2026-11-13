"use client";
import Link from 'next/link';
import {useId,useState} from 'react';
import {whiskeyV3Api,type InformationReportEntry,type InformationReportField,type InformationReportSource} from '@/api/whiskeyV3Api';
import {ApiResponseError} from '@/api/apiClient';
import {useDialogFocus} from '@/lib/useDialogFocus';
import {REPORT_MAX_LENGTH,reportFailure,reportFieldOptions,reportReady,reportSourceOptions} from '@/lib/recommendations/informationReport';

const choiceClass=(active:boolean)=>`inline-flex min-h-11 cursor-pointer items-center rounded-sm border px-3 py-1.5 text-[13px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a3728] ${
  active?'border-[#2d2017] bg-[#4a3728]/10 font-bold text-[#2d2017]':'border-[#4a3728]/30 bg-white/20 text-stone-700 hover:border-[#4a3728]/60'}`;

/** 결과 카드 하단의 "정보 알려주기" 입구. 대화상자는 카드가 한 곳에서 연다. */
export default function WhiskeyInfoReport({onOpen}:{onOpen:()=>void}) {
  return <p className="mt-4 text-sm leading-6 text-stone-700">이 병에 대해 아는 게 있나요?{' '}
    <button type="button" onClick={onOpen} className="inline-flex min-h-11 items-center font-semibold text-[#2d2017] underline underline-offset-4">정보 알려주기</button>
  </p>;
}

/** 운영자 검토용 제보 대화상자. 화면에 바로 반영되지 않는다. 입구에 따라 항목을 미리 고를 수 있다. */
export function ReportDialog({operationId,initialField=null,entryPoint,onClose}:{operationId:string;
  initialField?:InformationReportField|null;entryPoint:InformationReportEntry;onClose:()=>void}) {
  const titleId=useId();const contentId=useId();const countId=useId();
  const [field,setField]=useState<InformationReportField|null>(initialField);
  const [content,setContent]=useState('');
  const [source,setSource]=useState<InformationReportSource|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<{message:string;authExpired:boolean}|null>(null);
  const [done,setDone]=useState(false);
  const ref=useDialogFocus<HTMLDivElement>(true,onClose);
  const ready=reportReady(field,content)&&!busy;
  const length=[...content].length;

  async function submit(){
    if(!field||!ready)return;
    setBusy(true);setError(null);
    try {
      await whiskeyV3Api.informationReport(operationId,{field,content:content.trim()||null,source,entryPoint});
      setDone(true);
    } catch(e) {
      const code=e instanceof ApiResponseError?(e.data as {code?:string}|null)?.code??null:null;
      setError(reportFailure(e instanceof ApiResponseError?e.status:null,code));
    } finally {setBusy(false);}
  }

  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 md:items-center md:p-4" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId}
      className="max-h-[90dvh] w-full overflow-y-auto rounded-t-lg border border-[#4a3728] bg-[#efe2c9] p-6 text-left text-stone-900 shadow-2xl md:max-w-lg md:rounded-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 id={titleId} className="text-lg font-bold text-[#2d2017]">이 병에 대해 알려주세요</h2>
        <button type="button" onClick={onClose} className="-mr-2 -mt-2 inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-stone-700 underline">닫기</button>
      </div>
      {done?<div role="status" className="mt-4 text-sm leading-6">
        <p className="font-semibold">보내주셔서 고마워요. 확인한 뒤 참고할게요.</p>
        <p className="mt-1 text-stone-700">지금 보이는 추천 결과는 바뀌지 않아요.</p>
        <button type="button" onClick={onClose} className="mt-5 flex min-h-12 w-full items-center justify-center bg-[#111] px-5 text-sm font-bold tracking-[0.12em] text-white hover:bg-[#2d2017]">닫기</button>
      </div>:<>
        <div className="mt-3 space-y-1 text-xs leading-5 text-stone-700">
          <p>보내주신 내용은 운영자가 확인한 뒤 위스키 정보 수집에 참고해요. 바로 화면에 반영되지는 않아요.</p>
          <p>이름·연락처·주문번호 같은 개인정보는 적지 말아 주세요.</p>
        </div>
        <fieldset className="mt-5">
          <legend className="text-sm font-bold">어떤 정보인가요?</legend>
          <div className="mt-2 flex flex-wrap gap-2">{reportFieldOptions.map(o=><label key={o.value} className={choiceClass(field===o.value)}>
            <input type="radio" name={`${titleId}-field`} value={o.value} checked={field===o.value} onChange={()=>{setField(o.value);setError(null);}} className="sr-only"/>{o.label}</label>)}</div>
        </fieldset>
        <div className="mt-5">
          <label htmlFor={contentId} className="text-sm font-bold">알고 있는 내용{field==='PHOTO_MISMATCH'?' (선택)':''}</label>
          <textarea id={contentId} value={content} maxLength={REPORT_MAX_LENGTH} rows={4} aria-describedby={countId}
            onChange={e=>{setContent(e.target.value);setError(null);}}
            placeholder="예: 라벨에 'Aged 12 Years'라고 적혀 있어요"
            className="mt-2 w-full resize-none rounded-sm border border-[#4a3728]/40 bg-white/40 p-3 text-sm leading-6 outline-none placeholder:text-stone-500 focus:border-[#2d2017]"/>
          <p id={countId} className="text-right text-xs text-stone-600">{length}/{REPORT_MAX_LENGTH}</p>
        </div>
        <fieldset className="mt-3">
          <legend className="text-sm font-bold">어떻게 알게 되셨나요? <span className="font-normal text-stone-600">(선택)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">{reportSourceOptions.map(o=><button key={o.value} type="button" aria-pressed={source===o.value}
            onClick={()=>setSource(current=>current===o.value?null:o.value)} className={choiceClass(source===o.value)}>{o.label}</button>)}</div>
        </fieldset>
        {error&&<div role="alert" className="mt-4 rounded-sm border border-red-700/30 bg-red-100 p-3 text-sm leading-6 text-red-900">
          <p>{error.message}</p>
          {error.authExpired&&<Link href="/login" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex min-h-11 items-center font-semibold underline">새 탭에서 다시 로그인</Link>}
        </div>}
        <button type="button" disabled={!ready} onClick={()=>void submit()}
          className="mt-5 flex min-h-12 w-full items-center justify-center bg-[#111] px-5 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] disabled:cursor-not-allowed disabled:opacity-50">
          {busy?'보내는 중…':'보내기'}</button>
      </>}
    </div>
  </div>;
}
