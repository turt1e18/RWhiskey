"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { GlencairnButton } from "./GlencairnButton";
import { REPORT_REASONS, type ReportReason, type SaveFailure, type TastingEntry } from "@/lib/notes/entryDraft";

export function EntryProblem({ failure }: { failure: SaveFailure }) {
  return (
    <p role="alert" className="mt-2 text-sm leading-6">
      {failure.message}
      {failure.needsLogin && <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>}
    </p>
  );
}

/** 남의 공개 글 한 건의 신고 상태와 동작. 라운지 상세와 좋아요한 글 상세가 함께 쓴다. */
export function useEntryActions(entry: TastingEntry) {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [reported, setReported] = useState(false);

  async function sendReport() {
    if (busy || !reason) return;
    setBusy(true); setFailure(null);
    try { await tastingEntryApi.report(entry.id, reason); setReported(true); setReporting(false); }
    catch (error) { setFailure(describeEntryError(error, "report")); }
    finally { setBusy(false); }
  }

  return { busy, failure, reporting, setReporting, reason, setReason, reported, sendReport, cancelReport: () => { setReporting(false); setReason(null); } };
}

/** 좋아요 한 건의 상태. 먼저 화면에 반영하고, 서버가 거절하면 되돌린다. */
export function useEntryLike(entry: TastingEntry, onChange?: (liked: boolean) => void) {
  const [liked, setLiked] = useState(entry.liked);
  const [likes, setLikes] = useState(entry.likeCount);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);

  async function toggle() {
    if (busy || entry.mine) return;
    const was = liked, step = was ? -1 : 1;
    setBusy(true); setFailure(null); setLiked(!was); setLikes((n) => Math.max(0, n + step));
    try { if (was) await tastingEntryApi.unlike(entry.id); else await tastingEntryApi.like(entry.id); onChange?.(!was); }
    catch (error) { setLiked(was); setLikes((n) => Math.max(0, n - step)); setFailure(describeEntryError(error, "like")); }
    finally { setBusy(false); }
  }
  return { liked, likes, busy, failure, toggle, mine: entry.mine };
}

export function LikeButton({ like, name }: { like: ReturnType<typeof useEntryLike>; name?: string }) {
  // 기존 라운지와 같은 글렌캐런 잔. 좋아요를 누르면 잔에 위스키가 차오른다.
  return (
    <GlencairnButton liked={like.liked} count={like.likes} onClick={() => void like.toggle()} disabled={like.mine} busy={like.busy} pressed={like.mine ? undefined : like.liked}
      label={`${name ? `${name} 글 ` : ""}${like.mine ? "내 글은 좋아요를 누를 수 없어요. 지금 " : "좋아요 "}${like.likes}개`} className="min-h-11 min-w-11 disabled:cursor-default" />
  );
}

export type EntryActions = ReturnType<typeof useEntryActions>;

/** 신고 버튼과 사유 선택 패널. 이미 신고했으면 접수 안내만 보인다. */
export function ReportControl({ id, actions }: { id: number; actions: EntryActions }) {
  const { reporting, setReporting, reported } = actions;
  const notice = useRef<HTMLSpanElement>(null);
  // 신고 버튼과 패널이 함께 사라지므로 포커스를 접수 안내로 옮긴다.
  useEffect(() => { if (reported) notice.current?.focus(); }, [reported]);
  return (
    <>
      <span ref={notice} role="status" tabIndex={-1} className="text-sm">{reported ? "신고를 접수했어요. 운영진이 확인한 뒤 처리해요." : ""}</span>
      {!reported && <button type="button" aria-expanded={reporting} onClick={() => setReporting(!reporting)} aria-controls={`report-${id}`} className="min-h-11 min-w-11 px-2 font-serif text-sm underline underline-offset-4">신고</button>}
    </>
  );
}

export function ReportPanel({ id, actions }: { id: number; actions: EntryActions }) {
  const { reporting, reason, setReason, busy, sendReport, cancelReport } = actions;
  const panel = useRef<HTMLFieldSetElement>(null);
  useEffect(() => { if (reporting) panel.current?.querySelector("input")?.focus(); }, [reporting]);
  if (!reporting) return null;
  return (
    <fieldset ref={panel} id={`report-${id}`} className="mt-3 rounded-sm border border-[#3e2616]/40 bg-white/60 p-3 text-[#3e2616]">
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
