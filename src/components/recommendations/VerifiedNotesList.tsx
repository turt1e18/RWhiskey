"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError } from "@/api/apiClient";
import type { WhiskeySavedRecommendation, WhiskeyTastingNoteSummary } from "@/type/ApiInterface";
export default function VerifiedNotesList() {
  const [records, setRecords] = useState<WhiskeySavedRecommendation[]>([]);
  const [notes, setNotes] = useState<WhiskeyTastingNoteSummary[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setStatus(null); setAuthExpired(false);
    void Promise.all([recommendationApi.getVerifiedRecords(), recommendationApi.getVerifiedTastingNotes()]).then(([saved, tasted]) => {
      if (active) { setRecords(saved); setNotes(tasted); }
    }).catch((caught) => { if (active) { setStatus("추천 시음 기록을 불러오지 못했어요."); setAuthExpired(caught instanceof ApiResponseError && caught.status === 401); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  const byId = new Map(notes.map((note) => [note.recommendationId, note]));
  const older = notes.filter((note) => !records.some((record) => record.id === note.recommendationId));
  return <section className="my-5 rounded border border-[#4a3728]/30 bg-[#efe2c9] p-5 text-stone-900">
    <h2 className="font-serif text-lg font-bold">추천으로 만난 한 잔</h2>
    <p className="mt-2 text-xs leading-5 text-stone-600">최근 추천과 저장한 시음 기록을 여기에서 다시 찾을 수 있어요.<br />마신 뒤 기록을 남겨주세요.</p>
    {loading && <p role="status" className="mt-3 text-sm">불러오는 중…</p>}
    {status && <p role="status" className="mt-3 text-sm">{status} {authExpired ? <Link href="/login" className="underline">다시 로그인</Link> : <button className="underline" onClick={() => setReload(reload + 1)}>다시 불러오기</button>}</p>}
    {!loading && !status && records.length === 0 && older.length === 0 && <p className="mt-3 text-sm">아직 추천 기록이 없어요. <Link href="/mood/verified" className="underline">한 잔 추천받기</Link></p>}
    <ul className="mt-3 max-h-56 overflow-y-auto overscroll-contain divide-y divide-[#4a3728]/15 pr-2">
      {records.map((record) => <li key={record.id}><Link href={`/notes/verified/${record.id}`} className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-3 text-sm">
        <span className="min-w-0 break-words">{record.selected?.displayName ?? `이전 추천 #${record.id}`}<span className="ml-2 text-xs text-stone-600">{record.selected?.edition}</span></span>
        <span className="text-xs font-semibold">{byId.has(record.id) ? "시음 기록 보기" : "시음 기록 남기기"} →</span></Link></li>)}
      {older.map((note) => <li key={note.recommendationId}><Link href={`/notes/verified/${note.recommendationId}`} className="flex min-h-14 items-center justify-between gap-2 py-3 text-sm">
        <span>{note.displayName}</span><span className="text-xs">시음 기록 보기 →</span></Link></li>)}
    </ul>
  </section>;
}
