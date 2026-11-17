"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { emptyDraft, type EntrySource } from "@/lib/notes/entryDraft";
import { LoginNeeded, NoteShell, useNoteUser } from "../_components/NoteShell";
import { NoteForm } from "../_components/NoteForm";

const KINDS = ["LEGACY_ORDER", "VERIFIED_RECORD", "AI_OPERATION"] as const;

/** ?source=AI_OPERATION:<id> 형태. 알아볼 수 없으면 추천 없이 쓰는 새 글로 본다. */
function parseSource(value: string | null): EntrySource | undefined {
  const [kind, ...rest] = (value ?? "").split(":");
  const ref = rest.join(":");
  return (KINDS as readonly string[]).includes(kind) && ref && ref.length <= 40 ? { kind: kind as EntrySource["kind"], ref } : undefined;
}

function NewNote() {
  const router = useRouter();
  const { uid, ready } = useNoteUser();
  const params = useSearchParams();
  const source = useMemo(() => parseSource(params.get("source")), [params]);
  // 초안 키: 추천마다 따로 보관한다.
  const scope = source ? `new:${source.kind}:${source.ref}` : "new";
  const [clientKey] = useState(() => crypto.randomUUID());
  const initial = useMemo(() => emptyDraft(clientKey), [clientKey]);

  return (
    <NoteShell title={source ? "마신 뒤 남기는 기록" : "새 시음 기록"}>
      {!ready ? <p role="status" className="mt-6 text-sm">불러오는 중…</p> : uid === null ? <LoginNeeded /> : (
        <>
          {source && <p className="mt-3 text-sm leading-6 text-[#3e2616]/80">추천받은 위스키의 이름은 자동으로 채워져요.</p>}
          <NoteForm uid={uid} scope={scope} initial={initial} nameLocked={Boolean(source)} source={source}
            onSaved={(entry) => router.replace(`/notes/${entry.id}`)} onCancel={() => router.push("/notes/entries")} />
        </>
      )}
    </NoteShell>
  );
}

export default function NewNotePage() {
  return <Suspense fallback={null}><NewNote /></Suspense>;
}
