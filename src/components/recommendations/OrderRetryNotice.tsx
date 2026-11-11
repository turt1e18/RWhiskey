'use client';

import { forwardRef, useEffect, useState } from 'react';

// The server admits at most 3 orders per minute and counts failed ones too, so pace the retry.
export const RETRY_COOLDOWN_SECONDS = 20;

interface Props {
  /** Changes on every failed order so the cooldown restarts. */
  seq: number;
  busy: boolean;
  disabled?: boolean;
  onRetry: () => void;
}

const OrderRetryNotice = forwardRef<HTMLDivElement, Props>(function OrderRetryNotice({ seq, busy, disabled, onRetry }, ref) {
  const [left, setLeft] = useState(RETRY_COOLDOWN_SECONDS);
  useEffect(() => { setLeft(RETRY_COOLDOWN_SECONDS); }, [seq]);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const waiting = left > 0;

  return (
    <div ref={ref} tabIndex={-1} className="break-keep rounded border border-amber-200/30 bg-[#241b16] p-4">
      <div role="status">
        <strong className="mb-1 block text-base text-white">이번에는 알맞은 한 잔을 찾지 못했어요</strong>
        <p className="text-stone-300">고르신 취향에 맞는 후보를 지금은 확인하지 못했어요. 잠시 뒤 같은 조건으로 다시 신청해 주세요.</p>
      </div>
      <dl className="mt-3 divide-y divide-amber-200/15 border-y border-amber-200/15 text-[13px]">
        <div className="flex justify-between gap-4 py-2"><dt className="text-stone-400">추천 횟수</dt><dd className="text-amber-100">사용하지 않았어요</dd></div>
        <div className="flex justify-between gap-4 py-2"><dt className="text-stone-400">고른 조건</dt><dd className="text-amber-100">그대로 남아 있어요</dd></div>
      </dl>
      <button type="button" disabled={busy || disabled || waiting} onClick={onRetry}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded border border-amber-200/50 px-4 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? '주문을 살펴보고 있어요…' : '같은 조건으로 다시 신청'}
        {/* Hidden from assistive tech: the parent is a live region and a per-second count would be read out. */}
        {!busy && waiting && <span aria-hidden="true" className="text-xs font-normal text-stone-400">{left}초 뒤 가능</span>}
      </button>
    </div>
  );
});

export default OrderRetryNotice;
