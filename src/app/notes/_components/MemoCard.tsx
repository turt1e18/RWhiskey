import { WhiskyEntry } from "../_data/mockData";
import {
  Cloud,
  Heart,
  Info,
  Thermometer,
  MessageSquare,
  Utensils,
  Quote
} from "lucide-react";

export const MemoCard = ({ whisky }: { whisky: WhiskyEntry }) => {
  return (
    <div className="relative h-full flex items-center justify-center p-4">
      {/* 종이 카드 */}
      <div
        className="relative w-full bg-[#fdfbf7] px-6 py-8 md:px-8 md:py-9 rotate-[-1deg] shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex flex-col gap-6 text-[#3e2616] overflow-y-auto scrollbar-soft max-h-[90%]"
        style={{ minHeight: "85%" }}
      >
        {/* 마스킹 테이프 효과 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-28 bg-[#d4af37]/40 border border-[#d4af37]/20 shadow-sm rotate-[-2deg]" />

        <header className="border-b-2 border-double border-[#3e2616]/40 pb-5">
          <p className="text-[11px] uppercase tracking-[0.4em] text-[#3e2616]/60 font-bold mb-1">
            Order Sheet Detail
          </p>
          <h2 className="font-serif text-2xl md:text-3xl text-[#3e2616] font-black leading-tight">
            {whisky.whiskyName ||
              (whisky as any).whiskeyName ||
              (whisky as any).drinkName ||
              (whisky as any).nameKo ||
              "Unknown Item"}
          </h2>
          <p className="text-sm md:text-base text-[#3e2616]/70 font-serif italic font-bold">
            {whisky.whiskyNameEn ||
              (whisky as any).whiskeyNameEn ||
              (whisky as any).drinkNameEn ||
              (whisky as any).nameEn ||
              ""}
          </p>
          <p className="text-xs text-[#3e2616]/50 mt-2 font-serif font-bold">
            Rec. Date: {whisky.date}
          </p>
        </header>

        <div className="space-y-4 flex-1">
          <Row
            icon={<Cloud className="h-4 w-4" />}
            label="날씨"
            value={whisky.weatherValue}
          />
          <Row
            icon={<Heart className="h-4 w-4" />}
            label="기분"
            value={whisky.moodValue}
          />
          <Row
            icon={<Thermometer className="h-4 w-4" />}
            label="선호 도수"
            value={whisky.abvValue}
          />
          <Row
            icon={<MessageSquare className="h-4 w-4" />}
            label="추가 요청"
            value={whisky.additionalValue}
          />
          <Row
            icon={<Utensils className="h-4 w-4" />}
            label="추천 간식"
            value={whisky.foodName}
            color="#a8201a"
          />

          <div className="mt-6 pt-5 border-t border-dotted border-[#3e2616]/40">
            <div className="flex gap-3">
              <span className="mt-1 text-[#c9a14a] shrink-0">
                <Quote className="h-5 w-5 fill-current opacity-30" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#3e2616]/60 font-black mb-1">
                  Bartender's Word
                </p>
                <p className="text-xs md:text-sm leading-relaxed italic font-serif font-medium text-[#3e2616]/80 whitespace-pre-line">
                  {whisky.bartenderWord}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-auto pt-4 text-[#3e2616]/40 text-[10px] uppercase tracking-[0.4em] text-center border-t border-dotted border-[#3e2616]/20">
          “Memory stays with the Scent”
        </p>
      </div>
    </div>
  );
};

const Row = ({
  icon,
  label,
  value,
  color = "#c9a14a"
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  color?: string;
}) => (
  <div className="flex items-start gap-4">
    <span className="mt-1 shrink-0" style={{ color }}>
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-widest text-[#3e2616]/60 font-black mb-0.5">
        {label}
      </p>
      <p className="text-sm md:text-base leading-snug font-normal text-[#3e2616] truncate md:whitespace-normal">
        {value || "—"}
      </p>
    </div>
  </div>
);
