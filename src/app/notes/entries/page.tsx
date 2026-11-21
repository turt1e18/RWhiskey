"use client";

import Link from "next/link";
import { ChevronRight, Lock, Share2 } from "lucide-react";
import { Suspense, useEffect, useRef, type MouseEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiResponseError } from "@/api/apiClient";
import { tastingEntryApi } from "@/api/tastingEntryApi";
import { dotDate, type EntryStatus } from "@/lib/notes/entryDraft";
import { markDeparture } from "@/lib/notes/listSnapshot";
import { EntryProblem } from "../_components/entryActions";
import { EntriesLeaf } from "../_components/EntryLeaf";
import { LoginNeeded, NoteShell, useNoteUser } from "../_components/NoteShell";
import { usePagedList } from "../_components/usePagedList";

const TABS: { key: EntryStatus | null; label: string }[] = [{ key: null, label: "전체" }, { key: "TASTED", label: "마신 기록" }, { key: "WISH", label: "마실 목록" }];

export default function EntriesPage() {
  return <Suspense fallback={null}><Entries /></Suspense>;
}

function Entries() {
  const { uid, ready } = useNoteUser();
  const router = useRouter();
  const pathname = usePathname();
  // 탭은 주소(?tab=)에 둔다. 상세에서 뒤로 돌아와도 같은 탭이 열린다.
  const param = useSearchParams().get("tab");
  const tab: EntryStatus | null = param === "TASTED" || param === "WISH" ? param : null;
  const setTab = (next: EntryStatus | null) => router.replace(next ? `${pathname}?tab=${next}` : pathname, { scroll: false });
  const snapshotKey = uid === null ? null : `entries:${uid}:${tab ?? "ALL"}`;
  const list = usePagedList(ready && uid !== null, tab ?? "ALL", (cursor) => tastingEntryApi.mine(tab, cursor), snapshotKey);
  const scroller = useRef<HTMLDivElement>(null);
  const { setItems, departure } = list;

  // 상세로 나갈 때 어느 글을 열었는지와 스크롤 위치를 남긴다.
  const rememberDeparture = (event: MouseEvent<HTMLElement>) => {
    const id = Number((event.target as HTMLElement).closest("a")?.getAttribute("href")?.match(/^\/notes\/(\d+)$/)?.[1]);
    if (snapshotKey && id) markDeparture(window.sessionStorage, `${snapshotKey}:out`, { id, panel: scroller.current?.scrollTop ?? 0, win: window.scrollY });
  };

  // 되살린 뒤: 스크롤을 돌려 놓고, 열었던 글만 다시 받는다(상세에서 고치거나 지웠을 수 있다). 사라졌거나 탭 조건에 안 맞으면 뺀다.
  useEffect(() => {
    if (!departure) return;
    const frame = requestAnimationFrame(() => { scroller.current?.scrollTo({ top: departure.panel }); window.scrollTo({ top: departure.win }); });
    let live = true;
    const drop = () => { if (live) setItems((current) => current.filter((item) => item.id !== departure.id)); };
    tastingEntryApi.get(departure.id).then((entry) => {
      if (!live) return;
      if (tab && entry.status !== tab) drop(); else setItems((current) => current.map((item) => item.id === departure.id ? entry : item));
    }).catch((error) => { if (error instanceof ApiResponseError && error.status === 404) drop(); });
    return () => { live = false; cancelAnimationFrame(frame); };
  }, [departure, setItems, tab]);

  return (
    <NoteShell title="내 시음 기록" scrollRef={scroller} left={<EntriesLeaf items={list.items} hasMore={Boolean(list.next)} ready={list.settled && !list.problem} />}>
      {!ready ? <p role="status" className="mt-6 text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : (
        <>
          <Link href="/notes/new" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-[#3e2616] font-serif tracking-wider text-[#fdfbf7] shadow-md hover:bg-[#3e2616]/90">+ 새 기록 남기기</Link>
          <div role="group" aria-label="기록 종류" className="mt-5 flex flex-wrap gap-2">
            {TABS.map(({ key, label }) => (
              <button key={label} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}
                className={`min-h-11 rounded-sm border px-4 font-serif text-sm tracking-wider ${tab === key ? "border-[#3e2616] bg-[#3e2616] text-[#fdfbf7]" : "border-[#3e2616]/40 bg-white/40 hover:bg-[#3e240c]/10"}`}>{label}</button>
            ))}
          </div>
          {list.problem && (
            <div className="mt-4 rounded-sm border border-[#a8201a]/50 bg-[#a8201a]/10 p-3">
              <EntryProblem failure={list.problem} />
              {!list.problem.needsLogin && <button type="button" onClick={() => void list.retry()} className="min-h-11 text-sm font-bold underline underline-offset-4">다시 불러오기</button>}
            </div>
          )}
          <ul onClickCapture={rememberDeparture} className="mt-3">
            {list.items.map((entry, index) => (
              <li key={entry.id} className="border-b border-dotted border-[#3e2616]/30">
                <Link href={`/notes/${entry.id}`} className="group flex min-h-14 items-center gap-3 px-1 py-3 transition-all hover:bg-[#3e240c]/10">
                  <span className="w-6 shrink-0 font-serif text-xs text-[#3e2616]/70">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`shrink-0 rounded-sm border px-2 py-0.5 font-serif text-xs tracking-wider ${entry.status === "TASTED" ? "border-[#a8201a]/60 text-[#a8201a]" : "border-[#3e2616]/50 text-[#3e2616]/80"}`}>
                    {entry.status === "TASTED" ? "마신 기록" : "마실 목록"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-lg leading-tight">{entry.whiskeyName}</span>
                    <span className="block text-xs text-[#3e2616]/70">
                      {entry.source && "추천에서 · "}{dotDate(entry.tastedOn ?? entry.createdAt)}{entry.rating !== null && ` · ${entry.rating.toFixed(1)}점`}
                    </span>
                  </span>
                  {entry.visibility === "PUBLIC"
                    ? <><Share2 aria-hidden className="h-4 w-4 shrink-0 text-[#3e240c]" /><span className="sr-only">라운지에 공개 중</span></>
                    : <><Lock aria-hidden className="h-4 w-4 shrink-0 text-[#3e2616]/60" /><span className="sr-only">나만 보기</span></>}
                  <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-[#3e2616]/60 transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
          {list.busy && <p role="status" className="mt-4 text-sm">불러오는 중…</p>}
          {list.settled && !list.busy && !list.problem && list.items.length === 0 && (
            <p className="mt-6 font-serif text-sm italic leading-6 text-[#3e2616]/80">{tab === "WISH" ? "마실 목록이 비어 있어요." : "아직 남긴 기록이 없어요. 오늘 마신 한 잔부터 적어 보세요."}</p>
          )}
          {list.next && !list.busy && <button type="button" onClick={() => void list.loadMore()} className="mt-4 min-h-12 w-full rounded-sm border border-[#3e2616] font-serif tracking-wider hover:bg-[#3e240c]/10">더 보기</button>}
        </>
      )}
    </NoteShell>
  );
}
