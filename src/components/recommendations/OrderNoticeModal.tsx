"use client";
import Link from 'next/link';
import {useId} from 'react';
import {useDialogFocus} from '@/lib/useDialogFocus';
import type {OrderNoticeKind} from '@/lib/recommendations/orderNotice';

const copy:Record<OrderNoticeKind,{title:string;body?:string}>={
  AUTH:{title:'로그인을 다시 확인해 주세요',body:'선택하신 조건과 이전 주문은 그대로 있어요. 새 탭에서 같은 계정으로 로그인한 뒤 돌아와 주세요.'},
  DAILY_LIMITED:{title:'오늘 추천을 모두 사용했어요',body:'저장한 추천과 시음 기록은 계속 볼 수 있어요.'},
  RECOVER:{title:'이전 주문 결과를 먼저 확인해 주세요'},
};
const primary='flex min-h-12 w-full items-center justify-center bg-[#111] px-5 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] disabled:opacity-50';
const secondary='flex min-h-12 w-full items-center justify-center border border-[#4a3728] px-5 text-sm font-semibold text-[#2d2017] transition-colors hover:bg-[#4a3728]/10 disabled:opacity-50';

/** 사용자가 행동해야 다음으로 갈 수 있는 주문 안내. 이 안내는 주문서 위 안내 칸에는 나오지 않는다. */
export default function OrderNoticeModal({kind,message,onRecover,onClose}:{kind:OrderNoticeKind;message:string;
  onRecover:()=>void;onClose:()=>void}) {
  const titleId=useId();
  const ref=useDialogFocus<HTMLDivElement>(true,onClose);
  const text=copy[kind];
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div ref={ref} role="alertdialog" aria-modal="true" aria-labelledby={titleId}
      className="w-full max-w-md rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900 shadow-2xl">
      <h2 id={titleId} className="text-lg font-bold text-[#2d2017]">{text.title}</h2>
      {/* RECOVER는 상황마다 문구가 달라 서버 응답에서 고른 안내를 그대로 쓴다. */}
      <p className="mt-3 text-sm leading-6 text-stone-800">{text.body??message}</p>
      <div className="mt-6 space-y-2">
        {kind==='AUTH'&&<>
          <Link href="/login" target="_blank" rel="noopener noreferrer" className={primary}>새 탭에서 로그인</Link>
          <button type="button" onClick={onRecover} className={secondary}>로그인했어요 · 이전 주문 확인</button>
        </>}
        {kind==='DAILY_LIMITED'&&<Link href="/notes" className={primary}>내 시음 노트 보기</Link>}
        {kind==='RECOVER'&&<button type="button" onClick={onRecover} className={primary}>이전 주문 결과 확인</button>}
        <button type="button" onClick={onClose} className="flex min-h-11 w-full items-center justify-center text-sm text-stone-700 underline">닫기</button>
      </div>
    </div>
  </div>;
}
