"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeEntryError } from "@/api/tastingEntryApi";
import type { SaveFailure } from "@/lib/notes/entryDraft";

/** 커서로 이어 받는 목록. key가 바뀌면 처음부터 다시 불러온다. 늦게 도착한 이전 응답은 버린다. */
export function usePagedList<T>(enabled: boolean, key: string, fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>) {
  const [items, setItems] = useState<T[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(enabled);
  const [problem, setProblem] = useState<SaveFailure | null>(null);
  // 첫 응답을 받기 전에는 "비어 있어요"를 보여 주지 않도록 마지막으로 끝난 key를 기억한다.
  const [doneKey, setDoneKey] = useState<string | null>(null);
  const version = useRef(0);
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
    setItems([]); setNext(null); void load(null, key);
  }, [enabled, key, load]);

  return { items, setItems, next, busy, settled: doneKey === key, problem, loadMore: () => load(next, key), retry: () => load(items.length ? next : null, key) };
}
