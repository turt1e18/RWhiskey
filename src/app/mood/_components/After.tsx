/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { use, useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MoodWhiskyDataInterface } from "@/type/MoodDataInterface";
import { useRecommendationStore } from "@/store/recommendationStore";
import { notesApi } from "@/api/whiskeyApi";
import { toast } from "sonner";
import { Bookmark, CheckCircle2 } from "lucide-react";

interface AfterScreenProps {
  setSwitchState: (state: number) => void;
  resultData: Promise<MoodWhiskyDataInterface> | null;
  setResultData: (data: any) => void;
  setUserInput: (input: string) => void;
  // 재추천을 위한 원본 입력값들
  weather: string;
  mood: string;
  strength: string;
  imRich: boolean;
  userInput: string;
}

export default function AfterScreen({
  setSwitchState,
  resultData: resultDataPromise,
}: AfterScreenProps) {
  const { setSelectedMainTag } = useRecommendationStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTag, setPendingTag] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // 1. resultDataPromise가 null일 경우 예외 처리
  if (!resultDataPromise) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a120d]">
        <button
          onClick={() => setSwitchState(0)}
          className="text-stone-400 hover:text-white transition-colors"
        >
          데이터를 찾을 수 없습니다. 돌아가기
        </button>
      </div>
    );
  }

  // 2. use 훅을 사용하여 Promise를 해제
  const resultData = use(resultDataPromise);

  // 이미지가 로드되었는지 확인하는 상태
  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);

  // 오늘 날짜 표시
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // 바텐더의 고려 태그 목록
  const mainTasteTags = ["sweet", "spicy", "smoke"];

  // 태그 클릭 시 모달 띄우기
  const handleTasteTagClick = (tag: string) => {
    setPendingTag(tag);
    setIsModalOpen(true);
  };

  // 모달 확인 시: 태그 저장 후 주문 페이지(Before)로 이동
  const confirmReRecommendation = () => {
    if (pendingTag) {
      setSelectedMainTag(pendingTag);
      setSwitchState(0); // BeforeScreen으로 이동
    }
    setIsModalOpen(false);
  };

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

          <div className="border border-[#4a3728] px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#4a3728] uppercase mb-4 mt-2">오늘의 추천</div>
          <div className="text-[10px] text-stone-700 tracking-wider font-medium mb-6">{resultData?.classification}</div>

          <div className="w-full h-64 flex items-center justify-center mb-6 relative overflow-hidden bg-white/10 rounded-sm">
            {!isImageLoad && (
              <div className="absolute inset-0 flex justify-center items-center">
                <div className="w-10 h-10 border-2 border-[#4a3728]/20 border-t-[#4a3728] rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={resultData?.image || "https://placehold.co/600x650"}
              alt={resultData?.whiskyName}
              fill={true}
              className={`object-contain transition-opacity duration-700 ${isImageLoad ? "opacity-100" : "opacity-0"}`}
              unoptimized
              onLoad={() => setIsImageLoad(true)}
            />
          </div>

          <div className="flex flex-col items-center mb-4 leading-tight">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-center text-black">{resultData?.whiskyName}</h1>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mt-1">{resultData?.whiskyNameEn}</span>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {resultData?.featureTags.map((tag, idx) => (
              <span key={idx} className="border border-[#4a3728]/30 rounded-full px-3 py-0.5 text-[11px] text-[#4a3728]">{tag}</span>
            ))}
          </div>

          {/* Bartender's Consideration */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">바텐더의 고려 (풍미 선택 시 재추천)</h2>
            <div className="flex flex-wrap gap-2">
              {mainTasteTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTasteTagClick(tag)}
                  className="border border-[#4a3728]/30 rounded-full px-3 py-0.5 text-[11px] text-[#4a3728] hover:bg-[#4a3728]/10 transition-colors uppercase tracking-wider"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Other sections */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">어울리는 안주</h2>
            <p className="text-sm leading-relaxed text-black font-medium">{resultData?.foodName}</p>
          </div>
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">추천 이유</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.pairingNote}</p>
          </div>
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-8 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">바텐더의 한마디</h2>
            <p className="text-[13px] leading-relaxed italic text-stone-800 font-medium">"{resultData?.bartenderWord}"</p>
          </div>
          <div className="w-full text-center pt-4 border-t border-[#4a3728]/25 mt-4">
            <span className="text-[9px] tracking-widest font-bold text-stone-600 uppercase italic">R-Whiskey Selection</span>
          </div>
        </article>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#2d2417] border border-[#ffb247]/30 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8 text-center">
                <h3 className="text-lg md:text-xl font-bold text-[#ffb247] mb-3 uppercase tracking-wider">풍미 기반 재추천</h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed mb-8 break-keep">
                  선택하신 <span className="text-[#ffb247] font-bold">'{pendingTag}'</span> 풍미를 중심으로 다시 추천받으시겠습니까?<br />
                  <span className="text-white/60 text-xs md:text-sm">확인 시 주문서 작성 단계로 돌아갑니다.</span>
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-all"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmReRecommendation}
                    className="flex-1 py-3 bg-[#ffb247] hover:bg-[#d98b1e] text-[#1a140b] font-bold border border-[#ffb247] rounded-lg transition-all shadow-[0_4px_15px_rgba(255,178,71,0.2)]"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
