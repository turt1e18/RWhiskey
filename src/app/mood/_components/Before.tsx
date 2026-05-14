/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useMemo, useEffect } from "react";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { useAuthStore } from "@/store/authStore";
import { getWhiskyRecommendation } from "@/api/recommendationService";
import { useRecommendationStore } from "@/store/recommendationStore";
import { recommendationApi } from "@/api/whiskeyApi";

/**
 * Mood 추천 입력 화면 (Order Sheet 스타일)
 */
export default function BeforeScreen(props: any) {
  const {
    setSwitchState,
    userInput,
    setUserInput,
    setResultData,
    weather,
    setWeather,
    mood,
    setMood,
    strength,
    setStrength,
    imRich,
    setImRich
  } = props;
  const { user, isAuthenticated } = useAuthStore();
  const { selectedMainTag, resetMainTag } = useRecommendationStore();

  const [loading, setLoading] = useState(false);
  const [nextNo, setNextNo] = useState<number | null>(null);

  // 컴포넌트 마운트 시 다음 주문 번호 가져오기
  useEffect(() => {
    async function fetchNextNo() {
      try {
        const no = await recommendationApi.getNextNo();
        setNextNo(no);
      } catch (err) {
        console.error("Failed to fetch next order number:", err);
      }
    }
    fetchNextNo();
  }, []);

  // 옵션 데이터
  const weatherOptions = ["맑음", "흐림", "비", "추움", "기타"];
  const moodOptions = ["차분함", "활기", "집중", "피곤", "기타"];
  const strengthOptions = ["저도수", "기본도수", "고도수"];

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  async function callCombinedAPI() {
    if (!isAuthenticated || !user) {
      alert("로그인이 필요한 서비스입니다. 로그인 후 이용해주세요.");
      return;
    }

    if (
      userInput.trim().length === 0 &&
      (weather === "기타" || mood === "기타")
    ) {
      alert("기타를 선택하신 경우 추가 요청 사항을 입력해주세요.");
      return;
    }

    setLoading(true);

    const combinedPromise = (async () => {
      try {
        if (!user || user.uid === null) {
          throw new Error("사용자 정보를 찾을 수 없습니다.");
        }
        
        // 1. 백엔드 트랜잭션 서비스 호출
        const { aiResult, savedOid } = await getWhiskyRecommendation({
          weatherValue: weather,
          moodValue: mood,
          abvValue: strength,
          additionalValue: userInput,
          flexFlag: imRich,
          mainTasteTag: selectedMainTag || undefined,
        });

        // 2. 이미지 검색
        const googleRes = await fetch("/api/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: aiResult.whiskyName, type: 3 })
        });

        let imageUrl = null;
        if (googleRes.ok) {
          imageUrl = await googleRes.json();
        }

        // 3. 성공 시 메인 태그 초기화
        resetMainTag();

        return { 
          ...aiResult, 
          image: imageUrl,
          oid: savedOid 
        };
      } catch (err: any) {
        console.error('Recommendation Error:', err);
        throw err;
      }
    })();

    setResultData(combinedPromise);

    try {
      await combinedPromise;
      setSwitchState(1);
    } catch (err: any) {
      alert(err.message || "추천을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-screen min-h-screen bg-[#1a120d]">
        <WhiskeyLoader />
      </div>
    );
  }

  return (
    <div className="min-h-full md:h-full text-stone-100 bg-[#1a120d] selection:bg-amber-200/30 flex flex-col">
      <nav className="flex items-center justify-start px-6 py-4 w-full max-w-5xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 text-stone-500 hover:text-white transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
          </svg>
          <span className="text-sm font-light">뒤로가기</span>
        </button>
      </nav>

      <main className="mx-auto flex-1 flex max-w-6xl items-center justify-center px-6 py-4">
        <section className="grid w-full max-w-5xl gap-12 md:grid-cols-[1fr_1fr] items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-amber-300/80 font-medium">Whiskey Recommendation</p>
              <h1 className="text-2xl font-bold leading-tight md:text-4xl text-white font-serif">
                오늘의 분위기와 <br /> 취향을 선택해보세요
              </h1>
            </div>
            <p className="max-w-md text-sm leading-6 text-stone-400 md:text-base">
              오늘의 날씨와 현재 기분, 그리고 선호하는 도수까지 선택하면 당신의 하루 흐름에 어울리는 위스키를 추천해드립니다.
            </p>

            {/* 재추천 강조 풍미 표시: 본문 아래로 이동 */}
            {selectedMainTag && (
              <div className="bg-[#ffb247]/10 border border-[#ffb247]/30 p-4 rounded-lg">
                <p className="text-[#ffb247] text-sm font-bold uppercase tracking-widest mb-1">탐색 중인 풍미</p>
                <p className="text-white text-base">바텐더가 <span className="text-[#ffb247] font-bold">'{selectedMainTag}'</span> 특징이 강한 위스키를 찾고 있습니다.</p>
              </div>
            )}
            </div>

          <div className="relative bg-[#efe2c9] w-full max-w-[550px] mx-auto p-8 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-[#4a3728] rounded-sm overflow-hidden md:max-h-[90vh] flex flex-col">
            <div className="absolute inset-2 border border-[#4a3728]/20 pointer-events-none" />
            <div className="mb-4 flex items-center justify-between text-[12px] tracking-[0.2em] text-stone-700 font-bold">
              <span>No.{nextNo !== null ? String(nextNo).padStart(3, "0") : "..."}</span>
              <span>{todayStr}</span>
            </div>

            <div className="mb-5 text-center">
              <span className="inline-block border border-[#4a3728] text-[#2d2017] px-3 py-1 text-[13px] font-bold tracking-widest bg-white/10">오늘의 주문</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <div className="mb-4">
                <p className="mb-2 text-base font-bold text-stone-800">날씨</p>
                <div className="flex flex-wrap gap-2">
                  {weatherOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setWeather(opt)}
                      className={`px-3 py-1 rounded-full text-[13px] transition-all border ${
                        weather === opt ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]" : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-stone-600">
                  너무 세분화하지 않고 큰 흐름의 날씨만 선택합니다. 애매한 경우{" "}
                  <span className="font-bold">기타</span>를 고른 뒤, 현재
                  분위기나 온도를 자유롭게 적어주세요.
                </p>
              </div>

              <div className="mb-4">
                <p className="mb-2 text-base font-bold text-stone-800">기분</p>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setMood(opt)}
                      className={`px-3 py-1 rounded-full text-[13px] transition-all border ${
                        mood === opt ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]" : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-stone-600">
                  비슷한 의미는 하나로 묶어 단순화했습니다. 정확히 맞지 않으면{" "}
                  <span className="font-bold">기타</span>를 선택하고, 지금의
                  감정이나 원하는 분위기를 적어주세요.
                </p>
              </div>

              <div className="mb-5">
                <p className="mb-2 text-base font-bold text-stone-800">도수 선호</p>
                <div className="flex flex-wrap gap-2">
                  {strengthOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStrength(opt)}
                      className={`px-3 py-1 rounded-full text-[13px] transition-all border ${
                        strength === opt ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]" : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-stone-600">
                  저도수는 부담 없는 <span className="font-bold">39도 이하</span>, 기본도수는 위스키의 표준인 <span className="font-bold">40~47도</span>, 고도수는 강렬한 타격감의 <span className="font-bold">48도 이상</span>을 의미합니다.
                </p>
              </div>

              <div className="mb-5">
                <p className="mb-1 text-base font-bold text-stone-800">추가 요청</p>
                <textarea
                  className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-sm leading-6 text-stone-800 outline-none placeholder:text-stone-400 resize-none min-h-[100px]"
                  placeholder="예: 산책 후라 기분이 편안하고, 저녁에 천천히 즐길 수 있는 위스키면 좋겠어요. 선택지에 없는 날씨나 기분을 고른 경우 이곳에 자세히 적어주세요."
                  value={userInput}
                  maxLength={100}
                  onChange={(e) => setUserInput(e.target.value)}
                />
              </div>

              <div className="mb-5 flex items-start gap-3 text-stone-800">
                <input
                  id="flex-option"
                  type="checkbox"
                  checked={imRich}
                  onChange={() => setImRich(!imRich)}
                  className="mt-1 h-4 w-4 rounded border-[#4a3728] text-stone-900 focus:ring-0"
                />
                <label htmlFor="flex-option" className="cursor-pointer select-none leading-5">
                  <span className="text-base font-bold">오늘 Flex 할게요</span>
                  <br />
                  <span className="text-[12px] text-stone-600">
                    기본 추천은 부담 없는 가격대로, 체크 시 더 고급스러운
                    선택까지 고려합니다. 기타를 고른 경우에는 추가 요청의 설명
                    비중을 더 크게 반영합니다.
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={callCombinedAPI}
              className="w-full bg-[#111] text-white py-3 text-base font-bold tracking-widest hover:opacity-90 transition-opacity active:scale-[0.98] mt-2"
            >
              위스키 추천 받기
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
