"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { tastingEntryApi } from "@/api/tastingEntryApi";
import { EntryProblem } from "../_components/entryActions";
import { LoungeEntryCard } from "../_components/LoungeEntryCard";
import { BackPill, FOCUS, LoginNeeded, NoteNav, useNoteUser } from "../_components/NoteShell";
import { usePagedList } from "../_components/usePagedList";

const shout = { textShadow: "0 2px 8px rgba(0,0,0,0.7)" };
/** 코르크 위에 직접 얹는 안내 글상자: 기존 제목 상자와 같은 반투명 검정. */
const note = "mx-auto mb-6 max-w-xl rounded-xl bg-black/50 px-6 py-4 text-center text-[#fdfbf7] shadow-lg backdrop-blur-sm";

export default function LoungePage() {
  const { uid, ready } = useNoteUser();
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const list = usePagedList(ready && uid !== null, q, (cursor) => tastingEntryApi.lounge(q, cursor));

  function search(event: FormEvent) { event.preventDefault(); setQ(input.trim()); }

  return (
    <div className={`notes-font-all relative min-h-screen w-full overflow-x-hidden ${FOCUS}`}>
      <div className="bg-cork relative min-h-screen w-full px-6 pb-6 pt-24">
        <main className="mx-auto flex max-w-6xl flex-col md:h-[calc(100vh-7.5rem)]">
          <header className="mb-4 text-center">
            <div className="inline-block rounded-xl bg-black/35 px-8 py-2 md:py-3 shadow-lg backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.4em] text-[#fdfbf7]/80" style={shout}>The Lounge</p>
              <h1 className="mt-2 font-serif text-3xl text-[#fdfbf7] md:text-4xl" style={shout}>오늘의 추천 게시판</h1>
            </div>
          </header>

          {!ready ? <p role="status" className={note}>불러오는 중…</p> : uid === null ? <div className={note}><LoginNeeded /></div> : (
            <>
              <form onSubmit={search} role="search" className="mx-auto mb-2 flex w-full max-w-xl gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">위스키 이름으로 찾기</span>
                  <input type="search" value={input} maxLength={100} onChange={(event) => setInput(event.target.value)} placeholder="위스키 이름으로 찾기"
                    className="min-h-11 w-full rounded-sm border border-[#3e2616]/70 bg-[#fdfbf7] px-3 text-[#3e2616] placeholder:text-[#3e2616]/70" />
                </label>
                <button type="submit" className="min-h-11 rounded-sm bg-[#3e240c] px-5 font-serif tracking-wider text-[#fdfbf7] shadow-md hover:bg-[#3e240c]/90">찾기</button>
              </form>
              <p className="mx-auto mb-3 w-fit max-w-full rounded-xl bg-black/50 px-6 py-2 text-center text-sm text-[#fdfbf7] backdrop-blur-sm">
                글쓴이 이름은 보이지 않아요.{" "}
                <Link href="/notes/bookmarks" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">라운지에서 만난 한 잔</Link>
                {" · "}
                <Link href="/notes/entries" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">내 시음 기록</Link>
              </p>
              {q && (
                <p className={note}>‘{q}’ 검색 결과{" "}
                  <button type="button" onClick={() => { setInput(""); setQ(""); }} className="min-h-11 font-bold underline underline-offset-4">검색 지우기</button>
                </p>
              )}

              <div className="scrollbar-hidden fade-bottom-cork min-h-0 px-2 pb-8 pt-3 md:flex-1 md:overflow-y-auto">
              {list.problem && (
                <div className={note}>
                  <EntryProblem failure={list.problem} />
                  {!list.problem.needsLogin && <button type="button" onClick={() => void list.retry()} className="min-h-11 font-bold underline underline-offset-4">다시 불러오기</button>}
                </div>
              )}
              <div className="columns-1 gap-6 [column-fill:_balance] sm:columns-2 lg:columns-3">
                {list.items.map((entry, index) => <LoungeEntryCard key={entry.id} entry={entry} index={index} />)}
              </div>
              {list.busy && <p role="status" className={note}>불러오는 중…</p>}
              {list.settled && !list.busy && !list.problem && list.items.length === 0 && (
                <p className={`${note} font-serif leading-7`}>{q ? "찾는 글이 없어요. 다른 이름으로 찾아보세요." : "아직 공개된 글이 없어요. 시음 기록을 쓸 때 ‘라운지에 공개하기’를 고르면 이곳에 핀으로 꽂혀요."}</p>
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
