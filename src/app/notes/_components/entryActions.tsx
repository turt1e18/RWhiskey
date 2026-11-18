"use client";

import Link from "next/link";
import { useState } from "react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { REPORT_REASONS, type ReportReason, type SaveFailure, type TastingEntry } from "@/lib/notes/entryDraft";

export function EntryProblem({ failure }: { failure: SaveFailure }) {
  return (
    <p role="alert" className="mt-2 text-sm leading-6">
      {failure.message}
      {failure.needsLogin && <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>}
    </p>
  );
}

/** 남의 공개 글 한 건의 저장·신고 상태와 동작. 라운지 쪽지와 저장 목록 상세가 함께 쓴다. */
export function useEntryActions(entry: TastingEntry, onSavedChange?: (saved: boolean) => void) {
  const [saved, setSaved] = useState(entry.bookmarked);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  async function toggleSave() {
    if (busy) return;
    setBusy(true); setFailure(null);
    try {
      if (saved) await tastingEntryApi.unbookmark(entry.id); else await tastingEntryApi.bookmark(entry.id);
      setSaved(!saved); onSavedChange?.(!saved);
    } catch (error) { setFailure(describeEntryError(error, "bookmark")); }
    finally { setBusy(false); }
  }

  async function sendReport() {
    if (busy || !reason) return;
    setBusy(true); setFailure(null);
    try { await tastingEntryApi.report(entry.id, reason); setReported(true); setReporting(false); }
    catch (error) { setFailure(describeEntryError(error, "report")); }
    finally { setBusy(false); }
  }

  return { saved, busy, failure, reporting, setReporting, reason, setReason, reported, toggleSave, sendReport, cancelReport: () => { setReporting(false); setReason(null); } };
}

export type EntryActions = ReturnType<typeof useEntryActions>;

/** 신고 버튼과 사유 선택 패널. 이미 신고했으면 접수 안내만 보인다. */
export function ReportControl({ id, actions }: { id: number; actions: EntryActions }) {
  const { reporting, setReporting, reported } = actions;
  return reported
    ? <span role="status" className="text-sm">신고를 접수했어요.</span>
    : <button type="button" aria-expanded={reporting} onClick={() => setReporting(!reporting)} aria-controls={`report-${id}`} className="min-h-11 px-2 font-serif text-sm underline underline-offset-4">신고</button>;
}

export function ReportPanel({ id, actions }: { id: number; actions: EntryActions }) {
  const { reporting, reason, setReason, busy, sendReport, cancelReport } = actions;
  if (!reporting) return null;
  return (
    <fieldset id={`report-${id}`} className="mt-3 rounded-sm border border-[#3e2616]/40 bg-white/60 p-3 text-[#3e2616]">
      <legend className="px-1 font-serif text-sm font-bold">어떤 문제인가요?</legend>
      {REPORT_REASONS.map(({ key, label }) => (
        <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="radio" name={`reason-${id}`} checked={reason === key} onChange={() => setReason(key)}
            className="h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-[#3e2616] bg-white checked:bg-[#3e2616] checked:shadow-[inset_0_0_0_3px_#fdfbf7]" />
          {label}
        </label>
      ))}
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={cancelReport} className="min-h-11 flex-1 rounded-sm border border-[#3e2616] font-serif text-sm tracking-wider">취소</button>
        <button type="button" disabled={!reason || busy} onClick={() => void sendReport()} className="min-h-11 flex-1 rounded-sm bg-[#3e2616] font-serif text-sm tracking-wider text-[#fdfbf7] disabled:opacity-50">{busy ? "보내는 중…" : "신고하기"}</button>
      </div>
    </fieldset>
  );
}
