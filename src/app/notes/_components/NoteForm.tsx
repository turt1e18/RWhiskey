"use client";

import Link from "next/link";
import { ChevronDown, Star } from "lucide-react";
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
  /** 입력값이 바뀔 때마다 알린다(왼쪽 수첩 면이 같은 값을 보여 주도록). 바뀌지 않는 함수를 넘긴다. */
  onPreview?: (draft: EntryDraft) => void;
}

const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
const input = "mt-2 min-h-11 w-full rounded border border-[#3e2616]/60 bg-white/50 px-3 py-2 text-base text-[#3e2616] placeholder:text-[#3e2616]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3e2616]";
const label = "block text-sm font-bold";
const optional = <span className="ml-1 font-normal text-[#3e2616]/70">선택</span>;

/**
 * 별을 눌러 고르는 0.5점 단위 점수. 별 하나를 반으로 나눠 왼쪽은 .5점, 오른쪽은 온전한 점수다.
 * 반쪽도 손가락으로 누를 수 있게 누르는 칸은 별 하나당 48px(반쪽 24px, 좁은 종이 폭 246px에 5개가 들어간다), 보이는 별은 28px, 마우스를 올리면 미리 보여 준다. 같은 점수를 다시 누르면 해제된다.
 */
function RatingPicker({ value, onChange }: { value: number | null; onChange: (value: number | null) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const half = "absolute top-0 z-10 h-full w-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3e2616]";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1" onMouseLeave={() => setHover(null)}>
      <div className="flex">
        {[0, 1, 2, 3, 4].map((index) => {
          const fill = Math.max(0, Math.min(1, shown - index));
          return (
            <span key={index} className="relative inline-block h-12 w-12">
              {/* 눈에 보이는 별은 28px로 작게, 누르는 칸은 48px로 넉넉하게 둔다. */}
              <span aria-hidden className="absolute left-[10px] top-[10px] h-7 w-7">
                <Star width={28} height={28} strokeWidth={1.5} className="absolute inset-0 text-[#3e2616]/35" />
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star width={28} height={28} strokeWidth={1.5} className="fill-[#b07d1e] text-[#b07d1e]" />
                </span>
              </span>
              {[index + 0.5, index + 1].map((step, side) => (
                <button key={step} type="button" aria-pressed={value === step} aria-label={`${step}점`}
                  onMouseEnter={() => setHover(step)} onClick={() => onChange(value === step ? null : step)}
                  className={`${half} ${side === 0 ? "left-0" : "right-0"}`} />
              ))}
            </span>
          );
        })}
      </div>
      <p aria-live="polite" className="font-serif text-lg text-[#3e2616]">
        {value === null ? <span className="text-sm text-[#3e2616]/70">별을 눌러 골라 주세요</span> : `${value.toFixed(1)} / 5.0`}
      </p>
    </div>
  );
}

/** 한 줄 메모로 끝낼 수도, 향·맛·여운을 펼쳐 자세히 적을 수도 있는 단일 폼. */
export function NoteForm({ uid, scope, initial, entryId, nameLocked = false, source, onSaved, onCancel, onPreview }: Props) {
  const key = draftKey(uid, scope);
  const [draft, setDraft] = useState(initial);
  useEffect(() => { onPreview?.(draft); }, [draft, onPreview]);
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
  // 마지막 글자를 지워도 입력 중에 접히지 않도록 열기만 자동으로 한다.
  const [partsOpen, setPartsOpen] = useState(partsUsed);
  useEffect(() => { if (partsUsed) setPartsOpen(true); }, [partsUsed]);

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
          <label htmlFor="note-name" id="note-name-label" className={label}>위스키 이름</label>
          {nameLocked ? (
            <p id="note-name" aria-labelledby="note-name-label" className="mt-2 break-words text-lg font-bold">{draft.whiskeyName || "추천받은 위스키"}</p>
          ) : (
            <input id="note-name" value={draft.whiskeyName} onChange={(event) => set("whiskeyName", event.target.value)} maxLength={LIMITS.whiskeyName}
              autoComplete="off" placeholder="예: 글렌피딕 12년" className={input} />
          )}
        </div>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" checked={wish} onChange={(event) => set("status", event.target.checked ? "WISH" : "TASTED")} className="h-5 w-5 rounded shrink-0 appearance-none border-2 border-[#3e2616] bg-white checked:bg-[#3e2616] checked:shadow-[inset_0_0_0_3px_#efe2c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e2616]" />
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
                      className={`min-h-11 rounded-full border px-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e2616] ${on ? "border-[#3e2616] bg-[#3e2616] font-bold text-[#fdfbf7]" : "border-[#3e2616]/60 bg-white/40"}`}>
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
            <details open={partsOpen} onToggle={(event) => setPartsOpen(event.currentTarget.open)} className="group rounded border border-[#3e2616]/60 bg-white/30 px-4">
              {/* 누르면 펼쳐지는 칸이라는 것이 보이도록 오른쪽에 펼치기/접기 글자와 화살표를 둔다. */}
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold [&::-webkit-details-marker]:hidden">
                <span>향·맛·여운 나눠 적기{optional}</span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-[#3e2616]/80">
                  {partsOpen ? "접기" : "펼치기"}
                  <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
                </span>
              </summary>
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
              <p className="mt-1 text-xs leading-5 text-[#3e2616]/70">내 입맛에 얼마나 맞았는지예요. 위스키의 품질 평가가 아니에요. 별의 왼쪽을 누르면 반 칸, 오른쪽을 누르면 한 칸이 채워져요.</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <RatingPicker value={draft.rating} onChange={(value) => set("rating", value)} />
                {draft.rating !== null && (
                  <button type="button" onClick={() => set("rating", null)} className="min-h-11 text-sm underline underline-offset-4">점수 지우기</button>
                )}
              </div>
            </div>

            <div>
              <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
                <input type="checkbox" checked={draft.visibility === "PUBLIC"} onChange={(event) => set("visibility", event.target.checked ? "PUBLIC" : "PRIVATE")} aria-describedby="note-public-hint" className="h-5 w-5 rounded shrink-0 appearance-none border-2 border-[#3e2616] bg-white checked:bg-[#3e2616] checked:shadow-[inset_0_0_0_3px_#efe2c9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3e2616]" />
                시음 노트 라운지에 공개하기
              </label>
              <p id="note-public-hint" className="mt-1 text-xs leading-5 text-[#3e2616]/70">
                {draft.visibility === "PUBLIC"
                  ? "공개 전에 메모를 한 번 더 읽어 주세요. 함께 마신 사람, 가게 이름, 연락처처럼 나를 알아볼 수 있는 내용은 지워 주세요. 언제든 수정에서 비공개로 바꿀 수 있고, 다시 공개하면 공개한 날짜가 새로 정해져요."
                  : "공개하면 위스키 이름, 마신 날, 마시는 방법, 메모, 향·맛·여운, 점수가 시음 노트 라운지에 보여요. 글쓴이 이름은 보이지 않아요. 체크하지 않으면 나만 볼 수 있어요."}
              </p>
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
          <button type="button" disabled={busy} onClick={onCancel} className="min-h-12 flex-1 rounded-sm border border-[#3e2616] font-serif tracking-wider px-4 font-bold disabled:opacity-50">취소</button>
        )}
        <button type="submit" disabled={busy} className="min-h-12 flex-[2] rounded-sm bg-[#3e2616] font-serif tracking-wider px-4 font-bold text-[#fdfbf7] disabled:opacity-60">
          {busy ? "저장하는 중…" : wish ? "마실 목록에 담기" : "기록 저장"}
        </button>
      </div>
    </form>
  );
}
