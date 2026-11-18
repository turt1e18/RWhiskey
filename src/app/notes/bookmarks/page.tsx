"use client";

import { useEffect, useRef, useState } from "react";
import { Wine } from "lucide-react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { SERVING_LABELS, dotDate, type SaveFailure, type TastingBookmarkItem } from "@/lib/notes/entryDraft";
import { EntryProblem, ReportControl, ReportPanel, useEntryActions } from "../_components/entryActions";
import { GlencairnButton } from "../_components/GlencairnButton";
import { BackPill, FOCUS, LoginNeeded, NoteNav, useNoteUser } from "../_components/NoteShell";
import { ReadOnlyStars } from "../_components/ScrapbookView";
import { usePagedList } from "../_components/usePagedList";

const frameShadow = "0 30px 80px rgba(0,0,0,0.6), 0 0 0 8px #2a1810, 0 0 0 10px #1A110D";
const nameOf = (item: TastingBookmarkItem) => item.entry?.whiskeyName ?? "볼 수 없는 글";

function Field({ label, text }: { label: string; text: string | null }) {
  return text ? (
    <div>
      <p className="mb-1 font-serif text-xs uppercase tracking-[0.25em] text-[#3e2616]/75">{label}</p>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed">{text}</p>
    </div>
  ) : null;
}

