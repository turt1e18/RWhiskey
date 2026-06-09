/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { use, useState, useMemo } from "react";
import Image from "next/image";
import { CocktailDataInterface } from "@/type/CocktailDataInterface";
import { ExperienceLevel } from "@/type/CocktailInterface";
import { notesApi } from "@/api/whiskeyApi";
import { toast } from "sonner";
import { Bookmark, CheckCircle2 } from "lucide-react";

interface AfterScreenProps {
  setSwitchState: (state: number) => void;
  dataPromise: Promise<CocktailDataInterface>;
  experienceLevel: ExperienceLevel;
}

export default function AfterScreen(props: AfterScreenProps) {
  const { setSwitchState, dataPromise, experienceLevel } = props;
  const resultData = use(dataPromise);

  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // 오늘 날짜 표시
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // 북마크 저장 (Keep)
  const handleKeep = async () => {
    if (!resultData?.oid) {
      toast.error("주문 정보를 찾을 수 없습니다.");
      return;
    }
    
    setIsBookmarking(true);
    try {
      await notesApi.createNote(resultData.oid);
      setIsBookmarked(true);
      toast.success("테이스팅 노트에 저장되었습니다!", {
        description: "나만의 오더 시트에서 확인하실 수 있습니다."
      });
    } catch (error) {
      console.error("Bookmark failed:", error);
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#1a120d] selection:bg-amber-200/30 overflow-y-auto py-6">
      {/* Top ActionBar */}
      <nav className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto shrink-0">
        <button
          onClick={() => setSwitchState(0)}
          className="flex items-center space-x-2 text-stone-500 hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
          <span className="text-sm font-light">뒤로가기</span>
        </button>

        {/* Keep Button - Top Right */}
        <button
          onClick={handleKeep}
          disabled={isBookmarked || isBookmarking}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-all ${
            isBookmarked 
              ? "bg-emerald-600/20 text-emerald-500 cursor-default" 
              : "bg-[#ffb247] hover:bg-[#f3a63a] text-[#1a140b] active:scale-[0.95]"
          } disabled:opacity-80 shadow-lg`}
        >
          {isBookmarking ? (
            <div className="w-4 h-4 border-2 border-[#1a140b]/20 border-t-[#1a140b] rounded-full animate-spin" />
          ) : isBookmarked ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">저장 완료</span>
            </>
          ) : (
            <>
              <Bookmark className="w-4 h-4" />
              <span className="text-xs">노트에 Keep 하기</span>
            </>
          )}
        </button>
      </nav>

      {/* Recommendation Card */}
      <main className="flex flex-col items-center justify-center px-6 py-8 w-full max-w-2xl">
        <article className="relative bg-[#e5d5b7] w-full max-w-md p-8 md:p-10 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#4a3728] rounded-sm flex flex-col items-center">
          {/* Top Details */}
          <div className="w-full flex justify-between absolute top-4 px-8 md:px-10 left-0 right-0">
            <span className="text-[9px] font-bold tracking-widest text-stone-700 italic">
              No. {resultData?.oid ? String(resultData.oid).padStart(3, "0") : "..."}
            </span>
            <span className="text-[9px] font-bold tracking-widest text-stone-700 italic">
              {todayStr}
            </span>
          </div>

          <div className="border border-[#4a3728] px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#4a3728] uppercase mb-10 mt-2">오늘의 추천</div>

          <div className="w-full h-64 flex items-center justify-center mb-6 relative overflow-hidden bg-white/10 rounded-sm">
            {!isImageLoad && (
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-10 h-10 border-2 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={resultData?.images?.[0] || "https://placehold.co/600x650"}
              alt={resultData?.cocktailName}
              fill={true}
              className={`object-contain transition-opacity duration-700 ${isImageLoad ? "opacity-100" : "opacity-0"}`}
              unoptimized
              onLoad={() => setIsImageLoad(true)}
            />
          </div>

          <div className="flex flex-col items-center mb-6 leading-tight">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-center text-black">🍸 {resultData?.cocktailName}</h1>
          </div>

          {/* 1. 사용된 기주 Section */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">🥃 사용된 기주</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.baseSpirit}</p>
          </div>

          {/* 2. 칵테일 도수 Section */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">📉 칵테일 도수</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.abv}</p>
          </div>

          {/* 3. 추천 안주 Section */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">🥨 추천 안주</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.foodName}</p>
          </div>

          {/* 4. 바텐더의 추천 Section */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">💡 바텐더의 추천</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.pairingNote}</p>
          </div>

          {/* 홈바 레벨인 경우에만 재료 및 조주 방법 표시 */}
          {experienceLevel === "home_bar" && (
            <>
              {/* 5. 필요한 재료 Section */}
              <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left animate-in fade-in slide-in-from-top-2 duration-500">
                <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">📝 필요한 재료</h2>
                <ul className="list-disc list-inside space-y-1">
                  {resultData?.checkList?.map((item, idx) => (
                    <li key={idx} className="text-[12px] text-black font-medium">{item}</li>
                  ))}
                </ul>
              </div>

              {/* 6. 조주 방법 Section */}
              <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-8 text-left animate-in fade-in slide-in-from-top-2 duration-700">
                <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">🪜 조주 방법</h2>
                <div className="space-y-2">
                  {resultData?.method?.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-[12px] text-black font-medium">
                      <span className="text-stone-500 font-bold shrink-0">{idx + 1}.</span>
                      <p className="leading-snug">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="w-full text-center pt-4 border-t border-[#4a3728]/25 mt-4">
            <span className="text-[9px] tracking-widest font-bold text-stone-600 uppercase italic">R-Whiskey Selection</span>
          </div>
        </article>
      </main>
    </div>
  );
}
