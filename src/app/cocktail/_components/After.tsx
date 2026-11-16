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
  dataPromise: Promise<CocktailDataInterface>;
  experienceLevel: ExperienceLevel;
  dislikes: string[];
  /** 주문서에서 막 받은 결과에서만 넘긴다(저장된 결과 다시 보기에서는 없다). */
  onAnother?: () => void;
  anotherError?: string | null;
}

export default function AfterScreen(props: AfterScreenProps) {
  const { onEdit, dataPromise, experienceLevel, dislikes, onAnother, anotherError } = props;
  const resultData = use(dataPromise);

  // 저장된 결과는 주문한 날짜(orderDate), 방금 받은 결과는 오늘 날짜를 찍는다.
  const dateStr = useMemo(() => {
    const saved = resultData?.orderDate?.slice(0, 10).replaceAll("-", "/");
    if (saved && /^\d{4}\/\d{2}\/\d{2}$/.test(saved)) return saved;
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, [resultData?.orderDate]);

  // 주문서에서 고른 기피 재료 중 재료 목록으로 걸러낸 것과 걸러내지 못한 것(직접 적은 재료)을 나눈다.
  const unchecked = resultData?.unverifiedDislikes ?? [];
  const checked = dislikes.filter((d) => !unchecked.includes(d));

  // "마이 타이 (Mai Tai)"처럼 한글과 영문이 한 줄에 섞이면 글꼴이 달라 보여 나눠 보여 준다.
  const nameMatch = resultData?.cocktailName?.match(/^(.*?)\s*\((.+)\)\s*$/);
  const nameKo = nameMatch ? nameMatch[1] : resultData?.cocktailName;
  const nameEn = nameMatch ? nameMatch[2] : null;

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#1a120d] selection:bg-amber-200/30 overflow-y-auto py-6">
      {/* Top ActionBar */}
      <nav className="flex items-center px-6 py-4 w-full max-w-2xl mx-auto shrink-0">
        <button
          onClick={onEdit}
          className="flex min-h-11 items-center space-x-2 text-stone-400 hover:text-white transition-colors"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
          <span className="text-sm font-light">조건 바꾸기</span>
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

          <div className="h-6" aria-hidden="true" />

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
            <h1 className="font-sans font-bold text-xl md:text-2xl text-center text-black">{nameKo}</h1>
            {nameEn && <p className="mt-1 font-sans text-sm italic text-center text-stone-700">{nameEn}</p>}
          </div>

          {/* 이름 바로 아래에 고른 이유와 핵심 정보(기주·도수)를 둔다. */}
          {resultData?.bartenderWord && (
            <div className="w-full mb-6 text-left">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">고른 이유</h2>
              <LineList text={resultData.bartenderWord} />
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

          {/* 알레르기: 정보(우리가 반영·확인한 것)와 경고(손님이 직접 해야 할 일)를 나눠 보여 준다. */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">알레르기</h2>
            <dl className="mb-3 space-y-2">
              <div className="flex items-baseline gap-3">
                <dt className="w-20 shrink-0 text-xs text-stone-700">뺀 재료</dt>
                <dd className="flex flex-wrap gap-1.5 text-[13px] font-medium text-black">
                  {checked.length > 0
                    ? checked.map((d) => <span key={d} className="rounded-full border border-[#4a3728]/40 px-2.5 py-0.5 text-xs">{d}</span>)
                    : "없음"}
                </dd>
              </div>
              {unchecked.length > 0 && (
                <div className="flex items-baseline gap-3">
                  <dt className="w-20 shrink-0 text-xs text-stone-700">확인 못 한 재료</dt>
                  <dd className="flex flex-wrap gap-1.5 text-[13px] font-medium text-black">
                    {unchecked.map((d) => <span key={d} className="rounded-full border border-red-800/60 px-2.5 py-0.5 text-xs text-red-900">{d}</span>)}
                  </dd>
                </div>
              )}
            </dl>
            <div role="note" className="border-l-4 border-red-800/70 bg-red-800/10 px-3 py-2 text-xs leading-relaxed text-stone-900">
              <p className="font-bold text-red-900">주문 전에 꼭 확인하세요</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                <li>아래 ‘필요한 재료’에서 알레르기 재료를 찾아보세요.</li>
                <li>계란 흰자·견과류·유제품은 이름만으로 알기 어려워요.</li>
                <li>바텐더에게 알레르기를 직접 알려 주세요.</li>
                {unchecked.length > 0 && <li>확인 못 한 재료는 재료 목록으로 걸러내지 못했어요.</li>}
                {resultData?.aiGenerated && <li>AI가 만든 추천이라 재료가 실제와 다를 수 있어요.</li>}
              </ul>
            </div>
          </div>

          {resultData?.relaxed && resultData.relaxed.length > 0 && (
            <p className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left text-xs leading-relaxed text-stone-800">
              딱 맞는 칵테일이 없어 {resultData.relaxed.map((k) => ({ TASTE: "맛", BASE_SPIRIT: "기주", CARBONATION: "탄산", STRENGTH: "도수" } as Record<string, string>)[k] ?? k).join("·")} 조건을 조금 넓혀 골랐어요.
            </p>
          )}

          {/* 맛 노트 */}
          <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">맛 노트</h2>
            <TasteNote text={resultData?.pairingNote ?? ""} />
          </div>

          {/* 재료는 알레르기 확인 근거라 접지 않고 보여 준다. 조주 방법은 홈바만. */}
          {(resultData?.checkList?.length ?? 0) > 0 && (
            <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">필요한 재료</h2>
              <ul>
                {resultData?.checkList?.map((item, idx) => {
                  const [name, amount] = splitIngredient(item);
                  return (
                    <li key={idx} className="flex items-baseline justify-between gap-4 border-b border-[#4a3728]/15 py-1.5 text-[13px] font-medium text-black last:border-b-0">
                      <span>{name}</span>
                      {amount && <span className="shrink-0 tabular-nums text-stone-700">{amount}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
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

          {experienceLevel !== "home_bar" && resultData?.cocktailName && (
            <div className="w-full border-t border-[#4a3728]/25 pt-4 mb-6 text-left">
              <h2 className="text-xs font-bold text-stone-800 uppercase tracking-widest mb-2">바에서 주문할 때</h2>
              <p className="text-[13px] font-medium text-black">“{resultData.cocktailName} 부탁드려요”</p>
              <p className="mt-1 text-xs text-stone-700">덜 달게, 더 가볍게처럼 원하는 점을 덧붙여도 좋아요.</p>
            </div>
          )}

          <div className="w-full text-center pt-4 border-t border-[#4a3728]/25 mt-4">
            <span className="text-xs tracking-widest font-bold text-stone-600 uppercase italic">R-Whiskey Selection</span>
          </div>
        </article>
        {onAnother && resultData?.cocktailId != null && (
          <div className="mt-6 flex w-full max-w-md flex-col items-center gap-2 px-2 text-xs text-stone-300">
            <button type="button" onClick={onAnother} className="min-h-11 w-full rounded border border-[#e5d5b7]/60 px-3 text-sm font-bold text-[#e5d5b7] transition-colors hover:bg-[#e5d5b7]/10">
              다른 한 잔 부탁해요
            </button>
            <p>오늘 받을 수 있는 추천 횟수가 1회 줄어요. 같은 조건에서 다른 칵테일을 골라요.</p>
            {anotherError && <p role="alert" className="text-red-300">{anotherError}</p>}
          </div>
        )}
        {resultData?.oid ? <CocktailFeedbackPanel oid={resultData.oid} /> : null}
      </main>
    </div>
  );
}

/** 여러 줄이면 목록으로, 한 줄이면 문장으로 보여 준다. */
function LineList({ text }: { text: string }) {
  const all = text.split("\n").map((l) => l.trim()).filter(Boolean);
  // 따옴표(“…”)로 감싼 첫 줄은 바텐더의 말, 나머지는 조건에 맞은 근거 목록이다.
  const quote = all[0]?.startsWith("“") ? all[0] : null;
  const lines = quote ? all.slice(1) : all;
  return (
    <>
      {quote && <p className={`text-[14px] leading-relaxed text-black font-medium ${lines.length ? "mb-2" : ""}`}>{quote}</p>}
      {lines.length === 1 && !quote && <p className="text-[13px] leading-relaxed text-black font-medium">{lines[0]}</p>}
      {(lines.length > 1 || (lines.length === 1 && quote)) && (
        <ul className="list-disc list-inside space-y-1 text-[13px] leading-relaxed text-stone-800 font-medium">
          {lines.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      )}
    </>
  );
}

/** "맛 키워드: 상큼, 드라이" 같은 줄은 라벨과 값으로 나누고 맛 키워드는 칩으로 보여 준다. 그 밖의 글(AI 문장 등)은 그대로 둔다. */
const NOTE_LABELS = ["맛 키워드", "탄산"];
function TasteNote({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows = lines.map((l) => {
    const i = l.indexOf(": ");
    return i > 0 && NOTE_LABELS.includes(l.slice(0, i)) ? ([l.slice(0, i), l.slice(i + 2)] as const) : null;
  });
  if (!rows.some(Boolean)) return <p className="text-[13px] leading-relaxed text-black font-medium whitespace-pre-line">{text}</p>;
  return (
    <dl className="space-y-2">
      {lines.map((l, i) => {
        const row = rows[i];
        if (!row) return <p key={i} className="text-[13px] leading-relaxed text-black font-medium">{l}</p>;
        return (
          <div key={i} className="flex items-baseline gap-3">
            <dt className="w-16 shrink-0 text-xs text-stone-700">{row[0]}</dt>
            <dd className="flex flex-wrap gap-1.5 text-[13px] font-medium text-black">
              {row[0] === "맛 키워드"
                ? row[1].split(",").map((t) => <span key={t} className="rounded-full border border-[#4a3728]/40 px-2.5 py-0.5 text-xs">{t.trim()}</span>)
                : row[1]}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** "진 45ml" → ["진", "45ml"]. 양을 알아볼 수 없으면 이름만 둔다. */
function splitIngredient(item: string): [string, string] {
  const m = item.match(/^(.*?)\s+(\d.*|적당량.*|약간.*|조금.*)$/);
  return m ? [m[1], m[2]] : [item, ""];
}
