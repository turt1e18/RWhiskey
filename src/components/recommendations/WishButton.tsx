"use client";

import Link from "next/link";
import { useState } from "react";
import { describeEntryError, tastingEntryApi } from "@/api/tastingEntryApi";
import { emptyDraft, toRequest, type EntrySource } from "@/lib/notes/entryDraft";

type State = { kind: "idle" } | { kind: "busy" } | { kind: "done"; id: number } | { kind: "error"; message: string; needsLogin: boolean };

/** 아직 마시지 않은 추천을 "마실 목록"에 담는다. 같은 제출 키로 다시 눌러도 한 건만 생긴다. */
export default function WishButton({ source }: { source: EntrySource }) {
  const [key] = useState(() => crypto.randomUUID());
  const [state, setState] = useState<State>({ kind: "idle" });

  async function add() {
    if (state.kind === "busy" || state.kind === "done") return;
    setState({ kind: "busy" });
    try {
      // 이름은 서버가 추천 기록에서 채운다.
      const saved = await tastingEntryApi.create(toRequest({ ...emptyDraft(key), status: "WISH" }, { source }));
      setState({ kind: "done", id: saved.id });
    } catch (error) {
      const failure = describeEntryError(error, "add");
      setState({ kind: "error", message: failure.message, needsLogin: failure.needsLogin });
    }
  }

  if (state.kind === "done") {
    return (
      <p role="status" className="mt-3 text-sm leading-6">
        마실 목록에 담았어요.{" "}
        <Link href={`/notes/${state.id}`} className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">보기</Link>
      </p>
    );
  }
  return (
    <div className="mt-3">
      <button type="button" disabled={state.kind === "busy"} onClick={() => void add()}
        className="min-h-11 w-full border border-[#4a3728] px-3 text-sm font-semibold disabled:opacity-60">
        {state.kind === "busy" ? "담는 중…" : "마실 목록에 담기"}
      </button>
      {/* 카드의 "마셔보고 싶어요"(첫인상 반응)와 헷갈리지 않게 차이를 밝힌다. */}
      <p className="mt-2 text-xs leading-5 text-stone-600">내 시음 노트의 &lsquo;마실 것&rsquo;에 보관해요. &lsquo;마셔보고 싶어요&rsquo;는 첫인상만 남기고 목록에는 담기지 않아요.</p>
      {state.kind === "error" && (
        <p role="alert" className="mt-2 text-sm leading-6">
          {state.message}
          {state.needsLogin && <> <Link href="/login" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">새 탭에서 로그인</Link></>}
        </p>
      )}
    </div>
  );
}
