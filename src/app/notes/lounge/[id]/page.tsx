"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiResponseError } from "@/api/apiClient";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { SERVING_LABELS, dotDate, entryFailure, type SaveFailure, type TastingEntry } from "@/lib/notes/entryDraft";
import { EntryProblem, LikeButton, ReportControl, ReportPanel, SaveButton, useEntryActions, useEntryLike } from "../../_components/entryActions";
import { BackPill, FOCUS, LoginNeeded, NoteNav, useNoteUser } from "../../_components/NoteShell";
import { ReadOnlyStars } from "../../_components/ScrapbookView";

const note = "mx-auto mb-6 max-w-xl rounded-xl bg-black/50 px-6 py-4 text-center text-[#fdfbf7] shadow-lg backdrop-blur-sm";

function Field({ label, text }: { label: string; text: string | null }) {
  return text ? (
    <div>
      <p className="mb-1 text-sm font-bold text-[#3e2616]/80">{label}</p>
      <p className="font-kyobo whitespace-pre-wrap break-words text-lg leading-relaxed">{text}</p>
    </div>
  ) : null;
}

/** 글이 도착한 뒤에만 그린다. 좋아요·저장·신고 상태가 이 글 기준으로 시작한다. */
function Detail({ entry }: { entry: TastingEntry }) {
  const actions = useEntryActions(entry);
  const like = useEntryLike(entry);
  const empty = !entry.nose && !entry.palate && !entry.finish && !entry.memo;
  const failure = like.failure ?? actions.failure;
  return (
    <article className="note-paper font-kyobo mx-auto w-full max-w-2xl p-6 text-[#1a1a1a] md:p-10">
      <header className="mb-5 border-b border-dotted border-[#3e2616]/40 pb-4">
        <h1 className="font-kyobo text-2xl font-bold leading-tight md:text-3xl">{entry.whiskeyName}</h1>
        <p className="mt-2 font-serif text-sm italic text-[#3e2616]/80">
          {entry.publishedAt && `${dotDate(entry.publishedAt)} 공개`}{entry.tastedOn && ` · ${dotDate(entry.tastedOn)} 마심`}{entry.serving && ` · ${SERVING_LABELS[entry.serving]}`}
        </p>
      </header>
      <div className="space-y-5">
        <Field label="향 (Nose)" text={entry.nose} />
        <Field label="맛 (Palate)" text={entry.palate} />
        <Field label="여운 (Finish)" text={entry.finish} />
        <Field label="시음 메모" text={entry.memo} />
        {empty && <p className="font-serif italic text-[#3e2616]/75">적힌 내용이 없어요.</p>}
        {entry.rating !== null && (
          <div className="border-t border-dotted border-[#3e2616]/30 pt-3">
            <p className="mb-2 text-sm font-bold text-[#3e2616]/80">글쓴이 취향 점수</p>
            <span className="sr-only">5점 만점에 {entry.rating}점</span>
            <span aria-hidden><ReadOnlyStars value={entry.rating} size={18} /></span>
          </div>
        )}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-dotted border-[#3e2616]/30 pt-3">
        <LikeButton like={like} name={entry.whiskeyName} />
        <SaveButton actions={actions} />
        <ReportControl id={entry.id} actions={actions} />
      </div>
      <p className="mt-2 text-xs leading-5 text-[#3e2616]/75">좋아요 수는 모두에게 보이고 이번 주 인기에 반영돼요. 저장은 나만 보는 ‘저장한 글’에 담아요.</p>
      <ReportPanel id={entry.id} actions={actions} />
      {failure && <EntryProblem failure={failure} />}
    </article>
  );
}

export default function LoungeEntryPage() {
  const router = useRouter();
  const { uid, ready } = useNoteUser();
  const raw = useParams<{ id: string }>().id;
  const id = /^[1-9][0-9]{0,15}$/.test(raw) ? Number(raw) : null;
  const [entry, setEntry] = useState<TastingEntry | null>(null);
  const [problem, setProblem] = useState<SaveFailure | null>(null);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(true);

  const load = useCallback(async () => {
    if (id === null) { setBusy(false); setGone(true); setProblem(entryFailure(404, null, "bookmark")); return; }
    setBusy(true); setProblem(null); setGone(false);
    try {
      const found = await tastingEntryApi.get(id);
      if (found.mine) router.replace(`/notes/${id}`); else setEntry(found);
    } catch (error) {
      const missing = error instanceof ApiResponseError && error.status === 404;
      setGone(missing); setProblem(describeEntryError(error, missing ? "bookmark" : "load"));
    } finally { setBusy(false); }
  }, [id, router]);
  useEffect(() => { if (ready && uid !== null) void load(); else if (ready) setBusy(false); }, [ready, uid, load]);

  return (
    <div className={`notes-font-all relative min-h-screen w-full overflow-x-hidden ${FOCUS}`}>
      <div className="bg-cork relative min-h-screen w-full px-4 pb-10 pt-24 md:px-6">
        <main className="mx-auto max-w-6xl">
          {!ready || (uid !== null && busy) ? <p role="status" className={note}>불러오는 중…</p> : uid === null ? <div className={note}><LoginNeeded /></div> : (
            <>
              {problem && (
                <div className={note}>
                  <EntryProblem failure={problem} />
                  {!gone && <button type="button" onClick={() => void load()} className="min-h-11 font-bold underline underline-offset-4">{problem.needsLogin ? "로그인했다면 다시 불러오기" : "다시 불러오기"}</button>}
                  <Link href="/notes/lounge" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">라운지로 돌아가기</Link>
                </div>
              )}
              {entry && <Detail key={entry.id} entry={entry} />}
            </>
          )}
        </main>
      </div>
      <BackPill href="/notes/lounge" label="← 라운지" />
      <NoteNav active="lounge" />
    </div>
  );
}
