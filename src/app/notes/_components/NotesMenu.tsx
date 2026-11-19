"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, PenLine, Sparkles, Wine } from "lucide-react";
import type { ComponentType } from "react";

export type NotesSection = "verified" | "ai" | "sheet" | "recommended";

interface Item { href: string; title: string; hint: string; Icon: ComponentType<{ className?: string }> }

/**
 * 테이스팅 노트를 펼쳤을 때 처음 보이는 목차.
 * 각 행은 별도 화면으로 이어지는 버튼이고, 오더 시트 행과 같은 점선·번호·쉐브론 모양을 쓴다.
 */
export function NotesMenu({ verified, entries }: { verified: boolean; entries: boolean }) {
  // 새 시음 노트(스위치 켬)는 세 갈래: 내 기록 / 추천 / 저장한 글. 구 오더 시트는 새 기능이 완성되면 기존 데이터와 함께 정리한다.
  const items: Item[] = entries
    ? [
        { href: "/notes/entries", title: "시음 기록", hint: "마신 기록과 마실 목록, 새 기록 쓰기", Icon: PenLine },
        { href: "/notes?section=recommended", title: "추천으로 만난 한 잔", hint: "추천받은 위스키와 취향 추천", Icon: Wine },
        { href: "/notes/bookmarks", title: "저장한 글", hint: "라운지에서 마음에 들어 저장한 다른 이의 기록", Icon: Sparkles },
      ]
    : [
        ...(verified ? [{ href: "/notes?section=verified", title: "추천으로 만난 한 잔", hint: "최근 추천과 저장한 시음 기록", Icon: Wine }] : []),
        { href: "/notes?section=ai", title: "취향에 맞춰 고른 추천", hint: "저장한 추천과 나의 시음 기록", Icon: Sparkles },
        { href: "/notes?section=sheet", title: "나만의 오더 시트", hint: "오늘의 한 잔을 기록하세요", Icon: BookOpen },
      ];
  return (
    <div className="flex h-full flex-col">
      <header className="mb-4 shrink-0 border-b-2 border-double border-[#3e2616]/40 pb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/70">My Tasting Diary</p>
        <h1 className="mt-1 font-serif text-3xl text-[#3e2616]">테이스팅 노트</h1>
        <p className="mt-2 text-xs italic text-[#3e2616]/75">펼쳐 볼 기록을 골라 주세요</p>
      </header>
      <ul>
        {items.map(({ href, title, hint, Icon }, index) => (
          <li key={href}>
            <Link href={href} className="group flex min-h-16 items-center gap-4 border-b border-dotted border-[#3e2616]/30 px-2 py-4 text-[#3e2616] transition-all hover:bg-[#3e240c]/10">
              <span className="w-6 shrink-0 font-serif text-xs text-[#3e2616]/70">{String(index + 1).padStart(2, "0")}</span>
              <Icon className="h-5 w-5 shrink-0 text-[#c9a14a]" />
              <span className="min-w-0 flex-1">
                <span className="block break-keep font-serif text-lg leading-tight">{title}</span>
                <span className="mt-0.5 block break-keep text-xs text-[#3e2616]/75">{hint}</span>
              </span>
              <ChevronRight aria-hidden className="h-4 w-4 shrink-0 text-[#3e2616]/60 transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
