"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { SERVING_LABELS, dotDate, type TastingEntry } from "@/lib/notes/entryDraft";
import { EntryProblem, ReportControl, ReportPanel, useEntryActions } from "./entryActions";
import { GlencairnButton } from "./GlencairnButton";
import { ReadOnlyStars } from "./ScrapbookView";

const PIN_COLORS = ["#c0392b", "#27496d", "#7d3c98", "#1f618d", "#2e4053"];

const Pin = ({ color }: { color: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="drop-shadow-md">
    <circle cx="11" cy="11" r="8" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
    <circle cx="8.5" cy="8.5" r="2" fill="#fff" fillOpacity="0.6" />
  </svg>
);

/** 기존 라운지 쪽지와 같은 핀·종이 모양. 작성자는 보이지 않고, "추천" 자리에 저장(글렌캐런 잔)이 온다. */
export function LoungeEntryCard({ entry, index }: { entry: TastingEntry; index: number }) {
  const actions = useEntryActions(entry);
  const [long, setLong] = useState(false);
  const memo = entry.memo ?? "";
  const parts: [string, string | null][] = [["향", entry.nose], ["맛", entry.palate], ["여운", entry.finish]];

  return (
    <motion.article initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.06, type: "spring", stiffness: 120, damping: 14 }}
      className="relative mb-6 break-inside-avoid">
      <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2"><Pin color={PIN_COLORS[index % PIN_COLORS.length]} /></div>
      <div className="note-paper p-6 pt-8 text-[#1a1a1a]">
        <h2 className="font-kyobo mb-3 border-b border-[#1a1a1a]/10 pb-2 text-lg font-bold tracking-tight md:text-xl">{entry.whiskeyName}</h2>
        <div className="font-kyobo space-y-2 text-base leading-relaxed md:text-lg">
          {parts.map(([name, value]) => value && (
            <p key={name} className="whitespace-pre-wrap break-words"><span className="mr-1 font-bold text-[#8a6a1f]">[{name}]</span>{value}</p>
          ))}
          {memo && <p className={`whitespace-pre-wrap break-words ${memo.length > 120 && !long ? "line-clamp-4" : ""}`}>{memo}</p>}
        </div>
        {memo.length > 120 && (
          <button type="button" aria-expanded={long} onClick={() => setLong(!long)} className="min-h-11 font-serif text-sm font-bold underline underline-offset-4">{long ? "접기" : "더 읽기"}</button>
        )}
        {entry.rating !== null && <div className="mt-3"><ReadOnlyStars value={entry.rating} size={16} /></div>}
        <p className="mt-2 font-serif text-xs text-[#3e2616]/75">
          {entry.publishedAt && `${dotDate(entry.publishedAt)} 공개`}
          {entry.tastedOn && ` · ${dotDate(entry.tastedOn)} 마심`}{entry.serving && ` · ${SERVING_LABELS[entry.serving]}`}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-dotted border-[#3e2616]/30 pt-2">
          {entry.mine ? (
            <>
              <span className="font-serif text-xs text-[#3e2616]/75">내가 쓴 글</span>
              <Link href={`/notes/${entry.id}`} className="inline-flex min-h-11 items-center font-serif text-sm font-bold underline underline-offset-4">보기</Link>
            </>
          ) : (
            <>
              <ReportControl id={entry.id} actions={actions} />
              <span className="flex items-center gap-1 font-serif text-xs text-[#3e2616]/75">
                {actions.saved ? "저장함" : "저장"}
                <GlencairnButton liked={actions.saved} count={0} hideCount label={actions.saved ? "저장 해제" : "저장하기"} disabled={actions.busy}
                  onClick={() => void actions.toggleSave()} className="min-h-11 min-w-11 justify-center" />
              </span>
            </>
          )}
        </div>
        {!entry.mine && <ReportPanel id={entry.id} actions={actions} />}
        {actions.failure && <EntryProblem failure={actions.failure} />}
      </div>
    </motion.article>
  );
}
