"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { DiaryFrame } from "./DiaryFrame";
import { TopNav } from "./TopNav";

/** 로그인 사용자 확인. ready가 false인 동안은 아직 모른다. */
export function useNoteUser() {
  const uid = useAuthStore((state) => state.user?.uid ?? null);
  const ready = useAuthStore((state) => state.isInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  useEffect(() => { if (!ready) void fetchUser(); }, [ready, fetchUser]);
  return { uid, ready };
}

/** 책상·코르크·종이 어디서나 보이도록 어두운 윤곽 안쪽에 밝은 틈을 둔 포커스 표시. 기본 표시는 종이색에 묻힌다. */
export const FOCUS = "[&_a:focus-visible]:outline [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[#3e2616] [&_a:focus-visible]:shadow-[0_0_0_2px_#fdfbf7] [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[#3e2616] [&_button:focus-visible]:shadow-[0_0_0_2px_#fdfbf7] [&_input:focus-visible]:outline [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-offset-2 [&_input:focus-visible]:outline-[#3e2616] [&_input:focus-visible]:shadow-[0_0_0_2px_#fdfbf7]";

/** 기존 /notes와 같은 상단 알약. 새 화면에서는 라우트를 옮긴다. */
export function NoteNav({ active }: { active: "notes" | "lounge" | "scrapbook" }) {
  const router = useRouter();
  return <TopNav view={active} onChange={(next) => router.push(next === "lounge" ? "/notes/lounge" : "/notes")} />;
}

/** 책상 위 화면 맨 위 왼쪽의 "돌아가기" 알약. 기존 "← 메인으로"와 같은 모양. */
export function BackPill({ href = "/notes", label = "← 테이스팅 노트" }: { href?: string; label?: string }) {
  return (
    <Link href={href} className="absolute left-6 top-6 z-50 inline-flex min-h-11 items-center rounded-full border border-white/10 bg-black/40 px-4 text-sm text-white/80 backdrop-blur-sm transition-all hover:bg-black/60">
      {label}
    </Link>
  );
}

const MENU = [
  { href: "/notes/entries", label: "시음 기록" },
  { href: "/notes?section=recommended", label: "추천으로 만난 한 잔" },
  { href: "/notes/bookmarks", label: "저장한 글" },
  { href: "/notes/lounge", label: "라운지 둘러보기" },
];

/** 기존 다이어리 왼쪽 가죽 면. 쪽 안내와 이동 메뉴. */
function Leather({ lead }: { lead: string }) {
  return (
    <div className="flex h-full flex-col text-[#fdfbf7]/90">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-[#fdfbf7]/70">The Whisky Bar</p>
        <p className="mt-2 hidden whitespace-pre-line font-serif text-2xl leading-snug md:block md:text-3xl">{lead}</p>
      </div>
      <nav aria-label="시음 노트 메뉴" className="mt-8 flex flex-wrap gap-x-5 border-t border-[#c9a14a]/30 pt-3 md:flex-col md:gap-x-0">
        {MENU.map((item) => (
          <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center font-serif text-sm tracking-wider text-[#c9a14a] underline-offset-4 hover:underline md:text-base">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/**
 * 새 시음 노트 화면들이 함께 쓰는 틀: 기존 노트와 같은 책상·가죽 표지·종이 장.
 * 좁은 화면에서는 표지가 위, 종이가 아래로 쌓인다.
 */
/** left를 주면 가죽 면에 이동 메뉴 대신 그 내용을 둔다(시음 기록 작성·상세 화면). */
export function NoteShell({ title, eyebrow = "My Tasting Diary", lead = "오늘의 한 잔을\n새겨 두세요", active = "notes", left, leftPaper = false, back, children }:
  { title: string; eyebrow?: string; lead?: string; active?: "notes" | "lounge" | "scrapbook"; left?: ReactNode; leftPaper?: boolean; back?: { href: string; label: string }; children: ReactNode }) {
  // 화면이 바뀌면 틀은 그대로 두고 안쪽만 서서히 바뀐다(모션 줄이기 설정이면 바로 그린다).
  const calm = useReducedMotion();
  const swapIn = (x: number) => ({ initial: calm ? false as const : { opacity: 0, x }, animate: { opacity: 1, x: 0 }, transition: { duration: 0.35, ease: "easeOut" as const } });
  return (
    <div className={`notes-font-all relative min-h-screen w-full overflow-x-hidden ${FOCUS}`}>
      <div className="bg-notes-desk flex min-h-screen w-full items-center justify-center px-3 pb-6 pt-20 md:px-0 md:pb-10 md:pt-24">
        <DiaryFrame leftPaper={leftPaper && Boolean(left)} left={<motion.div className="h-full" {...swapIn(-14)}>{left ?? <Leather lead={lead} />}</motion.div>}
          right={
            <motion.main {...swapIn(14)} className="flex flex-col text-[#3e2616] md:max-h-[calc(100dvh-8.5rem-6rem)]">
              <header className="shrink-0 border-b-2 border-double border-[#3e2616]/40 pb-4">
                <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/70">{eyebrow}</p>
                <h1 className="mt-1 font-serif text-2xl font-bold md:text-3xl">{title}</h1>
              </header>
              {/* 좁은 화면은 페이지가 스크롤된다(손가락 스크롤이 겹치지 않게). 넓은 화면은 목록만 스크롤한다. */}
              <div className="scrollbar-soft fade-bottom-paper -mx-1 min-h-0 px-1 pb-6 md:flex-1 md:overflow-y-auto md:pr-3">
                {children}
              </div>
            </motion.main>
          } />
      </div>
      <BackPill {...back} />
      <NoteNav active={active} />
    </div>
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
