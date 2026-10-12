"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
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

  const activeDetailedInputCount = Object.values(inputs).filter((value) => value.trim() !== "").length;

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

    const minAbv = optionalNumber(inputs.minAbv);
    const maxAbv = optionalNumber(inputs.maxAbv);
    const targetAbv = optionalNumber(inputs.targetAbv);
    if ([minAbv, maxAbv, targetAbv].some((value) => value !== undefined &&
      (!Number.isFinite(value) || value < 0 || value > 100)) ||
      (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv)) {
      if (detailedConditionsRef.current) detailedConditionsRef.current.open = true;
      setError("도수는 0~100 사이로 입력하고 최솟값이 최댓값보다 크지 않게 해주세요.");
      return;
    }

    const request: WhiskeyCandidateRequest = {
      requirements: {
        ...(inputs.category.trim() && { category: inputs.category.trim() }),
        ...(inputs.country.trim() && { country: inputs.country.trim() }),
        ...(minAbv !== undefined && { minAbv }),
        ...(maxAbv !== undefined && { maxAbv }),
      },
      context: {
        ...(inputs.preferredCategory.trim() && { preferredCategory: inputs.preferredCategory.trim() }),
        ...(inputs.preferredCountry.trim() && { preferredCountry: inputs.preferredCountry.trim() }),
        ...(inputs.preferredRegion.trim() && { preferredRegion: inputs.preferredRegion.trim() }),
        ...(targetAbv !== undefined && { targetAbv }),
      },
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

  return (
    <main className="min-h-screen bg-[#1a120d] px-5 py-8 text-stone-100 md:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/mood" className="text-sm text-amber-200 hover:underline">← 기존 추천으로 돌아가기</Link>
        <header className="mt-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300">VERIFIED WHISKEY PREVIEW</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">검수 기반 위스키 추천</h1>
          <p className="mt-4 text-sm leading-6 text-stone-300">필수 조건으로 후보를 찾고, 선호 조건으로 순서를 정한 뒤 공식 근거와 모델 판정을 확인합니다.</p>
          <p className="mt-2 text-xs leading-5 text-stone-400">검수된 추천 이력과 간단한 평가를 기록하는 로컬 미리보기입니다. 기존 시음 노트와는 아직 연결되지 않습니다.</p>
        </header>

        {!enabled ? (
          <p className="mt-10 rounded-lg border border-stone-700 bg-stone-900 p-5 text-sm">현재 검수 기반 추천 미리보기가 꺼져 있습니다.</p>
        ) : (
          <div className={selected ? "mx-auto mt-8 max-w-2xl" : "mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]"}>
            {!selected && <form onSubmit={submit} noValidate className="rounded-lg border border-amber-900/50 bg-[#e9dcc1] p-5 text-stone-900 shadow-xl md:p-7">
              <h2 className="font-serif text-xl font-bold">추천 조건</h2>
              <p className="mt-2 text-xs text-stone-600">레벨에 따라 먼저 보여 주는 질문과 결과 설명이 달라집니다. 상세 조건은 언제든 사용할 수 있습니다.</p>
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">위스키 경험 단계</legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                    <label key={level} className={`cursor-pointer rounded border px-2 py-3 text-center text-sm ${profile.experienceLevel === level ? "border-amber-900 bg-amber-100 font-bold" : "border-stone-400 bg-white/50"}`}>
                      <input type="radio" name="experienceLevel" checked={profile.experienceLevel === level}
                        onChange={() => setProfile((current) => ({ ...current, experienceLevel: level }))} className="sr-only" />
                      {levelLabels[level]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <p className="mt-4 text-sm text-stone-700">
                {profile.experienceLevel === "BEGINNER" ? "처음이라면 아래 두 가지만 골라도 됩니다. 잘 모르겠다면 그대로 추천받으세요." :
                  profile.experienceLevel === "INTERMEDIATE" ? "끌리는 풍미를 고르고, 아래 선호 조건으로 취향을 더 구체화할 수 있습니다." :
                    "병입 유형까지 살펴보며 추천합니다. 독립 병입과 올드바틀도 기본 후보에 포함됩니다."}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">연기 향
                  <select value={profile.smokePreference} onChange={(event) => setProfile((current) => ({
                    ...current, smokePreference: event.target.value as WhiskeySmokePreference,
                  }))} className="mt-2 block w-full rounded border border-stone-500 bg-white/70 px-3 py-2 font-normal">
                    <option value="UNKNOWN">잘 모르겠어요</option><option value="ALLOW">괜찮아요</option><option value="AVOID">피하고 싶어요</option>
                  </select>
                </label>
                <label className="text-sm font-semibold">끌리는 풍미
                  <select value={profile.preferredFlavor} onChange={(event) => setProfile((current) => ({
                    ...current, preferredFlavor: event.target.value as WhiskeyFlavorPreference,
                  }))} className="mt-2 block w-full rounded border border-stone-500 bg-white/70 px-3 py-2 font-normal">
                    <option value="UNKNOWN">잘 모르겠어요</option><option value="SWEET">달콤함</option><option value="FRUITY">과일 향</option>
                  </select>
                </label>
              </div>
              <button type="button" onClick={() => void saveProfile()} disabled={!isAuthenticated}
                className="mt-3 text-sm font-semibold text-amber-950 underline disabled:opacity-50">이 선택을 기본 취향으로 저장</button>
              {profileStatus && <p role="status" className="mt-2 text-xs text-stone-700">{profileStatus}</p>}
              {profile.experienceLevel === "INTERMEDIATE" && <fieldset className="mt-6 rounded border border-stone-400/70 bg-white/40 p-4">
                <legend className="px-1 text-sm font-bold">병입 유형 넓히기</legend>
                <p className="mb-3 text-xs text-stone-600">선택하면 공식 근거로 검수된 특수 병입도 후보에 포함합니다. 구매 가능 여부는 별도로 확인해야 합니다.</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeIndependentBottlings}
                    onChange={(event) => setIncludeIndependentBottlings(event.target.checked)} />독립 병입 포함</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeOldBottles}
                    onChange={(event) => setIncludeOldBottles(event.target.checked)} />올드바틀 포함</label>
                </div>
              </fieldset>}
              {profile.experienceLevel === "ADVANCED" && <div className="mt-6 rounded border border-amber-800/40 bg-amber-100/70 p-4 text-sm">
                <p className="font-bold">독립 병입 · 올드바틀 기본 포함</p>
                <p className="mt-1 text-xs leading-5 text-stone-700">검수된 병입만 후보에 포함합니다. 단종이나 재고는 확인되지 않으면 결과에 미확인으로 표시합니다.</p>
              </div>}
              <details key={profile.experienceLevel} ref={detailedConditionsRef}
                open={profile.experienceLevel !== "BEGINNER" || activeDetailedInputCount > 0} className="mt-8">
              <summary className="cursor-pointer font-serif text-xl font-bold">{profile.experienceLevel === "BEGINNER" ? "상세 조건 선택" : "취향과 상세 조건"}
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
              </details>
              {error && <p role="alert" className="mt-5 rounded border border-red-700/30 bg-red-100 p-3 text-sm text-red-900">{error}</p>}
              {!isAuthenticated && isInitialized && <Link href="/login" className="mt-4 block text-sm font-semibold underline">로그인하러 가기</Link>}
              <button type="submit" disabled={loading || !isAuthenticated || !isInitialized}
                className="mt-7 w-full rounded bg-[#2b1b10] px-5 py-3 font-semibold text-white hover:bg-[#50311d] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "공식 근거와 병입 정보를 확인하는 중…" : "검수 기반 추천 받기"}
              </button>
            </form>}

            <section aria-live="polite" className={selected ? "mx-auto w-full" : "rounded-lg border border-stone-700 bg-[#241b16] p-5 shadow-xl md:p-7"}>
              {selected && <button type="button" onClick={() => setResult(null)}
                className="mb-6 text-sm text-amber-200 hover:underline">← 조건 다시 고르기</button>}
              <h2 ref={resultHeadingRef} tabIndex={-1} className={selected ? "mb-5 text-center font-serif text-2xl font-bold" : "font-serif text-xl font-bold"}>
                {selected ? "오늘의 검수 추천" : "추천 결과"}
              </h2>
              {!result && !loading && <p className="mt-5 text-sm text-stone-400">조건을 입력하고 추천을 요청하면 이곳에 결과가 표시됩니다.</p>}
              {loading && <p className="mt-5 text-sm text-amber-200">검수된 후보를 확인하고 있습니다. 중복 요청은 보내지 않습니다.</p>}
              {result && <p role="status" className="mt-5 text-sm leading-6 text-stone-200">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}
              {selected && result && (
                <article className="relative mx-auto mt-6 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 pt-12 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:p-10 md:pt-14">
                  <div className="absolute inset-x-7 top-5 flex justify-between text-[10px] font-bold tracking-widest text-stone-600 md:inset-x-10">
                    <span>No. {String(result.recommendationId ?? selected.bottlingId).padStart(3, "0")}</span>
                    <span>{new Date().toLocaleDateString("ko-KR")}</span>
                  </div>
                  <p className="mx-auto mb-5 w-fit border border-[#4a3728] px-3 py-1 text-[10px] font-bold tracking-[0.2em]">R-WHISKEY SELECTION</p>
                  <p className="text-xs font-semibold tracking-widest text-stone-600">{result.state === "DEGRADED" ? "대체 제공자 확인" : "공식 근거 확인"}</p>
                  <h3 className="mt-3 font-serif text-2xl font-bold">{selected.displayName}</h3>
                  {result.appliedLevel && <p className="mt-2 text-sm">{levelLabels[result.appliedLevel]} 추천</p>}
                  {(selected.details?.independentBottling === true || selected.details?.oldBottle === true) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                      {selected.details.independentBottling === true && <span className="rounded bg-amber-900 px-2 py-1 text-white">독립 병입</span>}
                      {selected.details.oldBottle === true && <span className="rounded bg-amber-900 px-2 py-1 text-white">올드바틀</span>}
                    </div>
                  )}
                  {appliedLevel === "BEGINNER" && <p className="mt-5 text-sm leading-6">{beginnerFlavorNotice}</p>}
                  {appliedLevel === "INTERMEDIATE" && <p className="mt-5 text-sm leading-6">
                    {result.reasonCodes.some((code) => code === "TASTE_FEEDBACK_MATCH" || code === "TASTE_FEEDBACK_AVOIDED")
                      ? "실제로 마신 뒤 남긴 맛 평가를 이번 순위에 반영했습니다."
                      : "이번에 선택한 조건과 확인된 병입 정보를 기준으로 추천했습니다."}
                  </p>}
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <Fact label="분류" value={selected.category} />
                    <Fact label="국가" value={selected.country} />
                    <Fact label="지역" value={selected.region} />
                    <Fact label="병입 구분" value={selected.edition} />
                    <Fact label="도수" value={selected.abv === null ? null : `${selected.abv}%`} />
                    <Fact label="용량" value={selected.volumeMl === null ? null : `${selected.volumeMl}ml`} />
                    <Fact label="연산" value={selected.ageStatementType === "NUMBERED" && selected.ageYears !== null ? `${selected.ageYears}년` : selected.ageStatementType === "NAS" ? "NAS" : null} />
                    {appliedLevel === "ADVANCED" && selected.details?.bottlerName && <Fact label="병입사" value={selected.details.bottlerName} />}
                    {appliedLevel === "ADVANCED" && selected.details?.bottledYear && <Fact label="병입 연도" value={`${selected.details.bottledYear}년`} />}
                  </dl>
                  {appliedLevel !== "ADVANCED" && (selected.details?.bottlerName || selected.details?.bottledYear) && (
                    <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold">병입 세부 정보 보기</summary>
                      <p className="mt-2">{[selected.details.bottlerName, selected.details.bottledYear ? `${selected.details.bottledYear}년 병입` : null]
                        .filter(Boolean).join(" · ")}</p>
                    </details>
                  )}
                  <p className="mt-4 text-xs text-stone-700">구매 가능 여부: {availabilityLabel}{availabilityContext ? ` (${availabilityContext})` : ""}</p>
                  <div className="mt-5 border-t border-stone-400/40 pt-4">
                    <p className="text-xs font-bold">선정 근거</p>
                    <ul className="mt-2 list-inside list-disc text-sm leading-6">
                      {(appliedLevel === "BEGINNER" ? beginnerReasons : displayedReasons).map((message) => <li key={message}>{message}</li>)}
                    </ul>
                  </div>
                  {evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-amber-900 underline">확인된 공식 근거 보기 ↗</a>}
                  {selected.details?.characteristicsEvidenceUrl?.startsWith("https://") &&
                    selected.details.characteristicsEvidenceUrl !== evidenceUrl &&
                    <a href={selected.details.characteristicsEvidenceUrl} target="_blank" rel="noopener noreferrer"
                      className="ml-4 mt-5 inline-block text-sm font-semibold text-amber-900 underline">풍미·병입 근거 보기 ↗</a>}
                </article>
              )}
              {selected && result?.recommendationId && (
                <div className="mt-5 rounded border border-stone-600 p-4">
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
                  <button type="button" onClick={() => void sendFeedback()} disabled={feedbackLoading} className="mt-3 rounded bg-amber-200 px-4 py-2 text-sm font-bold text-stone-950 disabled:cursor-not-allowed disabled:opacity-50">{feedbackLoading ? "저장 중…" : "평가 저장"}</button>
                  {feedbackStatus && <p role="status" className="mt-2 text-sm">{feedbackStatus}</p>}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
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
