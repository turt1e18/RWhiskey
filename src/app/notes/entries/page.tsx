"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { dotDate, type EntryStatus, type TastingEntry } from "@/lib/notes/entryDraft";
import { LoginNeeded, NoteShell, useNoteUser } from "../_components/NoteShell";

const TABS: { key: EntryStatus | null; label: string }[] = [{ key: null, label: "전체" }, { key: "TASTED", label: "마신 기록" }, { key: "WISH", label: "마실 것" }];

export default function EntriesPage() {
  const { uid, ready } = useNoteUser();
  const [tab, setTab] = useState<EntryStatus | null>(null);
  const [items, setItems] = useState<TastingEntry[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [problem, setProblem] = useState<{ message: string; needsLogin: boolean } | null>(null);
  const version = useRef(0);

  const load = useCallback(async (status: EntryStatus | null, cursor: string | null) => {
    const mine = ++version.current;
    setBusy(true); setProblem(null);
    try {
      const page = await tastingEntryApi.mine(status, cursor);
      if (mine !== version.current) return;
      setItems((current) => (cursor ? [...current, ...page.items] : page.items)); setNext(page.nextCursor);
    } catch (error) { if (mine === version.current) setProblem(describeEntryError(error, "load")); }
    finally { if (mine === version.current) setBusy(false); }
  }, []);
  useEffect(() => { if (ready && uid !== null) { setItems([]); setNext(null); void load(tab, null); } else if (ready) setBusy(false); }, [ready, uid, tab, load]);

  return (
    <NoteShell title="내 시음 기록">
      {!ready ? <p role="status" className="mt-6 text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : (
        <>
          <Link href="/notes/new" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded bg-[#3e2616] font-bold text-[#fdfbf7]">+ 새 기록 남기기</Link>
          <div role="group" aria-label="기록 종류" className="mt-5 flex gap-2">
            {TABS.map(({ key, label }) => (
              <button key={label} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}
                className={`min-h-11 rounded-full border px-4 text-sm ${tab === key ? "border-[#3e2616] bg-[#3e2616] font-bold text-[#fdfbf7]" : "border-[#4a3728]/50 bg-white/40"}`}>{label}</button>
            ))}
          </div>
          {problem && (
            <div role="alert" className="mt-4 rounded border border-[#a8201a]/50 bg-[#a8201a]/10 p-3 text-sm leading-6">
              {problem.message}
              {problem.needsLogin
                ? <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>
                : <button type="button" onClick={() => void load(tab, next && items.length ? next : null)} className="ml-2 min-h-11 font-bold underline underline-offset-4">다시 불러오기</button>}
            </div>
          )}
          <ul className="mt-4 divide-y divide-[#3e2616]/20">
            {items.map((entry) => (
              <li key={entry.id}>
                <Link href={`/notes/${entry.id}`} className="flex min-h-14 items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-lg font-bold">{entry.whiskeyName}</span>
                    <span className="block text-xs text-[#3e2616]/70">
                      {entry.status === "WISH" ? "마실 것" : `${dotDate(entry.tastedOn ?? entry.createdAt)} 마심`}
                      {entry.rating !== null && ` · ${entry.rating.toFixed(1)}점`}{entry.visibility === "PUBLIC" && " · 공개"}
                    </span>
                  </span>
                  <span aria-hidden className="text-[#3e2616]/50">›</span>
                </Link>
              </li>
            ))}
          </ul>
          {busy && <p role="status" className="mt-4 text-sm">불러오는 중…</p>}
          {!busy && !problem && items.length === 0 && (
            <p className="mt-6 text-sm leading-6">{tab === "WISH" ? "마실 목록이 비어 있어요." : "아직 남긴 기록이 없어요. 오늘 마신 한 잔부터 적어 보세요."}</p>
          )}
          {next && !busy && <button type="button" onClick={() => void load(tab, next)} className="mt-4 min-h-12 w-full rounded border border-[#3e2616] font-bold">더 보기</button>}
        </>
      )}
    </NoteShell>
  );
}
