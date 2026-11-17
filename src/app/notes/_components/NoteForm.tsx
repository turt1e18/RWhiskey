"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import {
  LIMITS, SERVING_LABELS, clearDraft, draftKey, draftProblem, loadDraft, sameDraft, saveDraft, toRequest,
  type EntryDraft, type EntryServing, type EntrySource, type TastingEntry,
} from "@/lib/notes/entryDraft";

interface Props {
  uid: number;
  /** 초안을 구분하는 이름: 새 글은 "new", 수정은 노트 id. */
  scope: string;
  /** 서버에 저장된 상태(새 글이면 빈 값). 초안이 이것과 같으면 보관하지 않는다. */
  initial: EntryDraft;
  /** 수정할 노트 id. 없으면 새로 만든다. */
  entryId?: number;
  /** 추천에서 온 노트는 이름을 서버가 정하므로 고칠 수 없다. */
  nameLocked?: boolean;
  source?: EntrySource;
  onSaved: (entry: TastingEntry) => void;
  onCancel?: () => void;
}

const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
const input = "mt-2 min-h-11 w-full rounded border border-[#4a3728]/40 bg-white/50 px-3 py-2 text-base text-[#3e2616] placeholder:text-[#3e2616]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3e2616]";
const label = "block text-sm font-bold";
const optional = <span className="ml-1 font-normal text-[#3e2616]/70">선택</span>;

const RATING_STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

