"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tastingEntryApi } from "@/api/tastingEntryApi";
import { emptyDraft, parseSource, type EntryDraft } from "@/lib/notes/entryDraft";
import { LoginNeeded, NoteShell, useNoteUser } from "../_components/NoteShell";
import { EntryLeaf } from "../_components/EntryLeaf";
import { RecommendationNote } from "../_components/RecommendationNote";
import { Spinner } from "../_components/Spinner";
import { NoteForm } from "../_components/NoteForm";

function NewNote() {
  const router = useRouter();
  const { uid, ready } = useNoteUser();
  const params = useSearchParams();
  const source = useMemo(() => parseSource(params.get("source")), [params]);
  // 초안 키: 추천마다 따로 보관한다.
  const scope = source ? `new:${source.kind}:${source.ref}` : "new";
  const [clientKey] = useState(() => crypto.randomUUID());
  const initial = useMemo(() => emptyDraft(clientKey), [clientKey]);
  const [preview, setPreview] = useState<EntryDraft>(initial);
  // 추천 하나에는 기록을 한 번만 쓴다. 이미 쓴 기록이 있으면 새 양식 대신 그 기록으로 간다.
  const [checking, setChecking] = useState(Boolean(source));
  useEffect(() => {
    if (!ready || uid === null) return;
    if (!source) { setChecking(false); return; }
    let active = true;
    setChecking(true);
    tastingEntryApi.bySource(source.kind, source.ref)
      .then((entry) => { if (active) router.replace(`/notes/${entry.id}`); })
      // 없으면(404) 새로 쓴다. 확인이 실패해도 양식은 열고, 저장할 때 서버가 같은 규칙으로 한 번 더 막는다.
      .catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [ready, uid, source, router]);

  return (
    <NoteShell title={source ? "마신 뒤 남기는 기록" : "새 시음 기록"} back={{ href: "/notes/entries", label: "← 시음 기록" }} left={<EntryLeaf draft={source && !preview.whiskeyName ? { ...preview, whiskeyName: "추천받은 위스키" } : preview} extra={source?.kind === "AI_OPERATION" ? <RecommendationNote operationId={source.ref} /> : undefined} />}>
      {!ready ? <p role="status" className="mt-6 text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : checking ? <Spinner label="이미 쓴 기록이 있는지 보고 있어요" /> : (
        <>
          {source && <p className="mt-3 text-sm leading-6 text-[#3e2616]/80">추천받은 위스키의 이름은 자동으로 채워져요.</p>}
          <NoteForm uid={uid} scope={scope} initial={initial} nameLocked={Boolean(source)} source={source} onPreview={setPreview}
            onSaved={(entry) => router.replace(`/notes/${entry.id}`)} onCancel={() => router.push("/notes/entries")} />
        </>
      )}
    </NoteShell>
  );
}

export default function NewNotePage() {
  return <Suspense fallback={null}><NewNote /></Suspense>;
}
