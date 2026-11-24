"use client";

import Link from "next/link";
import type { LoungeSort } from "@/api/tastingEntryApi";
import { memo } from "react";
import { motion } from "framer-motion";
import { SERVING_LABELS, dotDate, type TastingEntry } from "@/lib/notes/entryDraft";
import { EntryProblem, LikeButton, useEntryLike } from "./entryActions";
import { ReadOnlyStars } from "./ScrapbookView";

const PIN_COLORS = ["#c0392b", "#27496d", "#7d3c98", "#1f618d", "#2e4053"];

const Pin = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="drop-shadow-md">
    <circle cx="11" cy="11" r="8" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
    <circle cx="8.5" cy="8.5" r="2" fill="#fff" fillOpacity="0.6" />
  </svg>
);

/** 기존 라운지 쪽지와 같은 핀·종이 모양. 작성자는 보이지 않는다. 저장·신고·전체 본문은 상세 화면에서 한다. */
// "더 보기"로 목록이 길어져도 이미 그려진 카드는 다시 그리지 않는다(entry·index가 그대로면 건너뜀).
export const LoungeEntryCard = memo(function LoungeEntryCard({ entry, index, onLiked, sort }: { entry: TastingEntry; index: number; onLiked?: (id: number, liked: boolean) => void; sort?: LoungeSort }) {
  const like = useEntryLike(entry, (liked) => onLiked?.(entry.id, liked));
  const parts: [string, string | null][] = [["향", entry.nose], ["맛", entry.palate], ["여운", entry.finish]];

  return (
    <motion.article initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.06, type: "spring", stiffness: 120, damping: 14 }}
      className="relative h-full">
      <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2"><Pin color={PIN_COLORS[index % PIN_COLORS.length]} /></div>
      <div className="note-paper font-kyobo flex h-full flex-col p-6 pt-8 text-[#1a1a1a]">
        <h2 className="font-kyobo mb-3 border-b border-[#1a1a1a]/10 pb-2 text-lg font-bold tracking-tight md:text-xl">{entry.whiskeyName}</h2>
        <div className={`font-kyobo space-y-2 text-base leading-relaxed md:text-lg ${entry.mine ? "" : "line-clamp-3"}`}>
          {parts.map(([name, value]) => value && (
            <p key={name} className="whitespace-pre-wrap break-words"><span className="mr-1 font-bold text-[#8a6a1f]">[{name}]</span>{value}</p>
          ))}
          {entry.memo && <p className="whitespace-pre-wrap break-words">{entry.memo}</p>}
        </div>
        {entry.rating !== null && <div className="mt-3"><span className="sr-only">5점 만점에 {entry.rating}점</span><span aria-hidden><ReadOnlyStars value={entry.rating} size={16} /></span></div>}
        <p className="font-pretendard-nums mt-2 text-xs text-[#3e2616]/75">
          {entry.publishedAt && `${dotDate(entry.publishedAt)} 공개`}
          {entry.tastedOn && ` · ${dotDate(entry.tastedOn)} 마심`}{entry.serving && ` · ${SERVING_LABELS[entry.serving]}`}
        </p>

        <div className="mt-auto flex items-center justify-between border-t border-dotted border-[#3e2616]/30 pt-2">
          <LikeButton like={like} name={entry.whiskeyName} />
          {entry.mine && <span className="font-serif text-xs text-[#3e2616]/75">내가 쓴 글</span>}
          <Link href={`/notes/lounge/${entry.id}${sort === "latest" ? "?sort=latest" : ""}`} aria-label={`${entry.whiskeyName} 자세히 보기`}
            className="inline-flex min-h-11 items-center font-serif text-sm font-bold underline underline-offset-4">자세히 보기</Link>
        </div>
        {like.failure && <EntryProblem failure={like.failure} />}
      </div>
    </motion.article>
  );
});