/** 0.5점 단위 점수. 별 아이콘의 반쪽 버튼(16px)은 손가락으로 누르기 어려워 44px 버튼으로 둔다. 다시 누르면 해제된다. */
function RatingPicker({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  return (
    <div className="grid w-full grid-cols-5 gap-2">
      {RATING_STEPS.map((step) => {
        const on = value === step;
        return (
          <button key={step} type="button" aria-pressed={on} aria-label={`${step}점`} onClick={() => onChange(on ? null : step)}
            className={`min-h-11 rounded border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e2616] ${on ? "border-[#3e2616] bg-[#3e2616] font-bold text-[#fdfbf7]" : "border-[#4a3728]/50 bg-white/40"}`}>
            {step.toFixed(1)}
          </button>
        );
      })}
    </div>
  );
}

/** 한 줄 메모로 끝낼 수도, 향·맛·여운을 펼쳐 자세히 적을 수도 있는 단일 폼. */
export function NoteForm({ uid, scope, initial, entryId, nameLocked = false, source, onSaved, onCancel }: Props) {
  const key = draftKey(uid, scope);
  const [draft, setDraft] = useState(initial);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ message: string; needsLogin: boolean } | null>(null);
  const loaded = useRef(false);
  // 저장을 시작한 뒤에는 자동 보관이 초안을 되살리지 못하게 한다(저장된 노트의 제출 키가 남으면 다음 새 글이 그 노트로 합쳐진다).
  const saving = useRef(false);

  // 이전에 쓰다 만 글이 있으면 이어서 보여 준다.
  useEffect(() => {
    const stored = loadDraft(localStorage, key);
    if (stored && !sameDraft(stored, initial)) { setDraft(stored); setRestored(true); }
    loaded.current = true;
    // 처음 한 번만 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 입력이 멈추면 이 기기에 보관한다. 저장된 상태와 같아지면 지운다.
  useEffect(() => {
    if (!loaded.current) return;
    const timer = setTimeout(() => {
      if (saving.current) return;
      if (sameDraft(draft, initial)) clearDraft(localStorage, key); else saveDraft(localStorage, key, draft);
    }, 400);
    return () => clearTimeout(timer);
  }, [draft, initial, key]);

  const set = <K extends keyof EntryDraft>(field: K, value: EntryDraft[K]) => { setDraft((current) => ({ ...current, [field]: value })); setNotice(null); };
  const wish = draft.status === "WISH";
  const partsUsed = Boolean(draft.nose || draft.palate || draft.finish);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const problem = draftProblem(draft, nameLocked, today());
    if (problem) { setNotice({ message: problem, needsLogin: false }); return; }
    setBusy(true); setNotice(null); saving.current = true;
    // 저장이 끝나기 전에 창을 닫아도 글이 남도록 먼저 보관한다.
    saveDraft(localStorage, key, draft);
    try {
      const saved = entryId === undefined
        ? await tastingEntryApi.create(toRequest(draft, { source }))
        : await tastingEntryApi.replace(entryId, toRequest(draft));
      clearDraft(localStorage, key);
      onSaved(saved);
    } catch (error) {
      setNotice(describeEntryError(error, "save"));
      saving.current = false; setBusy(false);
    }
  }

  function discard() {
    clearDraft(localStorage, key);
    setDraft(initial); setRestored(false); setNotice(null);
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 space-y-6">
      {restored && (
        <p role="status" className="rounded border border-[#4a3728]/30 bg-white/40 p-3 text-sm leading-6">
          저장하지 않은 글을 불러왔어요.{" "}
          <button type="button" onClick={discard} className="min-h-11 font-bold underline underline-offset-4">불러온 글 버리기</button>
        </p>
      )}

      <fieldset disabled={busy} className="space-y-6">
        <div>
          <label htmlFor="note-name" className={label}>위스키 이름</label>
          {nameLocked ? (
            <p id="note-name" className="mt-2 break-words text-lg font-bold">{draft.whiskeyName}</p>
          ) : (
            <input id="note-name" value={draft.whiskeyName} onChange={(event) => set("whiskeyName", event.target.value)} maxLength={LIMITS.whiskeyName}
              autoComplete="off" placeholder="예: 글렌피딕 12년" className={input} />
          )}
        </div>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={wish} onChange={(event) => set("status", event.target.checked ? "WISH" : "TASTED")} className="h-5 w-5 accent-[#3e2616]" />
          아직 마시지 않았어요. 마실 목록에 담아 둘게요.
        </label>

        {!wish && (
          <>
            <div>
              <label htmlFor="note-date" className={label}>마신 날{optional}</label>
              <input id="note-date" type="date" max={today()} value={draft.tastedOn} onChange={(event) => set("tastedOn", event.target.value)} className={input} />
            </div>

            <div role="group" aria-labelledby="note-serving">
              <p id="note-serving" className={label}>마신 방법{optional}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.keys(SERVING_LABELS) as EntryServing[]).map((serving) => {
                  const on = draft.serving === serving;
                  return (
                    <button key={serving} type="button" aria-pressed={on} onClick={() => set("serving", on ? null : serving)}
                      className={`min-h-11 rounded-full border px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e2616] ${on ? "border-[#3e2616] bg-[#3e2616] font-bold text-[#fdfbf7]" : "border-[#4a3728]/50 bg-white/40"}`}>
                      {SERVING_LABELS[serving]}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="note-memo" className={label}>{wish ? "메모" : "한 잔의 메모"}{optional}</label>
          <textarea id="note-memo" value={draft.memo} onChange={(event) => set("memo", event.target.value)} maxLength={LIMITS.memo} rows={5}
            placeholder={wish ? "왜 마셔 보고 싶은지 적어 두세요." : "오늘 이 한 잔은 어땠나요? 한 줄이어도 좋아요."} className={input} aria-describedby="note-memo-count" />
          <p id="note-memo-count" className="mt-1 text-right text-xs text-[#3e2616]/70">{draft.memo.length} / {LIMITS.memo}</p>
        </div>

        {!wish && (
          <>
            {/* 이미 적은 내용이 있으면 펼친 채로 시작한다. */}
            <details open={partsUsed || undefined} className="rounded border border-[#4a3728]/30 bg-white/30 px-4">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-bold">향·맛·여운 나눠 적기{optional}</summary>
              <div className="space-y-4 pb-4">
                {([["nose", "향", "잔에서 처음 올라온 향"], ["palate", "맛", "입 안에서 느껴진 맛"], ["finish", "여운", "삼킨 뒤에 남은 느낌"]] as const).map(([field, name, hint]) => (
                  <div key={field}>
                    <label htmlFor={`note-${field}`} className={label}>{name}</label>
                    <textarea id={`note-${field}`} value={draft[field]} onChange={(event) => set(field, event.target.value)} maxLength={LIMITS.part} rows={3} placeholder={hint} className={input} />
                  </div>
                ))}
              </div>
            </details>

            <div role="group" aria-labelledby="note-rating">
              <p id="note-rating" className={label}>내 취향 점수{optional}</p>
              <p className="mt-1 text-xs leading-5 text-[#3e2616]/70">내 입맛에 얼마나 맞았는지예요. 위스키의 품질 평가가 아니에요.</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <RatingPicker value={draft.rating} onChange={(value) => set("rating", value)} />
                {draft.rating !== null && (
                  <button type="button" onClick={() => set("rating", null)} className="min-h-11 text-sm underline underline-offset-4">점수 지우기</button>
                )}
              </div>
            </div>
          </>
        )}
      </fieldset>

      {notice && (
        <div role="alert" className="rounded border border-[#a8201a]/50 bg-[#a8201a]/10 p-3 text-sm leading-6">
          {notice.message}
          {notice.needsLogin && (
            <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-12 flex-1 rounded border border-[#3e2616] px-4 font-bold disabled:opacity-50">취소</button>
        )}
        <button type="submit" disabled={busy} className="min-h-12 flex-[2] rounded bg-[#3e2616] px-4 font-bold text-[#fdfbf7] disabled:opacity-60">
          {busy ? "저장하는 중…" : wish ? "마실 목록에 담기" : "기록 저장"}
        </button>
      </div>
    </form>
  );
}
