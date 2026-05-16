"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useId, useMemo, useState } from "react";
import { LoungeNote } from "../_data/mockData";
import { Wine } from "lucide-react";

interface Props {
  notes: LoungeNote[];
}

/* 정확하게 절반만 채워지는 별 (clip-path 사용, 원형 깨짐 버그 수정) */
const StarIcon = ({ size = 18, fillRatio = 1 }: { size?: number; fillRatio?: number }) => {
  const uid = useId().replace(/:/g, "");
  const clipId = `star-clip-${uid}`;
  const ratio = Math.max(0, Math.min(1, fillRatio));
  // lucide의 별 path 좌표계 (24x24)
  const starPath =
    "M12 17.27 L18.18 21 L16.54 13.97 L22 9.24 L14.81 8.62 L12 2 L9.19 8.62 L2 9.24 L7.46 13.97 L5.82 21 Z";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * ratio} height="24" />
        </clipPath>
      </defs>
      {/* 빈 별 외곽선 */}
      <path
        d={starPath}
        fill="none"
        stroke="#c9a14a"
        strokeWidth="1.4"
        strokeLinejoin="round"
        opacity="0.45"
      />
      {/* 채워지는 별 */}
      {ratio > 0 && (
        <path
          d={starPath}
          fill="#d4af37"
          stroke="#c9a14a"
          strokeWidth="1.4"
          strokeLinejoin="round"
          clipPath={`url(#${clipId})`}
        />
      )}
    </svg>
  );
};

const ReadOnlyStars = ({ value, size = 18 }: { value?: number; size?: number }) => {
  if (value == null) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const remain = value - i;
        const ratio = remain >= 1 ? 1 : remain >= 0.5 ? 0.5 : 0;
        return <StarIcon key={i} size={size} fillRatio={ratio} />;
      })}
      <span className="ml-2 text-[11px] text-[#3e2616]/60 font-serif">{value.toFixed(1)}</span>
    </span>
  );
};

