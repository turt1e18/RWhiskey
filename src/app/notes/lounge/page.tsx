"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiResponseError } from "@/api/apiClient";
import { tastingEntryApi, type LoungeSort } from "@/api/tastingEntryApi";
import { markDeparture, withLike } from "@/lib/notes/listSnapshot";
import { EntryProblem } from "../_components/entryActions";
import { LoungeEntryCard } from "../_components/LoungeEntryCard";
import { BackPill, FOCUS, LoginNeeded, NoteNav, useNoteUser } from "../_components/NoteShell";
import { usePagedList } from "../_components/usePagedList";

const TABS: { key: LoungeSort; label: string; hint: string }[] = [
  { key: "popular", label: "이번 주 인기", hint: "최근 7일 동안 좋아요를 많이 받은 글이에요(최대 15개). 순서는 이번 주에 받은 좋아요 수로 정해요." },
  { key: "latest", label: "최신", hint: "방금 공개된 글부터 보여 드려요." },
];
const shout = { textShadow: "0 2px 8px rgba(0,0,0,0.7)" };
/** 코르크 위에 직접 얹는 안내 글상자: 기존 제목 상자와 같은 반투명 검정. */
const note = "mx-auto mb-6 max-w-xl rounded-xl bg-black/50 px-6 py-4 text-center text-[#fdfbf7] shadow-lg backdrop-blur-sm";

export default function LoungePage() {
  return <Suspense fallback={null}><Lounge /></Suspense>;
}

