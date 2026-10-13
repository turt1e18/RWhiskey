"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError } from "@/api/apiClient";
import { useAuthStore } from "@/store/authStore";
import type {
  WhiskeyCandidateRequest, WhiskeyExperienceLevel, WhiskeyFeedbackReason,
  WhiskeyFeedbackSentiment, WhiskeyFeedbackStage, WhiskeyFlavorPreference,
  WhiskeyProfile, WhiskeySmokePreference, WhiskeyVerifiedRecommendationResponse,
} from "@/type/ApiInterface";

type InputKey = "category" | "country" | "minAbv" | "maxAbv" |
  "preferredCategory" | "preferredCountry" | "preferredRegion" | "targetAbv";
type Inputs = Record<InputKey, string>;

const initialInputs: Inputs = {
  category: "", country: "", minAbv: "", maxAbv: "",
  preferredCategory: "", preferredCountry: "", preferredRegion: "", targetAbv: "",
};

const stateMessages: Record<WhiskeyVerifiedRecommendationResponse["state"], string> = {
  SUCCESS: "공식 근거와 병입 정보를 확인한 추천입니다.",
  DEGRADED: "기본 판정이 어려워 대체 제공자로 확인한 추천입니다.",
  CATALOG_NOT_READY: "아직 추천 가능한 검수 완료 위스키가 없습니다.",
  NO_MATCH: "현재 필수 조건에 맞는 검수 완료 위스키가 없습니다. 조건을 조정해 주세요.",
  NEEDS_CLARIFICATION: "요청 조건을 확인해 주세요. 도수 범위나 입력값이 맞지 않을 수 있습니다.",
  NEEDS_REVIEW: "검색 근거나 최종 판정이 충분하지 않아 추천을 보류했습니다.",
  UNAVAILABLE: "추천 서비스를 지금 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
};

const codeMessages: Record<string, string> = {
  PREVIEW_DISABLED: "서버의 검수 기반 추천 미리보기가 아직 활성화되지 않았습니다.",
  DATA_SOURCE_UNAVAILABLE: "추천 데이터를 지금 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
  SEARCH_UNAVAILABLE: "공식 검색 결과를 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
  MODEL_VERIFICATION_UNAVAILABLE: "최종 검수 모델을 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
};

const reasonMessages: Record<string, string> = {
  PREFERRED_CATEGORY: "선호 분류에 맞음",
  PREFERRED_COUNTRY: "선호 국가에 맞음",
  PREFERRED_REGION: "선호 지역에 맞음",
  TARGET_ABV_NEAR: "선호 도수와 가까움",
  RECENT_BOTTLING_PENALTY: "최근 병입 반복을 고려함",
  RECENT_PRODUCT_PENALTY: "최근 제품 반복을 고려함",
  OFFICIAL_FACTS_MATCH: "공식 근거와 병입 정보가 일치함",
  BEGINNER_CORE: "입문 시 살펴보기 쉬운 정규 제품",
  PREFERRED_SWEET: "선호한 달콤한 풍미와 맞음",
  PREFERRED_FRUITY: "선호한 과일 풍미와 맞음",
  TASTE_FEEDBACK_MATCH: "실제로 마신 평가와 비슷한 풍미",
  TASTE_FEEDBACK_AVOIDED: "실제 음용 평가를 반영함",
};

const defaultProfile: WhiskeyProfile = {
  experienceLevel: "BEGINNER", smokePreference: "UNKNOWN", preferredFlavor: "UNKNOWN",
};
const levelLabels: Record<WhiskeyExperienceLevel, string> = {
  BEGINNER: "초심자", INTERMEDIATE: "중급", ADVANCED: "상급",
};
const smokeOptions: { value: WhiskeySmokePreference; label: string }[] = [
  { value: "UNKNOWN", label: "잘 모르겠어요" },
  { value: "ALLOW", label: "괜찮아요" },
  { value: "AVOID", label: "피하고 싶어요" },
];
const flavorOptions: { value: WhiskeyFlavorPreference; label: string }[] = [
  { value: "UNKNOWN", label: "잘 모르겠어요" },
  { value: "SWEET", label: "달콤함" },
  { value: "FRUITY", label: "과일 향" },
];

