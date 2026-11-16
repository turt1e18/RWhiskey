"use client";
import { recommendationErrorMessage, isLoginRequiredError, DAILY_LIMIT_MESSAGE } from "@/lib/userFacingError";
import { saveCocktailDraft } from "@/lib/cocktailDraft";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { useState, useMemo, useEffect, Dispatch, SetStateAction } from "react";
import { cocktailLoadingMessages } from "./cocktailLoadingMessages";
import { runRecommendation } from "./runRecommendation";
import { useCatalogEnabled } from "./CatalogFlag";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { CocktailRecommendationRequest, CocktailStrength } from "@/type/CocktailInterface";
import type { CocktailDataInterface } from "@/type/CocktailDataInterface";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface ModalConfig {
  show: boolean;
  title: string;
  message: string;
  action?: "login";
}

interface BeforeScreenProps {
  request: CocktailRecommendationRequest;
  setRequest: Dispatch<SetStateAction<CocktailRecommendationRequest>>;
  customBottle: string;
  setCustomBottle: Dispatch<SetStateAction<string>>;
  setDataPromise: Dispatch<SetStateAction<Promise<CocktailDataInterface> | null>>;
  setSwitchState: Dispatch<SetStateAction<number>>;
}

export default function BeforeScreen(props: BeforeScreenProps) {
  const { request, setRequest, customBottle, setCustomBottle, setDataPromise, setSwitchState } = props;
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dislikeInput, setDislikeInput] = useState("");
  const [recError, setRecError] = useState<{ message: string; loginRequired: boolean } | null>(null);
  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    show: false,
    title: "",
    message: ""
  });

  // 옵션 데이터 정의
  const strengthOptions: { label: string; hint: string; value: CocktailStrength | null }[] = [
    { label: "가볍게", hint: "12% 이하", value: "light" },
    { label: "적당히", hint: "13~22%", value: "medium" },
    { label: "진하게", hint: "22% 초과", value: "strong" },
    { label: "상관없어요", hint: "", value: null },
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
  const commonDislikes = ["민트", "오이", "계란 흰자", "시나몬", "고수", "올리브", "견과류", "유제품", "코코넛"];

  // 기주 선택은 무알콜일 때만 숨으므로, 보이지 않을 때 번호가 비지 않게 센다.
  const hasBase = !request.isNonAlcoholic;
  // 도수·기주 선택은 무알콜이 아닐 때만 보인다. 앞의 세 칸(경험·장소·알코올)을 빼고 센다.
  const catalog = useCatalogEnabled();
  const showStrength = hasBase && catalog;
  const num = (n: number) => String(n + (hasBase ? 1 : 0) + (showStrength ? 1 : 0)).padStart(2, '0') + '.';
  // 카탈로그가 꺼진 경로는 도수를 보장하지 못하므로 선택값을 비워 서버가 선호 없음으로 다루게 한다.
  useEffect(() => {
    if (!catalog && request.strength) setRequest(prev => ({ ...prev, strength: null }));
  }, [catalog, request.strength, setRequest]);

  // 경험은 바에서 주문할 때만 저장값(beginner/experienced)에 반영된다. 집에서 만들면 home_bar로 저장된다.
  const [tried, setTried] = useState(request.experienceLevel === 'experienced');
  useEffect(() => { if (request.experienceLevel !== 'home_bar') setTried(request.experienceLevel === 'experienced'); }, [request.experienceLevel]);
  const atHome = request.experienceLevel === 'home_bar';
  const chooseExperience = (didTry: boolean) => {
    setTried(didTry);
    setRequest(prev => ({ ...prev, experienceLevel: prev.experienceLevel === 'home_bar' ? 'home_bar' : didTry ? 'experienced' : 'beginner' }));
  };
  const choosePlace = (home: boolean) => setRequest(prev => ({ ...prev, experienceLevel: home ? 'home_bar' : tried ? 'experienced' : 'beginner' }));

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
          title: "8개까지 고를 수 있어요",
          message: "기피 재료는 최대 8개예요.\n하나를 지우고 다시 골라 주세요."
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
            title: "8개까지 고를 수 있어요",
            message: "기피 재료는 최대 8개예요.\n하나를 지우고 다시 골라 주세요."
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
        title: "로그인이 필요해요",
        message: "추천은 로그인한 뒤에 받을 수 있어요.\n고른 조건은 로그인하고 돌아오면 다시 채워져요.",
        action: "login"
      });
      return;
    }

    // 유효성 검사: 홈바 기타 기주 선택 시 보틀명 (필수)
    if (hasBase && request.experienceLevel === 'home_bar' && request.baseSpirit === "기타(바틀지정)") {
      if (!customBottle || customBottle.trim().length === 0) {
        setModalConfig({
          show: true,
          title: "보틀 이름이 필요해요",
          message: "기타 보틀을 고르셨어요.\n기주로 쓸 보틀 이름을 적어 주세요."
        });
        return;
      }
    }

    setRecError(null);
    setLoading(true);
    try {
      // 실제 API 호출 (트랜잭션 포함: 토큰 차감 -> Gemini -> 이미지 검색 -> 저장)
      const formattedData = await runRecommendation(request, customBottle);

      setDataPromise(Promise.resolve(formattedData));
      setSwitchState(1);
    } catch (err: any) {
      console.error("Recommendation Error:", err);
      setRecError({ message: recommendationErrorMessage(err), loginRequired: isLoginRequiredError(err) });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => saveCocktailDraft({ request, customBottle });

  const closeModal = () => setModalConfig(prev => ({ ...prev, show: false }));

  const handleModalConfirm = () => {
    setModalConfig(prev => ({ ...prev, show: false }));

    if (modalConfig.action === "login") {
      saveDraft();
      router.push("/login");
    }
  };

  // Esc는 안내만 닫는다(로그인으로 보내지 않는다).
  const dialogRef = useDialogFocus<HTMLDivElement>(modalConfig.show, () => setModalConfig(prev => ({ ...prev, show: false })));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-screen h-[70vh]">
        <WhiskeyLoader messages={cocktailLoadingMessages} />
      </div>
    );
  }

  return (
    <div className="min-h-full text-stone-100 bg-transparent selection:bg-amber-200/30 flex flex-col">
      {/* 범용 안내 모달 */}
      {modalConfig.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="cocktail-modal-title" className="w-full max-w-sm bg-[#2d2417] border border-[#ffb247]/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 id="cocktail-modal-title" className="text-xl font-bold text-[#ffb247]">{modalConfig.title}</h2>
              </div>

              <div className="space-y-4 text-white/80 leading-relaxed text-[0.9375rem] font-light">
                {modalConfig.message.split('\n').map((line, i) => (
                  <p key={i} className="whitespace-pre-line">{line}</p>
                ))}
              </div>

              <button
                onClick={handleModalConfirm}
                className="w-full mt-8 py-3 px-6 bg-[#ffb247] hover:bg-[#d98b1e] text-[#1a140b] font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                {modalConfig.action === "login" ? "로그인하러 가기" : "알겠어요"}
              </button>
              {modalConfig.action === "login" && (
                <button onClick={closeModal} className="mt-2 min-h-11 w-full text-sm text-white/70 underline">닫기</button>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className="flex items-center justify-start px-6 py-4 w-full max-w-5xl mx-auto">
        <button
          onClick={() => (window.history.length > 1 ? window.history.back() : router.push("/"))}
          className="flex items-center space-x-2 text-stone-400 hover:text-white transition-colors"
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
              {catalog ? "경험, 맛, 도수" : "경험, 맛"}, 피하고 싶은 재료를 알려 주세요. 조건에 맞는 칵테일을 골라 드려요.
            </p>

            <div className="hidden space-y-4 border-l-2 border-amber-300/20 pl-6 lg:block">
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">1. 경험과 장소</p>
                <p className="text-xs text-stone-400">집에서 만들 거라면 “집에서 만들래요”를 고르세요. 재료와 만드는 순서가 함께 나와요.</p>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">2. {catalog ? "맛, 탄산, 도수" : "맛과 탄산"}</p>
                <p className="text-xs text-stone-400">고른 조건으로 칵테일을 좁혀요. 맞는 게 없으면 조건을 조금 넓혀요.</p>
              </div>
              <div className="space-y-1">
                <p className="text-white text-sm font-medium">3. 기주 고르기</p>
                <p className="text-xs text-stone-400">좋아하는 베이스 술이 있다면 골라 보세요. 무알콜은 기주 없이 만들어요.</p>
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
                <div className="text-xs md:text-[13px] font-bold text-stone-800 tracking-[0.2em] text-center whitespace-nowrap uppercase">
                  칵테일 추천 주문서
                </div>
                <span className="w-3 md:w-5 h-[1px] bg-stone-400" />
              </div>
              <span className="text-xs text-stone-600 font-medium tracking-tighter">{todayStr}</span>
            </div>

            <div className="flex-1 space-y-8 font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                <section className="font-sans">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">01.</span> 칵테일 경험
                  </h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <ChoiceButton selected={!tried} onClick={() => chooseExperience(false)} label="처음이에요" />
                    <ChoiceButton selected={tried} onClick={() => chooseExperience(true)} label="마셔 본 적 있어요" />
                  </div>
                </section>
                <section className="font-sans">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">02.</span> 어디서 즐기실 건가요?
                  </h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <ChoiceButton selected={!atHome} onClick={() => choosePlace(false)} label="바에서 주문할래요" />
                    <ChoiceButton selected={atHome} onClick={() => choosePlace(true)} label="집에서 만들래요" hint="재료와 만드는 법까지 알려 드려요" />
                  </div>
                </section>
                <section className="font-sans">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">03.</span> 술을 넣을까요?
                  </h3>
                  <div className="flex flex-col gap-2 font-sans">
                    <ChoiceButton selected={!request.isNonAlcoholic} onClick={() => setRequest(prev => ({ ...prev, isNonAlcoholic: false }))} label="알코올 포함" />
                    <ChoiceButton selected={request.isNonAlcoholic} onClick={() => setRequest(prev => ({ ...prev, isNonAlcoholic: true }))} label="알코올 없이" />
                  </div>
                </section>
                {showStrength && (
                  <section className="font-sans">
                    <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                      <span className="text-red-800 text-xs font-sans">04.</span> 도수는 어느 정도로 할까요?
                    </h3>
                    <div className="flex flex-col gap-2 font-sans">
                      {strengthOptions.map((opt) => (
                        <ChoiceButton key={String(opt.value)} selected={(request.strength ?? null) === opt.value}
                          onClick={() => setRequest(prev => ({ ...prev, strength: opt.value }))} label={opt.label} hint={opt.hint} />
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* 3. 기주 선택 (무알콜이면 숨김) */}
              {hasBase && (
                <section className="animate-in fade-in slide-in-from-top-4 duration-500 font-sans border-t border-[#4a3728]/10 pt-6">
                  <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">{showStrength ? "05." : "04."}</span> 베이스 기주 지정
                  </h3>
                  <div className="flex flex-wrap gap-2 font-sans">
                    {baseSpiritOptions.map((spirit) => (
                      <button
                        key={spirit}
                        onClick={() => setRequest(prev => ({ ...prev, baseSpirit: spirit }))}
                        aria-pressed={request.baseSpirit === spirit}
                        className={`inline-flex min-h-11 items-center px-3 py-1.5 text-xs font-bold border transition-all font-sans ${
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
                        aria-pressed={request.baseSpirit === "기타(바틀지정)"}
                        className={`inline-flex min-h-11 items-center px-3 py-1.5 text-xs font-bold border transition-all font-sans ${
                          request.baseSpirit === "기타(바틀지정)" 
                            ? "bg-[#4a3728] text-[#efe2c9] border-[#4a3728]" 
                            : "bg-white/30 text-stone-700 border-[#4a3728]/20 hover:border-[#4a3728]"
                        }`}
                      >
                        기타 <span className="text-xs font-normal opacity-70">(바틀지정)</span>
                      </button>
                    )}
                  </div>

                  {request.experienceLevel === 'home_bar' && request.baseSpirit === "기타(바틀지정)" && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 font-sans">
                      <input
                        type="text"
                        value={customBottle}
                        onChange={(e) => setCustomBottle(e.target.value)}
                        aria-label="기주로 쓸 보틀명"
                        placeholder="기주로 선택할 명확한 보틀명을 입력해주세요."
                        className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-xs text-stone-800 outline-none placeholder:text-stone-400 font-sans"
                      />
                    </div>
                  )}
                </section>
              )}

              {request.isNonAlcoholic && (
                <p role="status" className="border-t border-[#4a3728]/10 pt-6 text-xs text-stone-600">무알콜 칵테일은 기주를 정하지 않고 만들어요.</p>
              )}

              {/* 4. 맛 선호 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                  <span className="text-red-800 text-xs font-sans">{num(4)}</span> 선호하는 맛 (다중 선택)
                </h3>
                <div className="flex flex-wrap gap-2 font-sans">
                  {tasteOptions.map((taste) => (
                    <button
                      key={taste}
                      onClick={() => toggleArrayItem('preferredTaste', taste)}
                      aria-pressed={request.preferredTaste.includes(taste)}
                      className={`inline-flex min-h-11 items-center px-3 py-1.5 text-xs font-bold border rounded-full transition-all font-sans ${
                        request.preferredTaste.includes(taste)
                          ? "bg-[#4a3728] text-[#efe2c9] border-[#4a3728]"
                          : "bg-white/30 text-stone-700 border-[#4a3728]/20 hover:border-[#4a3728]"
                      }`}
                    >
                      {taste.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </section>

              {/* 5. 탄산 유무 */}
              <section className="font-sans">
                <h3 className="text-base font-bold text-stone-800 mb-4 flex items-center gap-2 font-sans">
                  <span className="text-red-800 text-xs font-sans">{num(5)}</span> 탄산
                </h3>
                <div className="flex gap-8 font-sans">
                  {[
                    { label: "탄산 있음 (Sparkling)", value: true },
                    { label: "탄산 없음 (Still)", value: false },
                    { label: "상관없음 (Any)", value: null }
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setRequest(prev => ({ ...prev, carbonation: opt.value }))}
                        aria-pressed={request.carbonation === opt.value}
                      className="flex min-h-11 items-center gap-3 group font-sans"
                    >
                      <div className={`w-4 h-4 border border-[#4a3728] flex items-center justify-center transition-all ${request.carbonation === opt.value ? 'bg-[#4a3728]' : 'bg-transparent'}`}>
                        {request.carbonation === opt.value && (
                          <svg className="w-3 h-3 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs ${request.carbonation === opt.value ? 'font-bold' : 'font-medium'} text-stone-800 font-sans`}>
                        {opt.label.split(' (')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 6. 기피 재료 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">{num(6)}</span> 기피 재료
                  </h3>
                  <span className="text-xs text-stone-600 font-medium font-sans">{request.dislikes.length} / 8</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4 font-sans">
                  {commonDislikes.map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleArrayItem('dislikes', item)}
                      aria-pressed={request.dislikes.includes(item)}
                      className={`inline-flex min-h-11 items-center px-2.5 py-1 text-xs font-bold border transition-all font-sans ${
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
                    aria-label="그 외 기피 재료 직접 입력"
                    placeholder="그 외 기피하는 재료가 있다면 입력 후 엔터..."
                    className="w-full bg-transparent border-b border-dashed border-[#4a3728]/45 px-0 py-1 text-xs text-stone-800 outline-none placeholder:text-stone-400 font-sans"
                  />
                  <p className="mt-1 text-xs text-stone-600 font-sans">위 목록에서 고른 재료는 재료 목록으로 확인해 빼요. 직접 적은 재료는 확인하지 못할 수 있어요.</p>
                  <div className="flex flex-wrap gap-2 mt-2 font-sans">
                    {request.dislikes.filter(d => !commonDislikes.includes(d)).map(d => (
                       <span key={d} className="px-2 py-0.5 bg-red-800/10 text-red-800 border border-red-800/20 text-xs font-bold rounded flex items-center gap-1 font-sans">
                         {d} <button type="button" onClick={() => toggleArrayItem('dislikes', d)} aria-label={`${d} 제외 취소`} className="inline-flex min-h-11 min-w-11 items-center justify-center font-sans">✕</button>
                       </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* 7. 주문 메시지 */}
              <section className="font-sans border-t border-[#4a3728]/10 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-stone-800 flex items-center gap-2 font-sans">
                    <span className="text-red-800 text-xs font-sans">{num(7)}</span> 바텐더에게 남기는 메모 <span className="text-stone-600 text-xs font-normal">(선택)</span>
                  </h3>
                  <span className="text-xs text-stone-600 font-medium font-sans">{request.currentMood.length} / 100</span>
                </div>
                <textarea
                  className="w-full bg-transparent border-none px-0 py-1 text-sm leading-relaxed text-[#2d2017] outline-none placeholder:text-stone-400 resize-none min-h-[100px] font-medium font-sans"
                  placeholder="오늘의 기분, 날씨, 혹은 바텐더가 참고했으면 하는 특별한 요청 사항을 자유롭게 적어주세요..."
                  aria-label="바텐더에게 남기는 메모 (선택)"
                  value={request.currentMood}
                  maxLength={100}
                  onChange={(e) => setRequest(prev => ({ ...prev, currentMood: e.target.value }))}
                />
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-[#4a3728]/25 text-center font-sans">
              <div className="bg-yellow-600/5 border border-yellow-700/20 p-2.5 rounded mb-6 text-xs text-stone-800 leading-relaxed text-left font-sans">
                AI가 고른 추천이에요. 알레르기가 있다면 주문 전에 바텐더에게 꼭 확인해 주세요.
              </div>
              {!isAuthenticated && isInitialized && (
                <p role="status" className="mb-3 text-sm text-stone-700">로그인하면 추천을 받을 수 있어요. <a href="/login" onClick={saveDraft} className="inline-flex min-h-11 items-center font-semibold underline">로그인하러 가기</a></p>
              )}
              {recError && (
                <div role="alert" className="mb-3 rounded border border-red-800/30 bg-red-800/5 p-3 text-left text-sm text-stone-800">
                  <p>{recError.message}</p>
                  <p className="mt-1 text-xs text-stone-600">{recError.loginRequired ? "로그인하고 돌아오면 고르신 조건이 다시 채워져요." : "적어 두신 내용은 그대로 있어요."}</p>
                  {recError.loginRequired ? (
                    <a href="/login" onClick={saveDraft} className="mt-2 inline-flex min-h-11 items-center font-semibold underline">로그인하러 가기</a>
                  ) : recError.message === DAILY_LIMIT_MESSAGE ? (
                    <p className="mt-2 text-xs text-stone-600">내일 다시 이용할 수 있어요.</p>
                  ) : (
                    <button type="button" onClick={startRecommendation} className="mt-2 inline-flex min-h-11 items-center font-semibold underline">다시 시도</button>
                  )}
                </div>
              )}
              <button
                onClick={startRecommendation}
                disabled={!isAuthenticated || !isInitialized}
                className="min-h-11 w-[85%] mx-auto bg-[#111] text-white py-3 text-base font-bold hover:bg-black transition-all active:scale-[0.98] shadow-xl font-sans disabled:cursor-not-allowed disabled:opacity-60"
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

function ChoiceButton({ selected, onClick, label, hint }: { selected: boolean; onClick: () => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className="flex min-h-11 items-center gap-3 p-2 border border-[#4a3728]/30 rounded hover:bg-[#4a3728]/5 transition-colors text-left font-sans">
      <div className={`w-3.5 h-3.5 shrink-0 border border-[#4a3728] flex items-center justify-center transition-all ${selected ? 'bg-[#4a3728]' : 'bg-transparent'}`}>
        {selected && (
          <svg className="w-2.5 h-2.5 text-[#efe2c9]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
          </svg>
        )}
      </div>
      <span className={`text-xs ${selected ? 'font-bold' : 'font-medium'} text-stone-800 font-sans`}>
        {label}
        {hint && <span className="block text-xs font-normal text-stone-600">{hint}</span>}
      </span>
    </button>
  );
}