function Lounge() {
  const { uid, ready } = useNoteUser();
  const router = useRouter();
  // 탭은 주소(?sort=)에 둔다. 상세에서 뒤로 돌아와도 같은 탭이 열린다.
  const sort: LoungeSort = useSearchParams().get("sort") === "latest" ? "latest" : "popular";
  const setSort = (next: LoungeSort) => router.replace(next === "latest" ? "/notes/lounge?sort=latest" : "/notes/lounge", { scroll: false });
  // 상세에서 돌아오면 보던 목록과 스크롤을 되살린다. 계정·탭마다 따로 보관한다.
  const snapshotKey = uid === null ? null : `lounge:${uid}:${sort}`;
  const list = usePagedList(ready && uid !== null, sort, (cursor) => tastingEntryApi.lounge(sort, cursor), snapshotKey);
  const panel = useRef<HTMLDivElement>(null);
  const [fresh, setFresh] = useState<{ id: number; tick: number } | null>(null);
  const { setItems, departure } = list;

  const onLiked = useCallback((id: number, liked: boolean) => setItems((current) => withLike(current, id, liked)), [setItems]);

  // 상세로 나갈 때 어느 글을 열었는지와 스크롤 위치를 남긴다.
  const rememberDeparture = (event: MouseEvent<HTMLElement>) => {
    const id = Number((event.target as HTMLElement).closest("a")?.getAttribute("href")?.match(/^\/notes\/lounge\/(\d+)$/)?.[1]);
    if (snapshotKey && id) markDeparture(window.sessionStorage, `${snapshotKey}:out`, { id, panel: panel.current?.scrollTop ?? 0, win: window.scrollY });
  };

  // 되살린 뒤: 스크롤 위치를 돌려 놓고, 열었던 글만 최신 값으로 다시 받는다(상세에서 좋아요를 눌렀을 수 있다). 사라진 글은 뺀다.
  useEffect(() => {
    if (!departure) return;
    const frame = requestAnimationFrame(() => { panel.current?.scrollTo({ top: departure.panel }); window.scrollTo({ top: departure.win }); });
    let live = true;
    tastingEntryApi.get(departure.id).then((entry) => {
      if (live) { setItems((current) => current.map((item) => item.id === departure.id ? entry : item)); setFresh({ id: departure.id, tick: Date.now() }); }
    }).catch((error) => { if (live && error instanceof ApiResponseError && error.status === 404) setItems((current) => current.filter((item) => item.id !== departure.id)); });
    return () => { live = false; cancelAnimationFrame(frame); };
  }, [departure, setItems]);

  return (
    <div className={`notes-font-all relative min-h-screen w-full overflow-x-hidden ${FOCUS}`}>
      <div className="bg-cork relative min-h-screen w-full px-6 pb-6 pt-24">
        <main className="mx-auto flex max-w-6xl flex-col md:h-[calc(100vh-7.5rem)]">
          <header className="mb-4 text-center">
            <div className="inline-block rounded-xl bg-black/35 px-8 py-2 md:py-3 shadow-lg backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-[#fdfbf7]/80" style={shout}>The Lounge</p>
              <h1 className="mt-2 font-serif text-3xl text-[#fdfbf7] md:text-4xl" style={shout}>시음 노트 라운지</h1>
            </div>
          </header>

          {!ready ? <p role="status" className={note}>불러오는 중…</p> : uid === null ? <div className={note}><LoginNeeded /></div> : (
            <>
              <div role="tablist" aria-label="정렬" className="mx-auto mb-2 flex w-full max-w-xl gap-2">
                {TABS.map(({ key, label }) => (
                  <button key={key} type="button" role="tab" id={`lounge-tab-${key}`} aria-selected={sort === key} aria-controls="lounge-panel" onClick={() => setSort(key)}
                    className={`min-h-11 flex-1 rounded-sm px-4 font-serif tracking-wider shadow-md ${sort === key ? "bg-[#3e240c] text-[#fdfbf7]" : "bg-[#fdfbf7] text-[#3e2616] hover:bg-white"}`}>{label}</button>
                ))}
              </div>
              <p id="lounge-hint" className="mx-auto mb-1 text-center text-sm text-[#fdfbf7]" style={shout}>{TABS.find((tab) => tab.key === sort)?.hint}</p>

              <div ref={panel} id="lounge-panel" role="tabpanel" aria-labelledby={`lounge-tab-${sort}`} aria-describedby="lounge-hint" className="scrollbar-hidden fade-bottom-cork min-h-0 px-2 pb-8 pt-3 md:flex-1 md:overflow-y-auto">
              {list.problem && (
                <div className={note}>
                  <EntryProblem failure={list.problem} />
                  <button type="button" onClick={() => void list.retry()} className="min-h-11 font-bold underline underline-offset-4">{list.problem.needsLogin ? "로그인했다면 다시 불러오기" : "다시 불러오기"}</button>
                </div>
              )}
              <div onClickCapture={rememberDeparture} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {list.items.map((entry, index) => <LoungeEntryCard key={`${sort}-${entry.id}${fresh?.id === entry.id ? `-${fresh.tick}` : ""}`} entry={entry} index={index} onLiked={onLiked} />)}
              </div>
              {list.busy && <p role="status" className={note}>불러오는 중…</p>}
              {list.settled && !list.busy && !list.problem && list.items.length === 0 && (
                <div className={`${note} font-serif leading-7`}>
                  {sort === "popular" ? "이번 주에 좋아요를 받은 글이 아직 없어요. 최신 글에서 마음에 드는 글에 좋아요를 눌러 보세요." : "아직 공개된 글이 없어요. 시음 기록을 쓸 때 ‘시음 노트 라운지에 공개하기’를 고르면 이곳에 핀으로 꽂혀요."}
                  <div>
                    {sort === "popular"
                      ? <button type="button" onClick={() => { setSort("latest"); document.getElementById("lounge-tab-latest")?.focus(); }} className="min-h-11 font-bold underline underline-offset-4">최신 글 보기</button>
                      : <Link href="/notes/new" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">시음 기록 쓰기</Link>}
                  </div>
                </div>
              )}
              {list.next && !list.busy && (
                <button type="button" onClick={() => void list.loadMore()} className="mx-auto mt-2 min-h-12 w-full max-w-xs rounded-sm bg-[#fdfbf7] font-serif tracking-wider text-[#3e2616] shadow-md hover:bg-white">더 보기</button>
              )}
              </div>
            </>
          )}
        </main>
      </div>
      <BackPill />
      <NoteNav active="lounge" />
    </div>
  );
}
