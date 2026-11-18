"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiResponseError } from "@/api/apiClient";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { SERVING_LABELS, dotDate, draftFromEntry, entryFailure, type EntryDraft, type TastingEntry } from "@/lib/notes/entryDraft";
import { LoginNeeded, NoteShell, useNoteUser } from "../_components/NoteShell";
import { EntryLeaf } from "../_components/EntryLeaf";
import { Spinner } from "../_components/Spinner";
import { RecommendationNote } from "../_components/RecommendationNote";
import { NoteForm } from "../_components/NoteForm";

function Row({ name, value }: { name: string; value: string | null }) {
  return value ? <div className="mt-4"><dt className="text-xs font-bold tracking-widest text-[#3e2616]/70">{name}</dt><dd className="mt-1 whitespace-pre-wrap break-words leading-7">{value}</dd></div> : null;
}

export default function NoteDetailPage() {
  const router = useRouter();
  const { uid, ready } = useNoteUser();
  const raw = useParams<{ id: string }>().id;
  const id = /^[1-9][0-9]{0,15}$/.test(raw) ? Number(raw) : null;
  const [entry, setEntry] = useState<TastingEntry | null>(null);
  const [problem, setProblem] = useState<{ message: string; needsLogin: boolean } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [preview, setPreview] = useState<EntryDraft | null>(null);
  // 저장 안내는 잠깐 보였다가 사라진다.
  useEffect(() => { if (!justSaved) return; const timer = setTimeout(() => setJustSaved(false), 8000); return () => clearTimeout(timer); }, [justSaved]);

  const load = useCallback(async () => {
    if (id === null) { setBusy(false); setNotFound(true); setProblem(entryFailure(404, null, "load")); return; }
    setBusy(true); setProblem(null); setNotFound(false);
    try { setEntry(await tastingEntryApi.get(id)); }
    catch (error) { setNotFound(error instanceof ApiResponseError && error.status === 404); setProblem(describeEntryError(error, "load")); }
    finally { setBusy(false); }
  }, [id]);
  useEffect(() => { if (ready && uid !== null) void load(); else if (ready) setBusy(false); }, [ready, uid, load]);

  // 마실 것의 유일한 수정 버튼은 "마셨어요 · 기록하기"이므로 폼도 마신 기록 모드로 시작한다.
  const initial = useMemo(() => {
    if (!entry) return null;
    const draft = draftFromEntry(entry, entry.id.toString());
    return entry.status === "WISH" ? { ...draft, status: "TASTED" as const } : draft;
  }, [entry]);

  async function remove() {
    if (!entry || busy) return;
    setBusy(true); setProblem(null);
    try { await tastingEntryApi.remove(entry.id); router.replace("/notes/entries"); }
    catch (error) { setProblem(describeEntryError(error, "delete")); setBusy(false); setConfirming(false); }
  }

  return (
    <NoteShell title={entry?.whiskeyName ?? "시음 기록"} back={{ href: "/notes/entries", label: "← 시음 기록" }} leftPaper left={entry ? <EntryLeaf paper draft={editing && preview ? preview : draftFromEntry(entry, String(entry.id))} extra={entry.source?.kind === "AI_OPERATION" ? <RecommendationNote paper operationId={entry.source.ref} /> : undefined} /> : <div aria-hidden className="h-full" />}>
      {!ready ? <p role="status" className="mt-6 text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : (
        <>
          {busy && !entry && <Spinner label="기록을 불러오고 있어요" />}
          {problem && (
            <div role="alert" className="mt-6 rounded border border-[#a8201a]/50 bg-[#a8201a]/10 p-3 text-sm leading-6">
              {problem.message}
              {problem.needsLogin && <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>}
              {!entry && id !== null && !busy && !notFound && <button type="button" onClick={() => void load()} className="ml-2 min-h-11 font-bold underline underline-offset-4">다시 불러오기</button>}
            </div>
          )}
          {entry && initial && (editing ? (
            <NoteForm uid={uid} scope={String(entry.id)} initial={initial} entryId={entry.id} nameLocked={entry.source !== null} onPreview={setPreview}
              onSaved={(saved) => { setEntry(saved); setEditing(false); setJustSaved(true); }} onCancel={() => setEditing(false)} />
          ) : (
            <div className="mt-4">
              <p className="text-xs text-[#3e2616]/70">
                {entry.status === "WISH" ? "마실 목록" : "마신 기록"} · {entry.visibility === "PUBLIC" ? "라운지에 공개 중" : "나만 보기"} · 기록한 날 {dotDate(entry.createdAt)}
              </p>
              {justSaved && (
                <div role="status" className="mt-3 flex items-start gap-3 rounded-sm bg-[#3e2616]/10 p-3">
                  <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-[#3e2616]" />
                  <p className="text-sm leading-6">
                    <span className="block font-bold">기록을 저장했어요</span>
                    <span className="text-[#3e2616]/80">{entry.visibility === "PUBLIC" ? "라운지에도 공개돼 있어요. 언제든 수정할 수 있어요." : "나만 볼 수 있어요. 언제든 수정할 수 있어요."}</span>
                  </p>
                </div>
              )}
              {entry.hidden && <p role="status" className="mt-3 rounded border border-[#4a3728]/40 p-3 text-sm leading-6">운영 검토로 라운지에서 숨겨졌어요. 나에게만 보여요.</p>}
              <dl>
                <Row name="마신 날" value={entry.tastedOn ? dotDate(entry.tastedOn) : null} />
                <Row name="마신 방법" value={entry.serving ? SERVING_LABELS[entry.serving] : null} />
                <Row name="메모" value={entry.memo} />
                <Row name="향" value={entry.nose} />
                <Row name="맛" value={entry.palate} />
                <Row name="여운" value={entry.finish} />
                <Row name="내 취향 점수" value={entry.rating !== null ? `${entry.rating.toFixed(1)} / 5.0` : null} />
              </dl>
              {!entry.memo && !entry.nose && !entry.palate && !entry.finish && entry.rating === null && (
                <p className="mt-6 text-sm text-[#3e2616]/70">아직 적은 내용이 없어요. 수정에서 느낌을 남겨 보세요.</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={() => { setJustSaved(false); setEditing(true); }} className="min-h-12 flex-1 rounded-sm bg-[#3e2616] font-serif tracking-wider px-4 font-bold text-[#fdfbf7]">
                  {entry.status === "WISH" ? "마셨어요 · 기록하기" : "수정"}
                </button>
                {entry.source === null && (
                  <Link href={`/notes/new`} className="inline-flex min-h-12 items-center justify-center rounded-sm border border-[#3e2616] font-serif tracking-wider px-4 font-bold">새 기록</Link>
                )}
                <button type="button" onClick={() => setConfirming(true)} className="min-h-12 rounded-sm border border-[#a8201a] px-4 font-serif font-bold tracking-wider text-[#a8201a]">삭제</button>
              </div>
              {confirming && (
                <div role="alertdialog" aria-labelledby="del-title" aria-describedby="del-desc" className="mt-4 rounded border border-[#a8201a]/50 bg-white/60 p-4">
                  <p id="del-title" className="font-bold">이 기록을 지울까요?</p>
                  <p id="del-desc" className="mt-1 text-sm leading-6">지운 기록은 되돌릴 수 없어요.</p>
                  <div className="mt-3 flex gap-3">
                    <button type="button" autoFocus disabled={busy} onClick={() => setConfirming(false)} className="min-h-11 flex-1 rounded-sm border border-[#3e2616] font-serif tracking-wider font-bold">그대로 두기</button>
                    <button type="button" disabled={busy} onClick={() => void remove()} className="min-h-11 flex-1 rounded-sm bg-[#a8201a] font-serif font-bold tracking-wider text-white disabled:opacity-60">{busy ? "지우는 중…" : "지우기"}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </NoteShell>
  );
}
