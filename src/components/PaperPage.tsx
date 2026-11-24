import Link from "next/link";
import type { ReactNode } from "react";

const DASH = { background: "repeating-linear-gradient(to right, #3E2A1E 0px, #3E2A1E 12px, transparent 12px, transparent 16px)" };

/** 로그인 화면과 같은 '주문서 종이' 틀. 약관·탈퇴처럼 글이 중심인 화면에 쓴다. */
export function PaperPage({ title, back = { href: "/main", label: "Home" }, wide, children }: {
  title: string; back?: { href: string; label: string }; wide?: boolean; children: ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-start justify-center px-4 pb-12 pt-28 sm:pt-24 wood-table-spotlight relative">
      <Link href={back.href} className="absolute top-4 left-4 sm:top-8 sm:left-8 flex min-h-11 items-center gap-2 text-white/70 hover:text-white transition-colors">
        <span className="text-2xl" aria-hidden="true">←</span>
        <span className="font-serif text-sm tracking-widest uppercase">{back.label}</span>
      </Link>
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} bg-white shadow-2xl`}>
        <div className="w-full h-1" style={DASH} aria-hidden="true" />
        <div className="px-6 py-8 sm:px-8 sm:py-10 paper-texture" style={{ color: "#3E2A1E" }}>
          <h1 className="font-serif text-2xl font-bold mb-6">{title}</h1>
          {children}
        </div>
        <div className="w-full h-1" style={DASH} aria-hidden="true" />
      </div>
    </main>
  );
}