/* 언더락(Rocks) 잔 - 묵직하고 넓은 형태. 위스키 30~40%, 둥근 얼음 1개 */
const RocksGlass = () => {
  const uid = useId().replace(/:/g, "");
  const clipId = `rocks-clip-${uid}`;
  // viewBox 0 0 56 56, 잔: 살짝 사다리꼴
  // 액체 윗면 y ≈ 36 (잔 내부의 약 35% 채움)
  const liquidTop = 36;
  return (
    <svg width="44" height="44" viewBox="0 0 56 56" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          {/* 잔 내부 영역 */}
          <path d="M12 12 L44 12 L42 48 Q28 50 14 48 Z" />
        </clipPath>
        <linearGradient id={`liq-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8a45a" />
          <stop offset="50%" stopColor="#c67b27" />
          <stop offset="100%" stopColor="#8a4d12" />
        </linearGradient>
      </defs>
      {/* 위스키 액체 */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y={liquidTop} width="56" height="56" fill={`url(#liq-${uid})`} />
        {/* 찰랑이는 표면 */}
        <ellipse cx="28" cy={liquidTop} rx="16" ry="1.6" fill="#f3c98a" opacity="0.85" />
        {/* 둥근 얼음 (액체에 살짝 잠긴) */}
        <circle cx="24" cy={liquidTop + 2} r="6" fill="#fdfbf7" opacity="0.55" />
        <circle cx="24" cy={liquidTop + 2} r="6" fill="none" stroke="#fdfbf7" strokeWidth="0.6" opacity="0.9" />
        <circle cx="22" cy={liquidTop + 0.5} r="1.2" fill="#fff" opacity="0.85" />
      </g>
      {/* 잔 본체 외곽선 (사다리꼴, 두꺼운 유리) */}
      <path
        d="M12 12 L44 12 L42 48 Q28 50 14 48 Z"
        fill="none"
        stroke="#3e2616"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* 잔 바닥 두께감 */}
      <path d="M16 47 Q28 49 40 47" fill="none" stroke="#3e2616" strokeWidth="1" opacity="0.6" />
      {/* 림 하이라이트 */}
      <path d="M14 13 L42 13" stroke="#fdfbf7" strokeWidth="0.9" opacity="0.55" />
    </svg>
  );
};

export const ScrapbookView = ({ notes }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? notes[0] ?? null,
    [notes, selectedId]
  );

  return (
    <div className="relative mx-auto flex flex-col md:flex-row w-[min(1200px,95vw)] min-h-[85vh] rounded-[14px] overflow-hidden"
      style={{
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.6), 0 0 0 8px #2a1810, 0 0 0 10px #1A110D",
      }}
    >
      {/* 좌측 종이 - 스크랩 리스트 */}
      <div className="relative w-full md:w-1/2 paper-block p-6 md:p-10 overflow-hidden flex flex-col text-[#3e2616]">
        {/* 책 접힘 - 우측 가장자리에 부드러운 음영 */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-10"
          style={{
            background:
              "linear-gradient(to left, rgba(60,35,15,0.22) 0%, rgba(60,35,15,0.08) 40%, transparent 100%)",
          }}
        />
        <header className="mb-6 border-b-2 border-double border-[#3e2616]/40 pb-4 shrink-0">
          <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/50">My Scrapbook</p>
          <h1 className="font-serif text-3xl text-[#3e2616] mt-1">스크랩한 노트</h1>
          <p className="text-xs text-[#3e2616]/50 mt-2 italic">건배를 건넨 라운지의 기록들</p>
        </header>

        {notes.length === 0 ? (
          <p className="text-[#3e2616]/50 italic font-serif text-sm">아직 스크랩한 노트가 없습니다.</p>
        ) : (
          <ul className="flex-1 min-h-0 overflow-y-auto scrollbar-soft fade-bottom-paper space-y-2 pr-2 pb-8">
            {notes.map((n) => {
              const active = selected?.id === n.id;
              return (
                <li
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={`group relative flex cursor-pointer items-center gap-3 border-b border-dotted px-3 py-3 transition-all ${
                    active
                      ? "border-[#c9a14a]/50"
                      : "border-[#3e2616]/25 hover:bg-[#c9a14a]/5"
                  }`}
                >
                  {/* 활성 인디케이터 (좌측 작은 점) */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-all ${
                      active ? "bg-[#c9a14a] scale-100" : "bg-transparent scale-0"
                    }`}
                  />
                  <Wine className={`h-4 w-4 ${active ? "text-[#c9a14a]" : "text-[#3e2616]/40"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-serif text-base text-[#3e2616] truncate ${active ? "font-bold" : ""}`}>
                      {n.whiskyName || (n as any).whiskeyName || (n as any).drinkName || (n as any).nameKo || n.cocktailName || "Unknown Item"}
                    </p>
                    <p className="text-[11px] text-[#3e2616]/50 mt-0.5">
                      {n.author} · {n.createdAt ?? "—"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 우측 종이 - 상세 */}
      <div className="relative w-full md:w-1/2 paper-block p-6 md:p-10 overflow-hidden text-[#3e2616]">
        {/* 책 접힘 - 좌측 가장자리에 부드러운 음영 */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-10"
          style={{
            background:
              "linear-gradient(to right, rgba(60,35,15,0.22) 0%, rgba(60,35,15,0.08) 40%, transparent 100%)",
          }}
        />
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="h-full flex flex-col"
            >
              <header className="mb-5 border-b border-dotted border-[#3e2616]/40 pb-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#3e2616]/50">
                  Scrapped Note · {selected.author}
                </p>
                <h2 className="font-serif text-4xl text-[#3e2616] mt-2 leading-tight">
                  {(selected as any).nameKo || selected.whiskyName || (selected as any).whiskeyName || selected.cocktailName || "Unknown Item"}
                </h2>
                {((selected as any).nameEn || selected.whiskyNameEn || (selected as any).whiskeyNameEn) && (
                  <p className="text-sm text-[#3e2616]/60 font-serif italic mb-2">
                    {(selected as any).nameEn || selected.whiskyNameEn || (selected as any).whiskeyNameEn}
                  </p>
                )}
                {selected.pairing && (
                  <p className="text-sm text-[#3e2616]/70 mt-2 italic font-serif">
                    페어링: <span className="text-[#c9a14a]">{selected.pairing}</span>
                  </p>
                )}
              </header>

              <div
                className="flex-1 space-y-5 text-[#3e2616]"
              >
                {selected.formType === "basic" ? (
                  <>
                    <DetailField label="향 (Nose)" text={selected.nose} />
                    <DetailField label="맛 (Palate)" text={selected.palate} />
                    <DetailField label="여운 (Finish)" text={selected.finish} />
                  </>
                ) : (
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#3e2616]/50 mb-3 font-serif">
                      시음 메모
                    </p>
                    <p className="text-base leading-relaxed whitespace-pre-line">{selected.memo}</p>
                  </div>
                )}

                {selected.rating != null && (
                  <div className="pt-3 border-t border-dotted border-[#3e2616]/30">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-[#3e2616]/50 mb-2 font-serif">
                      총점
                    </p>
                    <ReadOnlyStars value={selected.rating} size={18} />
                  </div>
                )}
              </div>

              {/* 하단 메타 */}
              <div className="relative mt-6 pt-5 border-t border-dotted border-[#3e2616]/30 flex items-end justify-between min-h-[80px]">
                <div className="flex items-center gap-3">
                  <RocksGlass />
                  <p className="font-serif text-[#3e2616]/80 leading-none text-base">
                    받은 건배 수{" "}
                    <span className="text-[#c9a14a] font-bold text-xl align-baseline">
                      {selected.likes}
                    </span>
                  </p>
                </div>
                <div
                  className="font-serif text-[#a8201a] border-2 border-[#a8201a]/80 rounded-sm px-3 py-1 text-sm tracking-[0.18em] opacity-85"
                  style={{
                    transform: "rotate(-8deg)",
                    background: "rgba(168,32,26,0.05)",
                    boxShadow: "0 0 0 1px rgba(168,32,26,0.2)",
                  }}
                >
                  REC · {selected.createdAt ?? "—"}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center text-[#3e2616]/50 italic font-serif">
              좌측의 노트를 선택해 주세요.
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DetailField = ({
  label,
  text,
}: {
  label: string;
  text?: string;
}) => (
  <div>
    <p className="text-[11px] uppercase tracking-[0.25em] text-[#3e2616]/50 font-serif mb-2">{label}</p>
    <p className="text-base leading-relaxed text-[#3e2616]/90">
      {text || <span className="text-[#3e2616]/40 italic">기록 없음</span>}
    </p>
  </div>
);
