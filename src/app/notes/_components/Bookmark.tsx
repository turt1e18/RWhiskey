"use client";

interface Props {
  label: string;
  onClick: () => void;
  active?: boolean;
}

/**
 * 다이어리 상단에 꽂혀 있는 물리적인 책갈피 느낌의 버튼
 */
export const Bookmark = ({ label, onClick, active }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`absolute right-8 md:right-12 z-20 px-6 py-2 rounded-t-lg font-serif text-sm tracking-wider transition-all duration-300 shadow-[0_-4px_12px_rgba(0,0,0,0.4)] ${
        active
          ? "bg-[#3e240c] text-[#c9a14a] h-14 -top-14 opacity-100 ring-1 ring-white/10"
          : "bg-[#3e240c]/85 text-[#fdfbf7]/70 h-10 -top-10 hover:h-12 hover:-top-12 hover:text-[#fdfbf7] opacity-90"
      }`}
      style={{
        borderBottom: "none",
      }}
    >
      <div className="flex flex-col items-center gap-1">
        {/* 책갈피 상단 금색 장식선 (active일 때만) */}
        {active && <div className="w-8 h-0.5 bg-[#c9a14a]/40 rounded-full mb-1" />}
        <span>{label}</span>
      </div>
      
      {/* 책갈피가 가죽 안으로 들어가는 부분의 그림자 효과 */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20" />
    </button>
  );
};
