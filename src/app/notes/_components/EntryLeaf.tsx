"use client";

import { Image as ImageIcon, Star } from "lucide-react";
import type { ReactNode } from "react";
import { SERVING_LABELS, dotDate, type EntryDraft, type TastingEntry } from "@/lib/notes/entryDraft";

type Leaf = Pick<EntryDraft, "whiskeyName" | "rating" | "tastedOn" | "serving" | "status">;

/** 0.5점 단위 별 표시. 채움 비율만큼 금색 별을 덮어 반쪽 별을 만든다. */
function GoldStars({ value, size, paper = false }: { value: number | null; size: number; paper?: boolean }) {
  // 종이 위에서는 빈 별을 갈색, 채운 별을 진한 금색으로 둔다(연한 금색은 크림색에 묻힌다).
  const empty = paper ? "text-[#3e2616]/35" : "text-[#fdfbf7]/40";
  const full = paper ? "fill-[#b07d1e] text-[#b07d1e]" : "fill-[#c9a14a] text-[#c9a14a]";
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = value === null ? 0 : Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star width={size} height={size} className={`absolute inset-0 ${empty}`} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star width={size} height={size} className={full} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * 시음 기록 화면의 왼쪽 수첩 면. 오른쪽 양식에 적는 값을 그대로 보여 준다(입력은 오른쪽에서만).
 * 사진 칸은 자리만 잡아 둔다. 사진 기능이 붙으면 이 틀 안을 채운다.
 */
export function EntryLeaf({ draft, paper = false, extra }: { draft: Leaf; paper?: boolean; extra?: ReactNode }) {
  const { whiskeyName, rating, tastedOn, serving, status } = draft;
  const meta = [tastedOn ? dotDate(tastedOn) : null, serving ? SERVING_LABELS[serving] : null].filter(Boolean).join(" · ");
  // paper: 오른쪽과 같은 종이 위에 놓일 때(상세 화면). 아니면 가죽 위.
  const tone = paper
    ? { text: "text-[#3e2616]", eyebrow: "text-[#3e2616]/70", dim: "text-[#3e2616]/65", sub: "text-[#3e2616]/75", frame: "border-[#3e2616]/40 bg-[#3e2616]/5", ph: "text-[#3e2616]/55" }
    : { text: "text-[#fdfbf7]/90", eyebrow: "text-[#fdfbf7]/70", dim: "text-[#fdfbf7]/50", sub: "text-[#fdfbf7]/75", frame: "border-[#c9a14a]/50 bg-black/10", ph: "text-[#c9a14a]/70" };
  return (
    <div className={`flex h-full flex-col ${tone.text}`}>
      <p className={`text-xs uppercase tracking-[0.4em] ${tone.eyebrow}`}>{status === "WISH" ? "To Taste" : "Tasting Note"}</p>
      {/* 사진 자리: 좁은 화면에서는 양식이 밀리지 않게 접어 둔다. */}
      <div aria-hidden className={`mt-4 hidden aspect-[4/3] w-full items-center justify-center rounded-sm border border-dashed md:flex ${tone.frame}`}>
        <div className={`flex flex-col items-center gap-2 ${tone.ph}`}>
          <ImageIcon className="h-8 w-8" strokeWidth={1.25} />
          <span className="font-serif text-xs uppercase tracking-[0.3em]">Photo</span>
        </div>
      </div>
      <div className="mt-4 md:mt-6">
        <p className={`break-keep [overflow-wrap:anywhere] font-serif text-xl leading-snug md:text-2xl ${whiskeyName.trim() ? "" : tone.dim}`}>
          {whiskeyName.trim() || "위스키 이름"}
        </p>
        {meta && <p className={`mt-1 text-xs ${tone.sub}`}>{meta}</p>}
        <div className="mt-3 flex items-center gap-3">
          <GoldStars value={rating} size={24} paper={paper} />
          <span className={`font-serif text-sm ${tone.sub}`}>{rating === null ? "별점 없음" : `${rating.toFixed(1)} / 5.0`}</span>
        </div>
        <span className="sr-only">{rating === null ? "별점을 아직 고르지 않았어요" : `별점 ${rating.toFixed(1)}점`}</span>
      </div>
      {/* 추천 내용처럼 긴 덧붙임은 넓은 화면에서 이 칸 안에서만 스크롤한다. */}
      {extra && <div className="scrollbar-soft min-h-0 md:flex-1 md:overflow-y-auto md:pr-2">{extra}</div>}
    </div>
  );
}

/**
 * 시음 기록 목록의 왼쪽 수첩 면: 지금 보는 목록의 요약.
 * 목록은 20건씩 불러오므로 더 있으면 "+"를 붙이고, 평균은 불러온 기록 기준이라고 밝힌다.
 */
export function EntriesLeaf({ items, hasMore, ready }: { items: TastingEntry[]; hasMore: boolean; ready: boolean }) {
  const rated = items.filter((entry) => entry.rating !== null);
  const average = rated.length ? rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / rated.length : null;
  const latest = items[0];
  return (
    <div className="flex h-full flex-col text-[#fdfbf7]/90">
      <p className="text-xs uppercase tracking-[0.4em] text-[#fdfbf7]/70">My Tasting Diary</p>
      <div className="mt-4 md:mt-8">
        <p className="font-serif text-sm text-[#fdfbf7]/75">{ready ? "남긴 기록" : "기록을 세는 중"}</p>
        <p className="font-serif text-5xl leading-none md:text-6xl">{ready ? <>{items.length}{hasMore && "+"}<span className="ml-1 text-xl">건</span></> : "—"}</p>
      </div>
      <div className="mt-5 md:mt-8">
        <p className="font-serif text-sm text-[#fdfbf7]/75">평균 별점</p>
        <div className="mt-2 flex items-center gap-3">
          <GoldStars value={average} size={22} />
          <span className="font-serif text-sm text-[#fdfbf7]/80">{average === null ? "아직 없어요" : `${average.toFixed(1)} / 5.0`}</span>
        </div>
        {hasMore && average !== null && <p className="mt-1 text-xs text-[#fdfbf7]/65">불러온 기록 기준</p>}
      </div>
      {latest && (
        <div className="mt-5 border-t border-[#c9a14a]/30 pt-4 md:mt-8">
          <p className="font-serif text-sm text-[#fdfbf7]/75">가장 최근 한 잔</p>
          <p className="mt-1 break-keep [overflow-wrap:anywhere] font-serif text-lg leading-snug md:text-xl">{latest.whiskeyName}</p>
          <p className="mt-1 text-xs text-[#fdfbf7]/75">{dotDate(latest.tastedOn ?? latest.createdAt)}</p>
        </div>
      )}
    </div>
  );
}
