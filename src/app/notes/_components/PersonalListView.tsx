"use client";

import { WhiskyEntry } from "../_data/mockData";
import { Share2, Lock, ChevronRight } from "lucide-react";

interface Props {
  whiskies: WhiskyEntry[];
  onSelect: (w: WhiskyEntry) => void;
}

export const PersonalListView = ({ whiskies, onSelect }: Props) => {
  return (
    <div className="h-full flex flex-col">
      <header className="mb-6 border-b-2 border-double border-[#3e2616]/40 pb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/50">
          My Tasting Diary
        </p>
        <h1 className="font-serif text-3xl text-[#3e2616] mt-1">나만의 오더 시트</h1>
        <p className="text-xs text-[#3e2616]/50 mt-2 italic">
          오늘의 한 잔을 기록하세요
        </p>
      </header>

      <ul className="flex-1 min-h-0 overflow-y-auto scrollbar-soft fade-bottom-paper space-y-3 pr-2 pb-8">
        {whiskies.map((w, idx) => (
          <li
            key={w.id}
            onClick={() => onSelect(w)}
            className="group flex cursor-pointer items-center gap-4 rounded-sm border-b border-dotted border-[#3e2616]/30 px-2 py-3 transition-all hover:bg-[#3e240c]/10"
          >
            <span className="font-serif text-xs text-[#3e2616]/40 w-6">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="w-16 flex justify-center">
              <span
                className={`text-[10px] tracking-wider px-2 py-0.5 rounded-sm border ${
                  w.status === "평가완료"
                    ? "border-[#a8201a]/60 text-[#a8201a]"
                    : "border-[#3e2616]/40 text-[#3e2616]/60"
                }`}
              >
                {w.status === "평가완료" ? "평가완료" : "평가전"}
              </span>
            </span>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="font-serif text-lg text-[#3e2616] leading-tight truncate">
                {w.whiskyName || (w as any).whiskeyName || (w as any).drinkName || (w as any).nameKo || w.cocktailName || "Unknown Item"}
              </p>
              <p className="text-[11px] text-[#3e2616]/60 font-serif italic truncate">
                {w.whiskyNameEn || (w as any).whiskeyNameEn || (w as any).drinkNameEn || (w as any).nameEn || (w.category === "cocktail" ? "Cocktail Recipe" : "")}
              </p>
              <p className="text-[10px] text-[#3e2616]/40 mt-1">{w.date}</p>
            </div>
            <div className="flex items-center gap-2">
              {w.status === "평가완료" ? (
                w.shared ? (
                  <Share2 className="h-4 w-4 text-[#3e240c]" />
                ) : (
                  <Lock className="h-4 w-4 text-[#3e2616]/40" />
                )
              ) : (
                <Lock className="h-4 w-4 text-[#3e2616]/25" />
              )}
              <ChevronRight className="h-4 w-4 text-[#3e2616]/40 transition-transform group-hover:translate-x-1" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
