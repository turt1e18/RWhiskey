"use client";
import { useState, useMemo, Dispatch, SetStateAction } from "react";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { CocktailRecommendationRequest, ExperienceLevel } from "@/type/CocktailInterface";
import { useAuthStore } from "@/store/authStore";

interface BeforeScreenProps {
  request: CocktailRecommendationRequest;
  setRequest: Dispatch<SetStateAction<CocktailRecommendationRequest>>;
  imRich: boolean;
  setImRich: Dispatch<SetStateAction<boolean>>;
  setDataPromise: Dispatch<SetStateAction<Promise<any> | null>>;
  setSwitchState: Dispatch<SetStateAction<number>>;
}

export default function BeforeScreen(props: BeforeScreenProps) {
  const { request, setRequest, imRich, setImRich, setDataPromise, setSwitchState } = props;
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dislikeInput, setDislikeInput] = useState("");
  const [customBottle, setCustomBottle] = useState("");
  const [modalConfig, setModalConfig] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: "",
    message: ""
  });

  // 옵션 데이터 정의
  const experienceOptions: { label: string; value: ExperienceLevel }[] = [
    { label: "입문자 (Beginner)", value: "beginner" },
    { label: "경험자 (Experienced)", value: "experienced" },
    { label: "홈바 (Home Bar)", value: "home_bar" },
  ];

  const tasteOptions = [
    "달콤한 (Sweet)", 
    "상큼한 (Sour)", 
    "드라이한 (Dry)", 
    "씁쓸한 (Bitter)", 
    "크리미한 (Creamy)", 
    "스파이시한 (Spicy)", 
    "탄닌감 (Tannic)"
  ];
  const baseSpiritOptions = ["진", "보드카", "럼", "데킬라", "위스키", "브랜디", "리큐르", "상관없음"];
  const commonDislikes = ["민트", "오이", "계란 흰자", "시나몬", "고수", "올리브"];

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // 핸들러 함수들
  const toggleArrayItem = (field: 'preferredTaste' | 'dislikes', item: string) => {
    setRequest(prev => {
      const current = prev[field];
      
      // 기피 재료 8개 제한 로직
      if (field === 'dislikes' && !current.includes(item) && current.length >= 8) {
        setModalConfig({
          show: true,
          title: "안내 말씀",
          message: "바텐더의 세심한 조주를 위해\n기피 재료는 최대 8가지까지만\n선택하실 수 있습니다."
        });
        return prev;
      }

      const next = current.includes(item)
        ? current.filter(i => i !== item)
        : [...current, item];
      return { ...prev, [field]: next };
    });
  };

  const addCustomDislike = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && dislikeInput.trim()) {
      e.preventDefault();
      const trimmed = dislikeInput.trim();
      
      if (!request.dislikes.includes(trimmed)) {
        if (request.dislikes.length >= 8) {
          setModalConfig({
            show: true,
            title: "안내 말씀",
            message: "바텐더의 세심한 조주를 위해\n기피 재료는 최대 8가지까지만\n선택하실 수 있습니다."
          });
        } else {
          toggleArrayItem('dislikes', trimmed);
        }
      }
      setDislikeInput("");
    }
  };

  const startRecommendation = async () => {
    // 0. 인증 확인
    if (!isAuthenticated) {
      setModalConfig({
        show: true,
        title: "로그인 필요",
        message: "바텐더의 추천을 받으시려면\n로그인이 필요합니다.\n\n로그인 후 다시 이용해 주세요."
      });
      return;
    }

    // 유효성 검사: 바텐더 메모 (필수 1자 이상)
    if (!request.currentMood || request.currentMood.trim().length === 0) {
      setModalConfig({
        show: true,
        title: "작성 요청",
        message: "바텐더가 참고할 수 있도록\n오늘의 기분이나 요청 사항을\n한 글자 이상 작성해 주세요."
      });
      return;
    }

    // 유효성 검사: 홈바 기타 기주 선택 시 보틀명 (필수)
    if (request.experienceLevel === 'home_bar' && request.baseSpirit === "기타(바틀지정)") {
      if (!customBottle || customBottle.trim().length === 0) {
        setModalConfig({
          show: true,
          title: "정보 부족",
          message: "기타 보틀을 선택하셨습니다.\n조주에 사용할 보틀 명을\n정확히 기재해 주세요."
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { getCocktailRecommendation } = await import("@/api/recommendationService");
      
      // 기주 정보 보정
      const finalRequest = {
        ...request,
        baseSpirit: request.baseSpirit === "기타(바틀지정)" ? `기타(${customBottle})` : request.baseSpirit
      };

      // 실제 API 호출 (트랜잭션 포함: 토큰 차감 -> Gemini -> 이미지 검색 -> 저장)
      const res = await getCocktailRecommendation(finalRequest, imRich);
      
      // UI 호환성을 위한 데이터 구성 (서비스에서 이미 정제되어 반환됨)
      const formattedData = {
        oid: res.savedOid,
        ...res.aiResult,
        // UI 필드 매핑 (Whisky 스펙과 통일 - AfterScreen 호환용)
        foodName: res.aiResult.foodPairing,
        pairingNote: res.aiResult.tastingNote,
        bartenderWord: res.aiResult.bartenderMessage,
        images: res.aiResult.images // 서비스에서 이미지가 포함된 결과를 반환하도록 수정 예정
      };

      setDataPromise(Promise.resolve(formattedData));
      setSwitchState(1);
    } catch (err: any) {
      console.error("Recommendation Error:", err);
      alert(err.message || "추천을 가져오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-screen h-[70vh]">
        <WhiskeyLoader />
      </div>
    );
  }

  return (
    <div className="min-h-full text-stone-100 bg-transparent selection:bg-amber-200/30 flex flex-col">
      {/* 범용 안내 모달 */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-[#2d2417] border border-[#ffb247]/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-2xl">📢</span>
                <h2 className="text-xl font-bold text-[#ffb247]">{modalConfig.title}</h2>
              </div>

              <div className="space-y-4 text-white/80 leading-relaxed text-[0.9375rem] font-light">
                {modalConfig.message.split('\n').map((line, i) => (
                  <p key={i} className="whitespace-pre-line">{line}</p>
                ))}
              </div>

              <button
                onClick={() => setModalConfig(prev => ({ ...prev, show: false }))}
                className="w-full mt-8 py-3 px-6 bg-[#ffb247] hover:bg-[#d98b1e] text-[#1a140b] font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                확인 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
        <section className="grid w-full max-w-5xl gap-12 lg:grid-cols-2 items-start">
          {/* 좌측 설명 영역 (상단 고정) */}
          <div className="flex flex-col justify-center space-y-6 lg:sticky lg:top-12">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.25em] text-amber-300/80 font-medium">Cocktail Consultation</p>
              <h1 className="text-2xl font-bold leading-tight md:text-4xl text-white font-serif">
                바텐더의 <br /> 취향 진단서
              </h1>
            </div>
            
            <p className="max-w-md text-sm leading-relaxed text-stone-400">
              당신의 숙련도와 선호하는 맛, 그리고 피하고 싶은 재료를 알려주세요. 
              오늘의 기분에 딱 맞는 최적의 한 잔을 조주해 드립니다.
            </p>

            <div className="space-y-4 border-l-2 border-amber-300/20 pl-6">
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">1. 숙련도 선택</p>
                <p className="text-xs text-stone-500">입문자부터 전문가까지 맞춤형 레시피를 제공합니다.</p>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">2. 세밀한 맛 조절</p>
                <p className="text-xs text-stone-500">단맛, 신맛, 탄산 유무 등 세세한 취향을 반영합니다.</p>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">3. 기주 지정 (경험자)</p>
                <p className="text-xs text-stone-500">선호하는 베이스 술이 있다면 직접 지정할 수 있습니다.</p>
              </div>
            </div>
          </div>

          {/* 우측 주문서 영역 */}
          <div className="relative bg-[#efe2c9] w-full max-w-[480px] mx-auto p-6 md:p-8 text-stone-900 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-[#4a3728] rounded-sm flex flex-col min-h-[750px] font-sans">
            <div className="absolute inset-2 md:inset-4 border border-[#4a3728]/20 pointer-events-none" />
            
            <div className="mb-6 flex items-center justify-between font-sans relative">
              <div className="text-base font-kyobo border-b-2 border-stone-900 pb-0.5 leading-none text-stone-900 font-bold">No. 001</div>
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="w-3 md:w-5 h-[1px] bg-stone-400" />
                <div className="text-[11px] md:text-[13px] font-bold text-stone-800 tracking-[0.2em] text-center whitespace-nowrap uppercase">
                  칵테일 추천 주문서
                </div>
                <span className="w-3 md:w-5 h-[1px] bg-stone-400" />
              </div>
              <span className="text-[11px] text-stone-600 font-medium tracking-tighter">{todayStr}</span>
            </div>

            <div className="flex-1 space-y-8 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                {/* 1. 사용자 레벨 */}
                <section className="font-sans">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">01.</span> 유저 숙련도
                  </h3>
                  <div className="flex flex-col gap-2 font-sans">
                    {experienceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRequest(prev => ({ ...prev, experienceLevel: opt.value }))}
                        className="flex items-center gap-3 p-2 border border-[#4a3728]/30 rounded hover:bg-[#4a3728]/5 transition-colors group font-sans"
                      >
                        <div className={`w-3.5 h-3.5 border border-[#4a3728] flex items-center justify-center transition-all ${request.experienceLevel === opt.value ? 'bg-[#4a3728]' : 'bg-transparent'}`}>
                          {request.experienceLevel === opt.value && (
                            <svg className="w-2.5 h-2.5 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                            </svg>
                          )}
                        </div>
                        <span className={`text-[11px] ${request.experienceLevel === opt.value ? 'font-bold' : 'font-medium'} text-stone-800 font-sans`}>
                          {opt.label.split(' (')[0]} 
                          <span className="text-[9px] opacity-60 font-normal ml-1">({opt.label.split(' (')[1]}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>

                {/* 2. 무알콜 여부 */}
                <section className="font-sans">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">02.</span> 무알콜 여부
                  </h3>
                  <div className="flex flex-col gap-2 font-sans">
                    {[
                      { label: "예 (Non-Alcoholic)", value: true },
                      { label: "아니오 (Alcoholic)", value: false }
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setRequest(prev => ({ ...prev, isNonAlcoholic: opt.value }))}
                        className="flex items-center gap-3 p-2 border border-[#4a3728]/30 rounded hover:bg-[#4a3728]/5 transition-colors group font-sans"
                      >
                        <div className={`w-3.5 h-3.5 border border-[#4a3728] flex items-center justify-center transition-all ${request.isNonAlcoholic === opt.value ? 'bg-[#4a3728]' : 'bg-transparent'}`}>
                          {request.isNonAlcoholic === opt.value && (
                            <svg className="w-2.5 h-2.5 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                            </svg>
                          )}
                        </div>
                        <span className={`text-[11px] ${request.isNonAlcoholic === opt.value ? 'font-bold' : 'font-medium'} text-stone-800 font-sans`}>
                          {opt.label.split(' (')[0]} 
                          <span className="text-[9px] opacity-60 font-normal ml-1">({opt.label.split(' (')[1]}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* 3. 기주 선택 (경험자/홈바 전용) */}
              {(request.experienceLevel === 'experienced' || request.experienceLevel === 'home_bar') && (
                <section className="animate-in fade-in slide-in-from-top-4 duration-500 font-sans border-t border-[#4a3728]/10 pt-6">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">03.</span> 베이스 기주 지정
                  </h3>
                  <div className="flex flex-wrap gap-2 font-sans">
                    {baseSpiritOptions.map((spirit) => (
                      <button
                        key={spirit}
                        onClick={() => setRequest(prev => ({ ...prev, baseSpirit: spirit }))}
                        className={`px-3 py-1.5 text-[11px] font-bold border transition-all font-sans ${
                          request.baseSpirit === spirit 
                            ? "bg-[#4a3728] text-[#efe2c9] border-[#4a3728]" 
                            : "bg-white/30 text-stone-700 border-[#4a3728]/20 hover:border-[#4a3728]"
                        }`}
                      >
                        {spirit}
                      </button>
                    ))}
                    {request.experienceLevel === 'home_bar' && (
                      <button
                        onClick={() => setRequest(prev => ({ ...prev, baseSpirit: "기타(바틀지정)" }))}
                        className={`px-3 py-1.5 text-[11px] font-bold border transition-all font-sans ${
                          request.baseSpirit === "기타(바틀지정)" 
                            ? "bg-[#4a3728] text-[#efe2c9] border-[#4a3728]" 
                            : "bg-white/30 text-stone-700 border-[#4a3728]/20 hover:border-[#4a3728]"
                        }`}
                      >
                        기타 <span className="text-[9px] font-normal opacity-70">(바틀지정)</span>
                      </button>
                    )}
                  </div>

                  {request.experienceLevel === 'home_bar' && request.baseSpirit === "기타(바틀지정)" && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 font-sans">
                      <input
                        type="text"
                        value={customBottle}
                        onChange={(e) => setCustomBottle(e.target.value)}
                        placeholder="기주로 선택할 명확한 보틀명을 입력해주세요."
                        className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-xs text-stone-800 outline-none placeholder:text-stone-400 font-sans"
                      />
                    </div>
                  )}
                </section>
              )}

              {/* 4. 맛 선호 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                  <span className="text-red-800 text-xs font-sans">04.</span> 선호하는 맛 (다중 선택)
                </h3>
                <div className="flex flex-wrap gap-2 font-sans">
                  {tasteOptions.map((taste) => (
                    <button
                      key={taste}
                      onClick={() => toggleArrayItem('preferredTaste', taste)}
                      className={`px-3 py-1.5 text-[11px] font-bold border rounded-full transition-all font-sans ${
                        request.preferredTaste.includes(taste)
                          ? "bg-[#4a3728] text-[#efe2c9] border-[#4a3728]"
                          : "bg-white/30 text-stone-700 border-[#4a3728]/20 hover:border-[#4a3728]"
                      }`}
                    >
                      {taste.split(' (')[0]} <span className="text-[9px] font-normal opacity-70 ml-0.5">({taste.split(' (')[1]}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 5. 탄산 유무 */}
              <section className="font-sans">
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                  <span className="text-red-800 text-xs font-sans">05.</span> 청량감 (탄산)
                </h3>
                <div className="flex gap-8 font-sans">
                  {[
                    { label: "탄산 있음 (Sparkling)", value: true },
                    { label: "탄산 없음 (Still)", value: false }
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setRequest(prev => ({ ...prev, carbonation: opt.value }))}
                      className="flex items-center gap-3 group font-sans"
                    >
                      <div className={`w-4 h-4 border border-[#4a3728] flex items-center justify-center transition-all ${request.carbonation === opt.value ? 'bg-[#4a3728]' : 'bg-transparent'}`}>
                        {request.carbonation === opt.value && (
                          <svg className="w-3 h-3 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${request.carbonation === opt.value ? 'font-bold' : 'font-medium'} text-stone-800 font-sans`}>
                        {opt.label.split(' (')[0]} <span className="text-[9px] font-normal opacity-70 ml-0.5">({opt.label.split(' (')[1]}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 6. 기피 재료 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">06.</span> 기피 재료
                  </h3>
                  <span className="text-[10px] text-stone-500 font-medium font-sans">{request.dislikes.length} / 8</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 font-sans">
                  {commonDislikes.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleArrayItem('dislikes', item)}
                      className={`px-2.5 py-1 text-[10px] font-bold border transition-all font-sans ${
                        request.dislikes.includes(item)
                          ? "bg-red-800 text-white border-red-800"
                          : "bg-white/30 text-stone-600 border-[#4a3728]/20 hover:border-[#4a3728]"
                      }`}
                    >
                      {request.dislikes.includes(item) ? `✕ ${item}` : item}
                    </button>
                  ))}
                </div>
                <div className="relative font-sans">
                  <input
                    type="text"
                    value={dislikeInput}
                    onChange={(e) => setDislikeInput(e.target.value)}
                    onKeyDown={addCustomDislike}
                    placeholder="그 외 기피하는 재료가 있다면 입력 후 엔터..."
                    className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-xs text-stone-800 outline-none placeholder:text-stone-400 font-sans"
                  />
                  <div className="flex flex-wrap gap-2 mt-2 font-sans">
                    {request.dislikes.filter(d => !commonDislikes.includes(d)).map(d => (
                       <span key={d} className="px-2 py-0.5 bg-red-800/10 text-red-800 border border-red-800/20 text-[10px] font-bold rounded flex items-center gap-1 font-sans">
                         {d} <button onClick={() => toggleArrayItem('dislikes', d)} className="font-sans">✕</button>
                       </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* 7. 주문 메시지 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">07.</span> 바텐더에게 남기는 메모
                  </h3>
                  <span className="text-[10px] text-stone-500 font-medium font-sans">{request.currentMood.length} / 100</span>
                </div>
                <textarea
                  className="w-full bg-transparent border-none px-0 py-1 text-sm leading-relaxed text-[#2d2017] outline-none placeholder:text-stone-400 resize-none min-h-[100px] font-medium font-sans"
                  placeholder="오늘의 기분, 날씨, 혹은 바텐더가 참고했으면 하는 특별한 요청 사항을 자유롭게 적어주세요..."
                  value={request.currentMood}
                  maxLength={100}
                  onChange={(e) => setRequest(prev => ({ ...prev, currentMood: e.target.value }))}
                />
              </section>

              {/* 7. Flex 옵션 */}
              <div className="flex items-start gap-4 p-4 bg-white/40 border border-[#4a3728]/10 rounded font-sans">
                <div 
                  onClick={() => setImRich(!imRich)}
                  className={`mt-1 min-w-[18px] h-[18px] border border-[#4a3728] flex items-center justify-center cursor-pointer transition-all ${imRich ? 'bg-[#4a3728]' : 'bg-transparent'}`}
                >
                  {imRich && (
                    <svg className="w-3.5 h-3.5 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                    </svg>
                  )}
                </div>
                <div className="cursor-pointer select-none font-sans" onClick={() => setImRich(!imRich)}>
                  <p className="text-sm font-bold text-stone-900 font-sans">오늘의 Flex</p>
                  <p className="text-[11px] text-stone-600 leading-snug mt-1 font-sans">
                    평소보다 고급스러운 기주나 구하기 힘든 부재료를 활용한 프리미엄 칵테일 위주로 추천해 드립니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[#4a3728]/25 text-center font-sans">
              <div className="bg-yellow-600/5 border border-yellow-700/20 p-2.5 rounded mb-6 text-[11px] text-stone-600 leading-relaxed text-left font-sans">
                ⚠️ 본 추천은 AI 분석에 기반한 참고 정보입니다. 실제 상황과 다를 수 있으니 참고용으로 이용해 주세요.
              </div>
              <button
                onClick={startRecommendation}
                className="w-[85%] mx-auto bg-[#111] text-white py-3 text-base font-bold hover:bg-black transition-all active:scale-[0.98] shadow-xl font-sans"
              >
                칵테일 추천받기
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