function isVerifiedResponse(value: unknown): value is WhiskeyVerifiedRecommendationResponse {
  if (typeof value !== "object" || value === null || !("state" in value)) return false;
  return typeof value.state === "string" && value.state in stateMessages &&
    "reasonCodes" in value && Array.isArray(value.reasonCodes);
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export default function VerifiedWhiskeyPreviewPage() {
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [result, setResult] = useState<WhiskeyVerifiedRecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WhiskeyProfile>(defaultProfile);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [includeIndependentBottlings, setIncludeIndependentBottlings] = useState(false);
  const [includeOldBottles, setIncludeOldBottles] = useState(false);
  const [feedbackStage, setFeedbackStage] = useState<WhiskeyFeedbackStage>("EXPECTED");
  const [feedbackSentiment, setFeedbackSentiment] = useState<WhiskeyFeedbackSentiment>("NEUTRAL");
  const [feedbackReason, setFeedbackReason] = useState<WhiskeyFeedbackReason>("NONE");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const detailedConditionsRef = useRef<HTMLDetailsElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackBusy = useRef(false);
  const busy = useRef(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const enabled = process.env.NEXT_PUBLIC_WHISKEY_V2_ENABLED === "true";
  const todayStr = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    if (enabled && !isInitialized) void fetchUser();
  }, [enabled, isInitialized, fetchUser]);

  useEffect(() => {
    if (!enabled || !isInitialized || !isAuthenticated) return;
    let active = true;
    void recommendationApi.getWhiskeyProfile()
      .then((saved) => { if (active) setProfile(saved); })
      .catch(() => { if (active) setProfileStatus("저장된 취향을 불러오지 못했습니다. 현재 선택으로 추천할 수 있습니다."); });
    return () => { active = false; };
  }, [enabled, isInitialized, isAuthenticated]);

  useEffect(() => {
    if (result) resultHeadingRef.current?.focus();
  }, [result]);

  async function saveProfile() {
    if (busy.current || !isAuthenticated) return;
    setProfileStatus(null);
    try {
      setProfile(await recommendationApi.updateWhiskeyProfile(profile));
      setProfileStatus("기본 취향을 저장했습니다.");
    } catch {
      setProfileStatus("기본 취향을 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async function sendFeedback() {
    const id = result?.recommendationId;
    if (!id || !Number.isSafeInteger(id) || feedbackBusy.current) return;
    feedbackBusy.current = true;
    setFeedbackLoading(true);
    setFeedbackStatus(null);
    try {
      await recommendationApi.submitWhiskeyFeedback(id, {
        stage: feedbackStage, sentiment: feedbackSentiment, reason: feedbackReason,
      });
      setFeedbackStatus("평가를 저장했습니다. 같은 단계의 평가는 다시 저장해 수정할 수 있습니다.");
    } catch {
      setFeedbackStatus("평가를 저장하지 못했습니다. 로그인 상태를 확인하고 다시 시도해 주세요.");
    } finally {
      feedbackBusy.current = false;
      setFeedbackLoading(false);
    }
  }

  function update(key: InputKey, value: string) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  const hasDetailedConditions = profile.experienceLevel !== "BEGINNER";
  const activeDetailedInputCount = hasDetailedConditions
    ? Object.values(inputs).filter((value) => value.trim() !== "").length : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !enabled) return;
    setError(null);
    setResult(null);
    setFeedbackStatus(null);

    if (!isAuthenticated) {
      setError("로그인 후 검수 기반 추천을 이용할 수 있습니다.");
      return;
    }

    const minAbv = hasDetailedConditions ? optionalNumber(inputs.minAbv) : undefined;
    const maxAbv = hasDetailedConditions ? optionalNumber(inputs.maxAbv) : undefined;
    const targetAbv = hasDetailedConditions ? optionalNumber(inputs.targetAbv) : undefined;
    if (hasDetailedConditions && ([minAbv, maxAbv, targetAbv].some((value) => value !== undefined &&
      (!Number.isFinite(value) || value < 0 || value > 100)) ||
      (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv))) {
      if (detailedConditionsRef.current) detailedConditionsRef.current.open = true;
      setError("도수는 0~100 사이로 입력하고 최솟값이 최댓값보다 크지 않게 해주세요.");
      return;
    }

    const request: WhiskeyCandidateRequest = {
      requirements: hasDetailedConditions ? {
        ...(inputs.category.trim() && { category: inputs.category.trim() }),
        ...(inputs.country.trim() && { country: inputs.country.trim() }),
        ...(minAbv !== undefined && { minAbv }),
        ...(maxAbv !== undefined && { maxAbv }),
      } : {},
      context: hasDetailedConditions ? {
        ...(inputs.preferredCategory.trim() && { preferredCategory: inputs.preferredCategory.trim() }),
        ...(inputs.preferredCountry.trim() && { preferredCountry: inputs.preferredCountry.trim() }),
        ...(inputs.preferredRegion.trim() && { preferredRegion: inputs.preferredRegion.trim() }),
        ...(targetAbv !== undefined && { targetAbv }),
      } : {},
      limit: 3,
      experienceLevel: profile.experienceLevel,
      smokePreference: profile.smokePreference,
      preferredFlavor: profile.preferredFlavor,
      includeIndependentBottlings: profile.experienceLevel === "INTERMEDIATE" && includeIndependentBottlings,
      includeOldBottles: profile.experienceLevel === "INTERMEDIATE" && includeOldBottles,
    };

    busy.current = true;
    setLoading(true);
    try {
      const response = await recommendationApi.getVerifiedPreview(request);
      if (!isVerifiedResponse(response) ||
        ((response.state === "SUCCESS" || response.state === "DEGRADED") &&
          (!response.selected || !response.evidenceUrl?.startsWith("https://") ||
            !Number.isSafeInteger(response.recommendationId) || (response.recommendationId ?? 0) <= 0))) {
        setError("검수 결과 형식을 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.");
        return;
      }
      setResult(response);

    } catch (caught) {
      if (caught instanceof ApiResponseError && caught.status === 401) {
        setError("로그인 상태가 만료됐습니다. 다시 로그인해 주세요.");
      } else if (caught instanceof ApiResponseError && caught.status === 403) {
        setError("요청 인증에 실패했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.");
      } else if (caught instanceof ApiResponseError && isVerifiedResponse(caught.data)) {
        setResult(caught.data);
      } else if (caught instanceof ApiResponseError && caught.status === 503) {
        setError("공식 검색이나 최종 검수를 지금 완료할 수 없습니다. 잠시 뒤 다시 시도해 주세요.");
      } else if (caught instanceof ApiResponseError && caught.status >= 500) {
        setError("추천 처리 중 서버 오류가 발생했습니다. 잠시 뒤 다시 시도해 주세요.");
      } else if (caught instanceof ApiResponseError) {
        setError("요청을 처리하지 못했습니다. 선택한 조건을 확인해 주세요.");
      } else {
        setError("연결에 실패했습니다. 잠시 뒤 다시 시도해 주세요.");
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const selected = result?.state === "SUCCESS" || result?.state === "DEGRADED" ? result.selected : null;
  const appliedLevel = result?.appliedLevel;
  const displayedReasons = result?.reasonCodes.map((code) => reasonMessages[code])
    .filter((message): message is string => Boolean(message)) ?? [];
  const beginnerReasons = displayedReasons.filter((message) =>
    message !== reasonMessages.RECENT_BOTTLING_PENALTY &&
    message !== reasonMessages.RECENT_PRODUCT_PENALTY).slice(0, 2);
  const beginnerFlavorNotice = selected?.details?.smokeLevel == null
    ? "연기 향 정보는 아직 확인되지 않았습니다."
    : selected.details.smokeLevel > 0
      ? "연기 향이 확인된 제품입니다. 연기 향을 피하고 싶다면 선택을 바꿔 다시 추천받으세요."
      : selected.details.spiceLevel != null && selected.details.spiceLevel > 0
        ? "향신료 풍미가 확인된 제품입니다."
        : "확인된 연기 향은 없습니다.";
  const evidenceUrl = result?.evidenceUrl?.startsWith("https://") ? result.evidenceUrl : null;
  const availability = selected?.details;
  const availabilityLabel = availability?.availabilityStatus === "AVAILABLE" ? "판매 확인" :
    availability?.availabilityStatus === "SOLD_OUT" ? "품절 확인" :
      availability?.availabilityStatus === "DISCONTINUED" ? "단종 확인" : "미확인";
  const availabilityContext = availability?.availabilitySeller && availability.availabilityRegion &&
    availability.availabilityCheckedAt ?
    `${availability.availabilitySeller} · ${availability.availabilityRegion} · ${new Date(availability.availabilityCheckedAt).toLocaleDateString("ko-KR")} 기준` : null;
  const fieldChoiceClass = (active: boolean) => `cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a3728] ${
    active ? "border-[#2d2017] bg-[#4a3728]/10 font-bold text-[#2d2017]" :
      "border-[#4a3728]/30 bg-white/20 text-stone-700 hover:border-[#4a3728]/60"
  }`;

  return (
    <main className="min-h-screen bg-[#1a120d] text-stone-100 selection:bg-amber-200/30">
      <nav className={`mx-auto flex w-full items-center px-6 py-4 ${selected ? "max-w-2xl" : "max-w-5xl"}`}>
        {selected ? (
          <button type="button" onClick={() => setResult(null)} className="flex items-center gap-2 text-sm font-light text-stone-500 transition-colors hover:text-white">
            <span aria-hidden="true" className="text-xl leading-none">‹</span> 뒤로가기
          </button>
        ) : (
          <Link href="/mood" className="flex items-center gap-2 text-sm font-light text-stone-500 transition-colors hover:text-white">
            <span aria-hidden="true" className="text-xl leading-none">‹</span> 뒤로가기
          </Link>
        )}
      </nav>

      {!enabled ? (
        <p className="mx-auto mt-10 max-w-2xl rounded border border-stone-700 bg-[#241b16] p-5 text-sm">현재 검수 기반 추천을 사용할 수 없습니다.</p>
      ) : !selected ? (
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 pb-12 pt-4 md:min-h-[calc(100vh-72px)] md:grid-cols-2 md:gap-12">
          <header className="flex flex-col justify-center space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-300/80">Whiskey Recommendation</p>
            <h1 className="font-serif text-2xl font-bold leading-tight text-white md:text-4xl">오늘의 취향에 맞는<br />위스키를 찾아보세요</h1>
            <p className="max-w-md text-sm leading-6 text-stone-400 md:text-base">위스키 경험과 선호하는 향을 고르면 확인된 병입 중에서 오늘의 한 잔을 추천해드립니다.</p>
            {profile.experienceLevel !== "BEGINNER" && <p className="max-w-md text-sm leading-6 text-stone-500">익숙한 취향이 있다면 주문서에서 조건을 더 구체적으로 선택할 수 있습니다.</p>}
          </header>
          <form onSubmit={submit} noValidate className="relative mx-auto w-full max-w-[550px] overflow-hidden rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] md:max-h-[90vh] md:overflow-y-auto md:p-8">
            <div className="pointer-events-none absolute inset-2 border border-[#4a3728]/20" />
            <div className="relative mb-5 flex items-center justify-between text-[12px] font-bold tracking-[0.2em] text-stone-700">
              <span>R-WHISKEY</span>
              <span>{todayStr}</span>
            </div>
            <div className="relative mb-6 text-center">
              <h2 className="inline-block border border-[#4a3728] bg-white/10 px-3 py-1 text-[13px] font-bold tracking-widest text-[#2d2017]">오늘의 주문</h2>
            </div>
            <div className="relative">
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">위스키 경험 단계</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                    <label key={level} className={fieldChoiceClass(profile.experienceLevel === level)}>
                      <input type="radio" name="experienceLevel" checked={profile.experienceLevel === level}
                        onChange={() => setProfile((current) => ({ ...current, experienceLevel: level }))} className="sr-only" />
                      {levelLabels[level]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="mt-4 text-sm text-stone-700">
                {profile.experienceLevel === "BEGINNER" ? "처음이라면 아래 두 가지만 골라도 됩니다. 잘 모르겠다면 그대로 추천받으세요." :
                  profile.experienceLevel === "INTERMEDIATE" ? "알고 있는 취향만 고르고, 필요하면 아래 조건으로 더 구체화하세요. 모르는 항목은 비워두어도 됩니다." :
                    "병입 유형과 검수된 세부 정보를 함께 살펴봅니다. 모르는 취향은 비워두어도 됩니다."}
              </p>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{profile.experienceLevel === "BEGINNER" ? "연기 향이 나도 괜찮나요?" :
                  profile.experienceLevel === "INTERMEDIATE" ? "연기 향 선호" : "피트·연기 향 허용"}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {smokeOptions.map((option) => <label key={option.value} className={fieldChoiceClass(profile.smokePreference === option.value)}>
                    <input type="radio" name="smokePreference" value={option.value} checked={profile.smokePreference === option.value}
                      onChange={() => setProfile((current) => ({ ...current, smokePreference: option.value }))} className="sr-only" />
                    {option.label}
                  </label>)}
                </div>
              </fieldset>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{profile.experienceLevel === "BEGINNER" ? "어떤 향이 끌리나요?" :
                  profile.experienceLevel === "INTERMEDIATE" ? "주요 풍미 선호" : "우선 살필 풍미"}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {flavorOptions.map((option) => <label key={option.value} className={fieldChoiceClass(profile.preferredFlavor === option.value)}>
                    <input type="radio" name="preferredFlavor" value={option.value} checked={profile.preferredFlavor === option.value}
                      onChange={() => setProfile((current) => ({ ...current, preferredFlavor: option.value }))} className="sr-only" />
                    {option.label}
                  </label>)}
                </div>
              </fieldset>
              <button type="button" onClick={() => void saveProfile()} disabled={!isAuthenticated}
                className="mt-4 text-sm font-semibold text-[#4a3728] underline disabled:opacity-50">이 선택을 기본 취향으로 저장</button>
              {profileStatus && <p role="status" className="mt-2 text-xs text-stone-700">{profileStatus}</p>}
              {profile.experienceLevel === "INTERMEDIATE" && <fieldset className="mt-6 border-t border-[#4a3728]/25 pt-4">
                <legend className="px-1 text-sm font-bold">병입 유형 넓히기</legend>
                <p className="mb-3 text-xs text-stone-600">선택하면 공식 근거로 검수된 특수 병입도 후보에 포함합니다. 구매 가능 여부는 별도로 확인해야 합니다.</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeIndependentBottlings}
                    onChange={(event) => setIncludeIndependentBottlings(event.target.checked)} />독립 병입 포함</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeOldBottles}
                    onChange={(event) => setIncludeOldBottles(event.target.checked)} />올드바틀 포함</label>
                </div>
              </fieldset>}
              {profile.experienceLevel === "ADVANCED" && <div className="mt-6 border-t border-[#4a3728]/25 pt-4 text-sm">
                <p className="font-bold">독립 병입 · 올드바틀 기본 포함</p>
                <p className="mt-1 text-xs leading-5 text-stone-700">검수된 병입만 후보에 포함합니다. 단종이나 재고는 확인되지 않으면 결과에 미확인으로 표시합니다.</p>
              </div>}
              {hasDetailedConditions && <details key={profile.experienceLevel} ref={detailedConditionsRef}
                open className="mt-8 border-t border-[#4a3728]/25 pt-4">
              <summary className="cursor-pointer font-serif text-xl font-bold">취향과 상세 조건
                {activeDetailedInputCount > 0 && <span className="ml-2 text-sm font-normal">적용 중 {activeDetailedInputCount}개</span>}
              </summary>
              <h3 className="mt-6 text-sm font-bold">필수 조건</h3>
              <p className="mt-2 text-xs text-stone-600">필수 조건은 일치하는 병입만 남깁니다. 비워두면 제한하지 않습니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="필수 분류" value={inputs.category} onChange={(value) => update("category", value)} placeholder="예: Single Malt" />
                <Field label="필수 국가" value={inputs.country} onChange={(value) => update("country", value)} placeholder="예: Scotland" />
                <Field label="최소 도수 (%)" value={inputs.minAbv} onChange={(value) => update("minAbv", value)} type="number" />
                <Field label="최대 도수 (%)" value={inputs.maxAbv} onChange={(value) => update("maxAbv", value)} type="number" />
              </div>
              <h3 className="mt-8 text-sm font-bold">선호 조건</h3>
              <p className="mt-2 text-xs text-stone-600">선호 조건은 후보를 제외하지 않고 순위에 반영합니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="선호 분류" value={inputs.preferredCategory} onChange={(value) => update("preferredCategory", value)} placeholder="예: Single Malt" />
                <Field label="선호 국가" value={inputs.preferredCountry} onChange={(value) => update("preferredCountry", value)} placeholder="예: Scotland" />
                <Field label="선호 지역" value={inputs.preferredRegion} onChange={(value) => update("preferredRegion", value)} placeholder="예: Speyside" />
                <Field label="선호 도수 (%)" value={inputs.targetAbv} onChange={(value) => update("targetAbv", value)} type="number" />
              </div>
              </details>}
              {error && <p role="alert" className="mt-5 rounded border border-red-700/30 bg-red-100 p-3 text-sm text-red-900">{error}</p>}
              {result && <p role="status" className="mt-5 rounded border border-[#4a3728]/25 bg-white/30 p-3 text-sm leading-6 text-stone-800">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}
              {!isAuthenticated && isInitialized && <Link href="/login" className="mt-4 block text-sm font-semibold underline">로그인하러 가기</Link>}
              <button type="submit" disabled={loading || !isAuthenticated || !isInitialized}
                className="mt-7 w-full bg-[#111] px-5 py-3 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "병입 정보를 확인하는 중…" : "위스키 추천 받기"}
              </button>
              </div>
            </form>
        </div>
      ) : (
        <section aria-live="polite" className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-12 pt-4">
          <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">오늘의 추천 결과</h2>
          {result && <p role="status" className="mb-5 text-center text-sm leading-6 text-stone-400">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}

          {result && <article className="relative flex w-full max-w-md flex-col items-center rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 pt-12 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:p-10 md:pt-14">
                  <div className="absolute inset-x-7 top-5 flex justify-between text-[10px] font-bold tracking-widest text-stone-600 md:inset-x-10">
                    <span>No. {String(result.recommendationId).padStart(3, "0")}</span>
                    <span>{todayStr}</span>
                  </div>
                  <p className="mb-4 border border-[#4a3728] px-3 py-1 text-[10px] font-bold tracking-[0.2em]">오늘의 추천</p>
                  <p className="text-center text-[11px] font-semibold tracking-widest text-stone-600">{selected.category || "위스키"} · {levelLabels[result.appliedLevel ?? profile.experienceLevel]}</p>
                  <h3 className="mt-6 text-center font-serif text-2xl font-bold leading-tight">{selected.displayName}</h3>
                  <p className="mt-3 text-center text-xs text-stone-600">{result.state === "DEGRADED" ? "대체 제공자로 확인" : "공식 근거로 확인"}</p>
                  {(selected.details?.independentBottling === true || selected.details?.oldBottle === true) && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
                      {selected.details.independentBottling === true && <span className="rounded-full border border-[#4a3728]/30 px-3 py-1 text-[#4a3728]">독립 병입</span>}
                      {selected.details.oldBottle === true && <span className="rounded-full border border-[#4a3728]/30 px-3 py-1 text-[#4a3728]">올드바틀</span>}
                    </div>
                  )}
                  {appliedLevel === "BEGINNER" && <p className="mt-7 w-full border-t border-[#4a3728]/25 pt-4 text-sm leading-6">{beginnerFlavorNotice}</p>}
                  {appliedLevel === "INTERMEDIATE" && <p className="mt-7 w-full border-t border-[#4a3728]/25 pt-4 text-sm leading-6">
                    {result.reasonCodes.some((code) => code === "TASTE_FEEDBACK_MATCH" || code === "TASTE_FEEDBACK_AVOIDED")
                      ? "실제로 마신 뒤 남긴 맛 평가를 이번 순위에 반영했습니다."
                      : "이번에 선택한 조건과 확인된 병입 정보를 기준으로 추천했습니다."}
                  </p>}
                  <dl className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-[#4a3728]/25 pt-4 text-sm">
                    <Fact label="분류" value={selected.category} />
                    <Fact label="국가" value={selected.country} />
                    <Fact label="지역" value={selected.region} />
                    <Fact label="병입 구분" value={selected.edition} />
                    <Fact label="도수" value={selected.abv === null ? null : `${selected.abv}%`} />
                    <Fact label="용량" value={selected.volumeMl === null ? null : `${selected.volumeMl}ml`} />
                    <Fact label="연산" value={selected.ageStatementType === "NUMBERED" && selected.ageYears !== null ? `${selected.ageYears}년` : selected.ageStatementType === "NAS" ? "NAS" : null} />
                    {appliedLevel === "ADVANCED" && selected.details?.bottlerName && <Fact label="병입사" value={selected.details.bottlerName} />}
                    {appliedLevel === "ADVANCED" && selected.details?.bottledYear && <Fact label="병입 연도" value={`${selected.details.bottledYear}년`} />}
                    {appliedLevel === "ADVANCED" && <Fact label="독립 병입" value={selected.details?.independentBottling == null ? null :
                      selected.details.independentBottling ? "해당" : "아님"} />}
                    {appliedLevel === "ADVANCED" && <Fact label="올드바틀" value={selected.details?.oldBottle == null ? null :
                      selected.details.oldBottle ? "해당" : "아님"} />}
                  </dl>
                  {appliedLevel !== "ADVANCED" && (selected.details?.bottlerName || selected.details?.bottledYear) && (
                    <details className="mt-4 w-full text-sm"><summary className="cursor-pointer font-semibold">병입 세부 정보 보기</summary>
                      <p className="mt-2">{[selected.details.bottlerName, selected.details.bottledYear ? `${selected.details.bottledYear}년 병입` : null]
                        .filter(Boolean).join(" · ")}</p>
                    </details>
                  )}
                  <p className="mt-5 w-full text-xs text-stone-700">구매 가능 여부: {availabilityLabel}{availabilityContext ? ` (${availabilityContext})` : ""}</p>
                  <div className="mt-6 w-full border-t border-[#4a3728]/25 pt-4">
                    <p className="text-[11px] font-bold tracking-widest text-stone-800">추천 이유</p>
                    <ul className="mt-2 list-inside list-disc text-sm leading-6">
                      {(appliedLevel === "BEGINNER" ? beginnerReasons : displayedReasons).map((message) => <li key={message}>{message}</li>)}
                    </ul>
                  </div>
                  <div className="mt-5 flex w-full flex-wrap gap-x-4 gap-y-2 border-t border-[#4a3728]/25 pt-4">
                    {evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#4a3728] underline">확인된 공식 근거 보기 ↗</a>}
                    {selected.details?.characteristicsEvidenceUrl?.startsWith("https://") &&
                      selected.details.characteristicsEvidenceUrl !== evidenceUrl &&
                      <a href={selected.details.characteristicsEvidenceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-[#4a3728] underline">풍미·병입 근거 보기 ↗</a>}
                  </div>
                  <div className="mt-7 w-full border-t border-[#4a3728]/25 pt-4 text-center">
                    <span className="text-[9px] font-bold uppercase italic tracking-widest text-stone-600">R-Whiskey Selection</span>
                  </div>
                </article>}
              {result?.recommendationId && (
                <div className="mt-6 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#241b16] p-5">
                  <h3 className="font-semibold">이 추천 평가하기</h3>
                  <p className="mt-1 text-xs text-stone-400">예상과 실제 음용 평가는 따로 저장됩니다. 실제 맛 평가만 다음 풍미 추천에 반영됩니다.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs">평가 시점<select value={feedbackStage} onChange={(event) => setFeedbackStage(event.target.value as WhiskeyFeedbackStage)}
                      className="mt-1 w-full rounded bg-white px-2 py-2 text-sm text-stone-900"><option value="EXPECTED">마시기 전 기대</option><option value="CONSUMED">실제 마신 후</option></select></label>
                    <label className="text-xs">평가<select value={feedbackSentiment} onChange={(event) => setFeedbackSentiment(event.target.value as WhiskeyFeedbackSentiment)}
                      className="mt-1 w-full rounded bg-white px-2 py-2 text-sm text-stone-900"><option value="LIKE">좋아요</option><option value="NEUTRAL">보통</option><option value="DISLIKE">별로예요</option></select></label>
                    <label className="text-xs">이유<select value={feedbackReason} onChange={(event) => setFeedbackReason(event.target.value as WhiskeyFeedbackReason)}
                      className="mt-1 w-full rounded bg-white px-2 py-2 text-sm text-stone-900"><option value="NONE">선택 안 함</option><option value="TASTE">맛·향</option><option value="PRICE">가격</option><option value="AVAILABILITY">구매 어려움</option><option value="OTHER">기타</option></select></label>
                  </div>
                  <button type="button" onClick={() => void sendFeedback()} disabled={feedbackLoading} className="mt-4 w-full bg-[#111] px-4 py-3 text-sm font-bold tracking-wider text-white hover:bg-[#4a3728] disabled:cursor-not-allowed disabled:opacity-50">{feedbackLoading ? "저장 중…" : "평가 저장"}</button>
                  {feedbackStatus && <p role="status" className="mt-2 text-sm">{feedbackStatus}</p>}
                </div>
              )}
        </section>
      )}
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: "text" | "number";
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type}
        min={type === "number" ? 0 : undefined} max={type === "number" ? 100 : undefined}
        step={type === "number" ? "any" : undefined} maxLength={type === "text" ? 100 : undefined}
        placeholder={placeholder}
        className="mt-2 w-full rounded border border-stone-500/60 bg-white/70 px-3 py-2 text-sm font-normal text-stone-900 outline-none focus:border-amber-700" />
    </label>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs text-stone-600">{label}</dt><dd className="mt-1 font-medium">{value || "미확인"}</dd></div>;
}
