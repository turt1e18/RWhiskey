/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { use, useState, useMemo } from "react";
import Image from "next/image";
import { MoodWhiskyDataInterface } from "@/type/MoodDataInterface";

interface AfterScreenProps {
  setSwitchState: (state: number) => void;
  resultData: Promise<MoodWhiskyDataInterface> | null;
  setResultData: (data: any) => void;
  setUserInput: (input: string) => void;
}

export default function AfterScreen({
  setSwitchState,
  resultData: resultDataPromise
}: AfterScreenProps) {
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

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#1a120d] selection:bg-amber-200/30 overflow-y-auto py-6">
      {/* 3. Top ActionBar (sample2.html 스타일) */}
      <nav className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto shrink-0">
        <button
          onClick={() => setSwitchState(0)}
          className="flex items-center space-x-2 text-stone-500 hover:text-white transition-colors"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            ></path>
          </svg>
          <span className="text-sm font-light">뒤로가기</span>
        </button>
        <div className="flex items-center space-x-6 text-stone-500">
          <button
            onClick={() => setSwitchState(0)}
            className="hover:text-white transition-colors flex items-center space-x-1"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 4v5h.582m15.356 20a8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
            </svg>
            <span className="text-xs uppercase tracking-widest">Retry</span>
          </button>
          <button className="hover:text-white transition-colors">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
            </svg>
          </button>
          <button className="hover:text-white transition-colors">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
            </svg>
          </button>
        </div>
      </nav>

      {/* 4. Recommendation Card (Paper style) */}
      <main className="flex flex-col items-center justify-center px-6 py-8 w-full max-w-2xl">
        <article className="relative bg-[#e5d5b7] w-full max-w-md p-8 md:p-10 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#4a3728] rounded-sm flex flex-col items-center">
          {/* Top Details */}
          <div className="w-full flex justify-between absolute top-4 px-8 md:px-10 left-0 right-0">
            <span className="text-[9px] font-bold tracking-widest text-stone-700 italic">
              No. 002
            </span>
            <span className="text-[9px] font-bold tracking-widest text-stone-700 italic">
              {todayStr}
            </span>
          </div>

          {/* Title Label */}
          <div className="border border-[#4a3728] px-3 py-0.5 text-[10px] font-bold tracking-[0.2em] text-[#4a3728] uppercase mb-4 mt-2">
            오늘의 추천
          </div>

          {/* Classification */}
          <div className="text-[10px] text-stone-700 tracking-wider font-medium mb-6">
            {resultData?.classification}
          </div>

          {/* Image Wrapper */}
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

          {/* Whiskey Title */}
          <div className="flex flex-col items-center mb-4 leading-tight">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-center text-black">
              {resultData?.whiskyName}
            </h1>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mt-1">
              {resultData?.whiskyNameEn}
            </span>
          </div>

          {/* Feature Tags (Oval Pills) */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {resultData?.featureTags.map((tag, idx) => (
              <span
                key={idx}
                className="border border-[#4a3728]/30 rounded-full px-3 py-0.5 text-[11px] text-[#4a3728]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Section 1: Food Pairing */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">
              어울리는 안주
            </h2>
            <p className="text-sm leading-relaxed text-black font-medium">
              {resultData?.foodName}
            </p>
          </div>

          {/* Section 2: Recommendation Reason */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">
              추천 이유
            </h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">
              {resultData?.pairingNote}
            </p>
          </div>

          {/* Section 3: Bartender's Word */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-8 text-left">
            <h2 className="text-[11px] font-bold text-stone-800 uppercase tracking-widest mb-2">
              바텐더의 한마디
            </h2>
            <p className="text-[13px] leading-relaxed italic text-stone-800 font-medium">
              "{resultData?.bartenderWord}"
            </p>
          </div>

          {/* Bottom Label */}
          <div className="w-full text-center pt-4 border-t border-[#4a3728]/25 mt-4">
            <span className="text-[9px] tracking-widest font-bold text-stone-600 uppercase italic">
              R-Whiskey Selection
            </span>
          </div>
        </article>
      </main>
    </div>
  );
}