/** 오른쪽 종이: 고른 저장 글의 상세. 글이 바뀌면 key로 상태를 새로 시작한다. */
function Detail({ item, onUnsaved }: { item: TastingBookmarkItem; onUnsaved: () => void }) {
  const entry = item.entry!;
  const actions = useEntryActions(entry, (saved) => { if (!saved) onUnsaved(); });
  return (
    <div className="flex h-full flex-col md:max-h-[calc(100dvh-8.5rem-5rem)] md:overflow-y-auto md:pr-2 scrollbar-soft">
      <header className="mb-5 border-b border-dotted border-[#3e2616]/40 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/75">Saved Note</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight md:text-4xl">{entry.whiskeyName}</h2>
        <p className="mt-2 font-serif text-sm italic text-[#3e2616]/80">
          {entry.publishedAt && `${dotDate(entry.publishedAt)} 공개`}{entry.tastedOn && ` · ${dotDate(entry.tastedOn)} 마심`}{entry.serving && ` · ${SERVING_LABELS[entry.serving]}`}
        </p>
      </header>
      <div className="flex-1 space-y-5">
        <Field label="향 (Nose)" text={entry.nose} />
        <Field label="맛 (Palate)" text={entry.palate} />
        <Field label="여운 (Finish)" text={entry.finish} />
        <Field label="시음 메모" text={entry.memo} />
        {!entry.nose && !entry.palate && !entry.finish && !entry.memo && <p className="font-serif italic text-[#3e2616]/75">적힌 내용이 없어요.</p>}
        {entry.rating !== null && (
          <div className="border-t border-dotted border-[#3e2616]/30 pt-3">
            <p className="mb-2 font-serif text-xs uppercase tracking-[0.25em] text-[#3e2616]/75">총점</p>
            <ReadOnlyStars value={entry.rating} size={18} />
          </div>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-dotted border-[#3e2616]/30 pt-3">
        <ReportControl id={entry.id} actions={actions} />
        <span className="flex items-center gap-1 font-serif text-sm text-[#3e2616]/85">
          저장함
          <GlencairnButton liked={actions.saved} count={0} hideCount label="저장 해제" disabled={actions.busy} onClick={() => void actions.toggleSave()} className="min-h-11 min-w-11 justify-center" />
        </span>
      </div>
      <ReportPanel id={entry.id} actions={actions} />
      {actions.failure && <EntryProblem failure={actions.failure} />}
    </div>
  );
}

export default function BookmarksPage() {
  const { uid, ready } = useNoteUser();
  const list = usePagedList(ready && uid !== null, "", (cursor) => tastingEntryApi.bookmarks(cursor));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const selected = list.items.find((item) => item.entryId === selectedId) ?? list.items[0] ?? null;
  const drop = (entryId: number) => list.setItems((items) => items.filter((item) => item.entryId !== entryId));

  // 좁은 화면에서는 상세가 목록 아래에 있으므로 글을 고르면 그쪽으로 옮겨 준다.
  useEffect(() => {
    if (selectedId !== null && window.matchMedia("(max-width: 767px)").matches) { const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches; detailRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" }); detailRef.current?.focus({ preventScroll: true }); }
  }, [selectedId]);

  async function removeUnavailable(entryId: number) {
    if (removing) return;
    setRemoving(true); setFailure(null);
    try { await tastingEntryApi.unbookmark(entryId); drop(entryId); }
    catch (error) { setFailure(describeEntryError(error, "bookmark")); }
    finally { setRemoving(false); }
  }

  return (
    <div className={`notes-font-all relative min-h-screen w-full overflow-x-hidden ${FOCUS}`}>
      <div className="bg-notes-desk flex min-h-screen w-full items-center justify-center px-3 pb-6 pt-24 md:px-0 md:pb-10">
        <div className="relative w-[min(1200px,95vw)]">
          <main className="relative mx-auto flex min-h-[85vh] w-full flex-col rounded-[14px] md:min-h-[calc(100dvh-8.5rem)] text-[#3e2616] md:flex-row" style={{ boxShadow: frameShadow }}>
            <section aria-label="라운지에서 건배한 글 목록" className="paper-block relative flex w-full flex-col overflow-hidden rounded-t-[14px] p-6 md:w-1/2 md:rounded-l-[14px] md:rounded-tr-none md:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10" style={{ background: "linear-gradient(to left, rgba(60,35,15,0.22) 0%, rgba(60,35,15,0.08) 40%, transparent 100%)" }} />
              <header className="mb-6 shrink-0 border-b-2 border-double border-[#3e2616]/40 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/75">My Scrapbook</p>
                <h1 className="mt-1 font-serif text-3xl">라운지에서 만난 한 잔</h1>
                <p className="mt-2 text-xs italic text-[#3e2616]/75">라운지에서 마음에 들어 저장한 기록들</p>
              </header>
              {!ready ? <p role="status" className="text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : (
                <>
                  {list.problem && (
                    <div className="mb-3 rounded-sm border border-[#a8201a]/50 bg-[#a8201a]/10 p-3">
                      <EntryProblem failure={list.problem} />
                      {!list.problem.needsLogin && <button type="button" onClick={() => void list.retry()} className="min-h-11 text-sm font-bold underline underline-offset-4">다시 불러오기</button>}
                    </div>
                  )}
                  {failure && <EntryProblem failure={failure} />}
                  <div className="scrollbar-soft fade-bottom-paper -mx-1 min-h-0 px-1 pb-6 md:max-h-[calc(100dvh-8.5rem-5rem-8rem)] md:overflow-y-auto md:pr-3">
                  <ul className="space-y-1">
                    {list.items.map((item) => {
                      const active = selected?.entryId === item.entryId;
                      return (
                        <li key={item.entryId}>
                          <button type="button" aria-current={active || undefined} onClick={() => setSelectedId(item.entryId)}
                            className={`relative flex min-h-14 w-full items-center gap-3 border-b border-dotted px-3 py-3 text-left transition-all ${active ? "border-[#c9a14a]/60 bg-[#c9a14a]/10" : "border-[#3e2616]/25 hover:bg-[#c9a14a]/10"}`}>
                            <Wine aria-hidden className={`h-4 w-4 shrink-0 ${active ? "text-[#c9a14a]" : "text-[#3e2616]/60"}`} />
                            <span className="min-w-0 flex-1">
                              <span className={`block truncate font-serif text-base ${active ? "font-bold" : ""} ${item.available ? "" : "italic text-[#3e2616]/75"}`}>{nameOf(item)}</span>
                              <span className="block text-xs text-[#3e2616]/75">
                                {item.available && item.entry?.publishedAt ? `${dotDate(item.entry.publishedAt)} 공개` : "글쓴이가 비공개로 바꾸거나 지웠어요"}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {list.busy && <p role="status" className="mt-4 text-sm">불러오는 중…</p>}
                  {list.settled && !list.busy && !list.problem && list.items.length === 0 && (
                    <p className="font-serif text-sm italic leading-6 text-[#3e2616]/80">아직 저장한 글이 없어요. 라운지에서 마음에 드는 쪽지의 잔을 눌러 보세요.</p>
                  )}
                  {list.next && !list.busy && <button type="button" onClick={() => void list.loadMore()} className="mt-4 min-h-12 w-full rounded-sm border border-[#3e2616] font-serif tracking-wider hover:bg-[#3e240c]/10">더 보기</button>}
                  </div>
                </>
              )}
            </section>

            {/* 책등: 기존 다이어리(DiaryFrame)와 같은 가운데 접힘 */}
            <div aria-hidden className="hidden w-2 bg-gradient-to-r from-black/60 via-black/30 to-black/60 md:block" style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)" }} />
            <div aria-hidden className="block h-2 bg-gradient-to-b from-black/60 via-black/30 to-black/60 md:hidden" style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)" }} />

            <div ref={detailRef} tabIndex={-1} aria-label="고른 글" className="paper-block relative w-full scroll-mt-20 rounded-b-[14px] p-6 md:w-1/2 md:rounded-b-none md:rounded-r-[14px] md:p-10">
              <div className="pointer-events-none absolute left-0 top-0 h-full w-10" style={{ background: "linear-gradient(to right, rgba(60,35,15,0.22) 0%, rgba(60,35,15,0.08) 40%, transparent 100%)" }} />
              {selected && selected.available && selected.entry ? (
                <Detail key={selected.entryId} item={selected} onUnsaved={() => { const at = list.items.findIndex((item) => item.entryId === selected.entryId); setSelectedId((list.items[at + 1] ?? list.items[at - 1])?.entryId ?? null); drop(selected.entryId); }} />
              ) : selected ? (
                <div className="flex h-full flex-col justify-center gap-4">
                  <p className="font-serif text-xl">볼 수 없는 글이에요</p>
                  <p className="text-sm leading-6 text-[#3e2616]/85">글쓴이가 비공개로 바꾸거나 지워서 더 이상 읽을 수 없어요. 저장 목록에서 빼도 됩니다.</p>
                  <button type="button" disabled={removing} onClick={() => void removeUnavailable(selected.entryId)}
                    className="min-h-11 self-start rounded-sm border border-[#3e2616] px-5 font-serif tracking-wider hover:bg-[#3e240c]/10 disabled:opacity-60">{removing ? "빼는 중…" : "저장 목록에서 빼기"}</button>
                </div>
              ) : (
                <div className="flex h-full min-h-[8rem] items-center justify-center font-serif italic text-[#3e2616]/75">{list.items.length > 0 ? "저장한 글을 고르면 이곳에 펼쳐져요." : ""}</div>
              )}
            </div>
          </main>
        </div>
      </div>
      <BackPill />
      <NoteNav active="notes" />
    </div>
  );
}
