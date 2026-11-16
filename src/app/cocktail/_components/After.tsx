/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";
import { use, useMemo } from "react";
import RecommendationSearchImage from "@/components/recommendations/RecommendationSearchImage";
import CocktailFeedbackPanel from "./CocktailFeedbackPanel";
import { CocktailDataInterface } from "@/type/CocktailDataInterface";
import { ExperienceLevel } from "@/type/CocktailInterface";

interface AfterScreenProps {
  onEdit: () => void;
  onReset: () => void;
  dataPromise: Promise<CocktailDataInterface>;
  experienceLevel: ExperienceLevel;
  dislikes: string[];
}

export default function AfterScreen(props: AfterScreenProps) {
  const { onEdit, onReset, dataPromise, experienceLevel, dislikes } = props;
  const resultData = use(dataPromise);

  // 저장된 결과는 주문한 날짜(orderDate), 방금 받은 결과는 오늘 날짜를 찍는다.
  const dateStr = useMemo(() => {
    const saved = resultData?.orderDate?.slice(0, 10).replaceAll("-", "/");
    if (saved && /^\d{4}\/\d{2}\/\d{2}$/.test(saved)) return saved;
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, [resultData?.orderDate]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#1a120d] selection:bg-amber-200/30 overflow-y-auto py-6">
      {/* Top ActionBar */}
      <nav className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto shrink-0">
        <button
          onClick={onEdit}
          className="flex min-h-11 items-center space-x-2 text-stone-400 hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
          <span className="text-sm font-light">조건 바꾸기</span>
        </button>
        <button
          onClick={onReset}
          aria-label="입력을 모두 비우고 새로 시작"
          className="min-h-11 px-2 text-sm font-light text-stone-400 hover:text-white transition-colors"
        >
          새로 시작
        </button>
      </nav>

      {/* Recommendation Card */}
      <main className="flex flex-col items-center justify-center px-6 py-8 w-full max-w-2xl">
        <article className="relative bg-[#e5d5b7] w-full max-w-md p-8 md:p-10 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#4a3728] rounded-sm flex flex-col items-center">
          {/* Top Details */}
          <div className="w-full flex justify-between absolute top-4 px-8 md:px-10 left-0 right-0">
            <span className="text-xs font-bold tracking-widest text-stone-700 italic">
              No. {resultData?.oid ? String(resultData.oid).padStart(3, "0") : "..."}
            </span>
            <span className="text-xs font-bold tracking-widest text-stone-700 italic">
              {dateStr}
            </span>
          </div>

          <div className="-rotate-2 border-2 border-red-800/70 px-3 py-0.5 text-xs font-bold tracking-[0.2em] text-red-800 mb-10 mt-2">조주 완료</div>

          {/* 사진이 없으면 자리를 비우지 않는다. 사진이 있는데 불러오지 못한 경우만 컴포넌트가 안내한다. */}
          {resultData?.images?.[0] && (
            <RecommendationSearchImage key={resultData.images[0]} src={resultData.images[0]} name={resultData?.cocktailName || "칵테일"} />
          )}
          {resultData?.imageCredit && resultData.images?.[0] === resultData.imageCredit.url && (
            <p className="-mt-4 mb-6 w-full text-center text-[11px] leading-relaxed text-stone-600">
              사진: {resultData.imageCredit.author} · {resultData.imageCredit.license} ·{" "}
              <a href={resultData.imageCredit.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center underline">출처</a>
            </p>
          )}

          <div className="flex flex-col items-center mb-6 leading-tight">
            <h1 className="font-serif font-bold text-xl md:text-2xl text-center text-black">{resultData?.cocktailName}</h1>
          </div>

          {/* 이름 바로 아래에 고른 이유와 핵심 정보(기주·도수)를 둔다. */}
          {resultData?.bartenderWord && (
            <div className="w-full mb-6 text-left">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">이 칵테일을 고른 이유</h2>
              <p className="text-[13px] leading-relaxed text-black font-medium whitespace-pre-line">{resultData.bartenderWord}</p>
            </div>
          )}

          <dl className="w-full grid grid-cols-2 gap-4 border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <div>
              <dt className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-1">기주</dt>
              <dd className="text-[13px] leading-relaxed text-black font-medium">{resultData?.baseSpirit}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-1">도수</dt>
              <dd className="text-[13px] leading-relaxed text-black font-medium">{resultData?.abv}</dd>
            </div>
          </dl>

          {/* 확인할 점: AI 안내, 조건 완화, 확인하지 못한 기피 재료를 한 곳에 모은다. */}
          <div role="note" className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">확인할 점</h2>
            <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed text-stone-800">
              <li>{dislikes.length > 0
                ? `기피 재료(${dislikes.join("·")})는 빼고 추천했지만 AI 결과라 완벽하지 않을 수 있어요. 알레르기가 있다면 주문 전에 바텐더에게 꼭 확인해 주세요.`
                : "AI가 고른 추천이에요. 알레르기가 있다면 주문 전에 바텐더에게 꼭 확인해 주세요."}</li>
              {resultData?.relaxed && resultData.relaxed.length > 0 && (
                <li>딱 맞는 칵테일이 없어 {resultData.relaxed.map((k) => ({ TASTE: "맛", BASE_SPIRIT: "기주", CARBONATION: "탄산" } as Record<string, string>)[k] ?? k).join("·")} 조건을 조금 넓혀 골랐어요.</li>
              )}
              {resultData?.unverifiedDislikes && resultData.unverifiedDislikes.length > 0 && (
                <li>직접 적어 주신 기피 재료({resultData.unverifiedDislikes.join("·")})는 재료 목록으로 확인하지 못했어요. 주문하기 전에 꼭 직접 확인해 주세요.</li>
              )}
            </ul>
          </div>

          {/* 맛 노트 */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">맛 노트</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.pairingNote}</p>
          </div>

          {/* 재료는 모든 사용자에게 보인다(알레르기 확인 근거). 홈바는 펼쳐서, 나머지는 접어서 보여 준다. 조주 방법은 홈바만. */}
          {(resultData?.checkList?.length ?? 0) > 0 && (
            <details open={experienceLevel === "home_bar"} className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
              <summary className="min-h-11 cursor-pointer text-xs font-bold text-stone-800 uppercase tracking-widest">필요한 재료</summary>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {resultData?.checkList?.map((item, idx) => (
                  <li key={idx} className="text-[12px] text-black font-medium">{item}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">추천 안주</h2>
            <p className="text-[13px] leading-relaxed text-black font-medium">{resultData?.foodName}</p>
          </div>

          {experienceLevel === "home_bar" && (
            <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-8 text-left animate-in fade-in slide-in-from-top-2 duration-700">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">조주 방법</h2>
              <div className="space-y-2">
                {resultData?.method?.map((step, idx) => (
                  <div key={idx} className="flex gap-2 text-[12px] text-black font-medium">
                    <span className="text-stone-600 font-bold shrink-0">{idx + 1}.</span>
                    <p className="leading-snug">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="w-full text-center pt-4 border-t border-[#4a3728]/25 mt-4">
            <span className="text-xs tracking-widest font-bold text-stone-600 uppercase italic">R-Whiskey Selection</span>
          </div>
        </article>
        {resultData?.oid ? <CocktailFeedbackPanel oid={resultData.oid} /> : null}
      </main>
    </div>
  );
}
