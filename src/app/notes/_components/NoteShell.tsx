"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

/** 로그인 사용자 확인. ready가 false인 동안은 아직 모른다. */
export function useNoteUser() {
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const ready = useAuthStore((state) => state.isInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  useEffect(() => { if (!ready) void fetchUser(); }, [ready, fetchUser]);
  return { uid, ready };
}

/** 새 노트 화면들이 함께 쓰는 종이 한 장. 좁은 화면에서 한 열로 읽힌다. */
export function NoteShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#1a120d] px-4 py-6 text-[#3e2616] sm:py-10">
      <div className="mx-auto max-w-xl rounded border border-[#4a3728] bg-[#efe2c9] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-8">
        <Link href="/notes" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">← 내 시음 노트</Link>
        <h1 className="mt-2 border-b-2 border-double border-[#3e2616]/40 pb-3 font-serif text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function LoginNeeded() {
  return (
    <p role="status" className="mt-6 text-sm leading-6">
      로그인한 뒤 시음 노트를 볼 수 있어요.{" "}
      <Link href="/login" className="inline-flex min-h-11 items-center font-bold underline underline-offset-4">로그인하러 가기</Link>
    </p>
  );
}
