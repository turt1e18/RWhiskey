/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useMemo } from "react";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { useAuthStore } from "@/store/authStore";
import { getWhiskyRecommendation } from "@/api/recommendationService";

/**
 * Mood 추천 입력 화면 (Order Sheet 스타일)
 * sample.html의 디자인을 반영하여 세련된 위스키 주문서 형태로 리팩토링되었습니다.
 */
export default function BeforeScreen(props: any) {
  const { setSwitchState, userInput, setUserInput, setResultData } = props;
  const { user, isAuthenticated } = useAuthStore();

  // 신규 추가된 선택 상태
  const [weather, setWeather] = useState("맑음");
  const [mood, setMood] = useState("차분함");
  const [strength, setStrength] = useState("기본도수");
  const [imRich, setImRich] = useState(false);
  const [loading, setLoading] = useState(false);

  // 옵션 데이터
  const weatherOptions = ["맑음", "흐림", "비", "추움", "기타"];
  const moodOptions = ["차분함", "활기", "집중", "피곤", "기타"];
  const strengthOptions = ["저도수", "기본도수", "고도수"];

  // 현재 날짜 (No. 및 날짜 표시용)
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
        // 1. 백엔드 트랜잭션 서비스 호출 (토큰 차감 -> AI 추천 -> DB 저장)
        const { aiResult, savedOid } = await getWhiskyRecommendation(user.uid, {
          weather_value: weather,
          mood_value: mood,
          abv_value: strength,
          additional_value: userInput,
          flex_flag: imRich,
        });

        // 2. 이미지 검색 (Google API 활용 - 기존 로직 유지)
        const googleRes = await fetch("/api/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: aiResult.whiskyName, type: 3 })
        });

        let imageUrl = null;
        if (googleRes.ok) {
          imageUrl = await googleRes.json();
        }

        // 3. 최종 데이터 반환 (savedOid 포함하여 나중에 상세 조회나 삭제 등에 활용 가능)
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
      {/* Top Navigation Bar: 뒤로가기 버튼만 유지 */}
      <nav className="flex items-center justify-start px-6 py-4 w-full max-w-5xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center space-x-2 text-stone-500 hover:text-white transition-colors"
        >
          <svg
            className="h-5 w-5"
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
      </nav>

      <main className="mx-auto flex-1 flex max-w-6xl items-center justify-center px-6 py-4">
        <section className="grid w-full max-w-5xl gap-12 md:grid-cols-[1fr_1fr] items-center">
          {/* 왼쪽 안내 텍스트 */}
          <div className="flex flex-col justify-center space-y-4">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-amber-300/80 font-medium">
                Whiskey Recommendation
              </p>
              <h1 className="text-2xl font-bold leading-tight md:text-4xl text-white font-serif">
                오늘의 분위기와 <br />
                취향을 선택해보세요
              </h1>
            </div>
            <p className="max-w-md text-xs leading-6 text-stone-400 md:text-sm">
              오늘의 날씨와 현재 기분, 그리고 선호하는 도수까지 선택하면 당신의
              하루 흐름에 어울리는 위스키를 추천해드립니다.
              <br />
              <br />
              추가 요청에는 원하는 분위기나 상황을 자유롭게 적어주세요. 바에
              앉아 바텐더에게 이야기하듯 입력하면, 그에 맞는 한 잔을
              제안해드립니다.
            </p>
          </div>

          {/* 오른쪽 주문서 (Order Paper) */}
          <div className="relative bg-[#efe2c9] w-full max-w-[550px] mx-auto p-8 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-[#4a3728] rounded-sm overflow-hidden md:max-h-[90vh] flex flex-col">
            {/* 내부 테두리 장식 */}
            <div className="absolute inset-2 border border-[#4a3728]/20 pointer-events-none" />

            {/* 헤더 정보 */}
            <div className="mb-4 flex items-center justify-between text-[10px] tracking-[0.2em] text-stone-700 font-bold">
              <span>No.002</span>
              <span>{todayStr}</span>
            </div>

            <div className="mb-5 text-center">
              <span className="inline-block border border-[#4a3728] text-[#2d2017] px-3 py-1 text-[11px] font-bold tracking-widest bg-white/10">
                오늘의 주문
              </span>
            </div>

            {/* 스크롤 가능 영역 */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {/* 날씨 선택 */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-bold text-stone-800">날씨</p>
                <div className="flex flex-wrap gap-2">
                  {weatherOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setWeather(opt)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-all border ${
                        weather === opt
                          ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]"
                          : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-5 text-stone-600">
                  너무 세분화하지 않고 큰 흐름의 날씨만 선택합니다. 애매한 경우{" "}
                  <span className="font-bold">기타</span>를 고른 뒤, 현재
                  분위기나 온도를 자유롭게 적어주세요.
                </p>
              </div>

              {/* 기분 선택 */}
              <div className="mb-4">
                <p className="mb-2 text-sm font-bold text-stone-800">기분</p>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setMood(opt)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-all border ${
                        mood === opt
                          ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]"
                          : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-5 text-stone-600">
                  비슷한 의미는 하나로 묶어 단순화했습니다. 정확히 맞지 않으면{" "}
                  <span className="font-bold">기타</span>를 선택하고, 지금의
                  감정이나 원하는 분위기를 적어주세요.
                </p>
              </div>

              {/* 도수 선호 */}
              <div className="mb-5">
                <p className="mb-2 text-sm font-bold text-stone-800">
                  도수 선호
                </p>
                <div className="flex flex-wrap gap-2">
                  {strengthOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStrength(opt)}
                      className={`px-3 py-1 rounded-full text-[11px] transition-all border ${
                        strength === opt
                          ? "bg-[#4a3728]/10 border-[#2d2017] font-bold text-[#2d2017]"
                          : "bg-white/20 border-[#4a3728]/30 text-stone-700 hover:border-[#4a3728]/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-5 text-stone-600">
                  저도수는 부담 없이 마시기 좋은 가벼운 스타일, 기본도수는
                  일반적인 위스키 기준, 고도수는 도수가 높고 풍미가 강한
                  스타일을 의미합니다.
                </p>
              </div>

              {/* 추가 요청 */}
              <div className="mb-5">
                <p className="mb-1 text-sm font-bold text-stone-800">
                  추가 요청
                </p>
                <textarea
                  className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-sm leading-6 text-stone-800 outline-none placeholder:text-stone-400 resize-none min-h-[100px]"
                  placeholder="예: 산책 후라 기분이 편안하고, 저녁에 천천히 즐길 수 있는 위스키면 좋겠어요. 선택지에 없는 날씨나 기분을 고른 경우 이곳에 자세히 적어주세요."
                  value={userInput}
                  maxLength={100}
                  onChange={(e) => setUserInput(e.target.value)}
                />
              </div>

              {/* Flex 옵션 */}
              <div className="mb-5 flex items-start gap-3 text-stone-800">
                <input
                  id="flex-option"
                  type="checkbox"
                  checked={imRich}
                  onChange={() => setImRich(!imRich)}
                  className="mt-1 h-4 w-4 rounded border-[#4a3728] text-stone-900 focus:ring-0"
                />
                <label
                  htmlFor="flex-option"
                  className="cursor-pointer select-none leading-5"
                >
                  <span className="text-sm font-bold">오늘 Flex 할게요</span>
                  <br />
                  <span className="text-[10px] text-stone-600">
                    기본 추천은 부담 없는 가격대로, 체크 시 더 고급스러운
                    선택까지 고려합니다. 기타를 고른 경우에는 추가 요청의 설명
                    비중을 더 크게 반영합니다.
                  </span>
                </label>
              </div>

              {/* 주의사항 */}
              <div className="mb-5 border border-[#b08325]/80 bg-[#b08325]/5 rounded-sm px-4 py-2 text-[10px] text-[#785c18] leading-relaxed">
                ⚠ 본 추천은 AI의 분석에 기반한 참고 정보입니다.
                <br />
                실제 취향이나 상황과 다를 수 있으니 참고용으로 이용해 주세요.
              </div>
            </div>

            {/* 버튼 */}
            <button
              onClick={callCombinedAPI}
              className="w-full bg-[#111] text-white py-3 text-sm font-bold tracking-widest hover:opacity-90 transition-opacity active:scale-[0.98] mt-2"
            >
              위스키 추천 받기
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
