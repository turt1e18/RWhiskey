"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeEntryError } from "@/api/tastingEntryApi";
import type { SaveFailure } from "@/lib/notes/entryDraft";
import { resolveRestore, saveSnapshot, type Departure } from "@/lib/notes/listSnapshot";

/**
 * 커서로 이어 받는 목록. key가 바뀌면 처음부터 다시 불러온다. 늦게 도착한 이전 응답은 버린다.
 * snapshotKey를 주면 목록을 탭 임시 보관에 남기고, 상세로 나가며 표시(`${snapshotKey}:out`)를 남긴 경우에만 돌아왔을 때 그 목록을 되살린다.
 */
export function usePagedList<T>(enabled: boolean, key: string, fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>, snapshotKey?: string | null) {
  const [items, setItems] = useState<T[]>([]);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(enabled);
  const [problem, setProblem] = useState<SaveFailure | null>(null);
  // 첫 응답을 받기 전에는 "비어 있어요"를 보여 주지 않도록 마지막으로 끝난 key를 기억한다.
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const version = useRef(0);
  const leaving = useRef<ReturnType<typeof resolveRestore<T>>>(null);
  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  const load = useCallback(async (cursor: string | null, forKey: string) => {
    const mine = ++version.current;
    setBusy(true); setProblem(null);
    try {
      const page = await fetchRef.current(cursor);
      if (mine !== version.current) return;
      setItems((current) => (cursor ? [...current, ...page.items] : page.items)); setNext(page.nextCursor);
    } catch (error) { if (mine === version.current) setProblem(describeEntryError(error, "load")); }
    finally { if (mine === version.current) { setBusy(false); setDoneKey(forKey); } }
  }, []);

  useEffect(() => {
    if (!enabled) { setBusy(false); return; }
    // 상세에서 돌아온 경우에만 보관한 목록을 되살린다. 그냥 들어오면 항상 새로 불러온다.
    // 개발 모드는 효과를 연달아 두 번 돌리므로, 한 번 읽은 표시를 잠깐 들고 있다가 둘째 실행에서도 쓴다.
    const restored = leaving.current ?? (snapshotKey ? resolveRestore<T>(window.sessionStorage, snapshotKey) : null);
    leaving.current = restored; setTimeout(() => { leaving.current = null; }, 0);
    if (restored) {
      version.current++; setItems(restored.snap.items); setNext(restored.snap.next); setProblem(null); setBusy(false); setDoneKey(key); setDeparture(restored.out);
      return;
    }
    setDeparture(null); setItems([]); setNext(null); void load(null, key);
  }, [enabled, key, load, snapshotKey]);

  // 다 불러온 목록만 보관한다(불러오는 중이거나 실패한 상태는 남기지 않는다).
  useEffect(() => {
    if (snapshotKey && doneKey === key && !busy && !problem && items.length > 0) saveSnapshot(window.sessionStorage, snapshotKey, { items, next });
  }, [snapshotKey, key, doneKey, busy, problem, items, next]);

  return { items, setItems, next, busy, settled: doneKey === key, problem, departure, loadMore: () => load(next, key), retry: () => load(items.length ? next : null, key) };
}
