"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { PaperAbvInput, PaperDisclosure, PaperReveal, PaperSelect } from "@/components/recommendations/PaperControls";
import ExpectationFeedback from "@/components/recommendations/ExpectationFeedback";
import { bilingualLabel, countryForCategory, recommendationReasons, whiskeyLabel as facetLabel } from "@/components/recommendations/whiskeyPresentation";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError } from "@/api/apiClient";
import { useAuthStore } from "@/store/authStore";
import type {
  WhiskeyCandidateRequest, WhiskeyCatalogFacet, WhiskeyCatalogFacetsResponse, WhiskeyExperienceLevel, WhiskeyFeedbackReason,
  WhiskeyFeedbackSentiment, WhiskeyFlavorPreference,
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
  NO_MATCH: "현재 선택과 설정에 맞는 검수 완료 위스키가 없습니다. 조건을 바꿔 다시 시도해 주세요.",
  NEEDS_CLARIFICATION: "요청 조건을 확인해 주세요. 도수 범위나 입력값이 맞지 않을 수 있습니다.",
  NEEDS_REVIEW: "검색 근거나 최종 판정이 충분하지 않아 추천을 보류했습니다.",
  UNAVAILABLE: "추천 서비스를 지금 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
};

const codeMessages: Record<string, string> = {
  PREVIEW_DISABLED: "서버의 검수 기반 추천 미리보기가 아직 활성화되지 않았습니다.",
  DATA_SOURCE_UNAVAILABLE: "추천 데이터를 지금 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
  UNKNOWN_CATEGORY: "위스키 종류를 목록에서 다시 골라 주세요.",
  UNKNOWN_COUNTRY: "생산 국가를 목록에서 다시 골라 주세요.",
  UNKNOWN_PREFERRED_CATEGORY: "선호하는 위스키 종류를 목록에서 다시 골라 주세요.",
  UNKNOWN_PREFERRED_COUNTRY: "선호하는 생산 국가를 목록에서 다시 골라 주세요.",
  UNKNOWN_PREFERRED_REGION: "선호하는 세부 산지를 목록에서 다시 골라 주세요.",
  NO_CANDIDATE_MATCHES_REQUIREMENTS: "꼭 맞아야 할 조건을 만족하는 검수 완료 위스키가 없습니다. 조건을 바꿔 주세요.",
  NO_CANDIDATE_MATCHES_LEVEL_PREFERENCES: "현재 경험 단계나 연기 향 설정에 맞는 검수 완료 위스키가 없습니다. 설정을 바꿔 주세요.",
  ABV_RANGE_CONFLICT: "최소 도수가 최대 도수보다 높습니다. 범위를 다시 입력해 주세요.",
  SEARCH_UNAVAILABLE: "공식 검색 결과를 확인할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
  MODEL_VERIFICATION_UNAVAILABLE: "최종 검수 모델을 사용할 수 없습니다. 잠시 뒤 다시 시도해 주세요.",
};

const orderMessages = [
  "테이블에서 온 주문서를 확인하고 있어요.",
  "술장에서 취향에 맞는 병을 찾고 있어요.",
  "골라낸 위스키를 한 번 더 살펴보고 있어요.",
  "오늘의 한 잔을 준비하고 있어요.",
] as const;
function isCatalogFacets(value: unknown): value is WhiskeyCatalogFacetsResponse {
  if (typeof value !== "object" || value === null) return false;
  const response = value as Record<string, unknown>;
  return (["categories", "countries", "regions"] as const).every((key) =>
    Array.isArray(response[key]) && response[key].every((item: unknown) =>
      typeof item === "object" && item !== null &&
      typeof (item as WhiskeyCatalogFacet).value === "string" &&
      typeof (item as WhiskeyCatalogFacet).bottlingCount === "number" &&
      typeof (item as WhiskeyCatalogFacet).label === "string" &&
      ((item as WhiskeyCatalogFacet).country === null || typeof (item as WhiskeyCatalogFacet).country === "string")));
}
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
  const [resultPreferences, setResultPreferences] = useState({
    category: "", country: "", region: "", targetAbv: null as number | null,
    preferredFlavor: "UNKNOWN" as WhiskeyFlavorPreference,
  });
  const [error, setError] = useState<string | null>(null);
  const [recommendationAuthExpired, setRecommendationAuthExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WhiskeyProfile>(defaultProfile);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [facets, setFacets] = useState<WhiskeyCatalogFacetsResponse | null>(null);
  const [facetStatus, setFacetStatus] = useState<string | null>(null);
  const [facetAuthExpired, setFacetAuthExpired] = useState(false);
  const [facetLoading, setFacetLoading] = useState(false);
  const [facetReload, setFacetReload] = useState(0);
  const [includeIndependentBottlings, setIncludeIndependentBottlings] = useState(false);
  const [includeOldBottles, setIncludeOldBottles] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [conditionStatus, setConditionStatus] = useState<string | null>(null);
  const [feedbackSentiment, setFeedbackSentiment] = useState<WhiskeyFeedbackSentiment>("NEUTRAL");
  const [savedFeedbackSentiment, setSavedFeedbackSentiment] = useState<WhiskeyFeedbackSentiment | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<WhiskeyFeedbackReason>("NONE");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackAuthExpired, setFeedbackAuthExpired] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const reduceMotion = useReducedMotion();
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
    if (!enabled || !isInitialized || !isAuthenticated || profile.experienceLevel === "BEGINNER") return;
    let active = true;
    setFacets(null);
    setFacetStatus(null);
    setFacetAuthExpired(false);
    setFacetLoading(true);
    void recommendationApi.getWhiskeyCatalogFacets()
      .then((response) => {
        if (!active) return;
        if (isCatalogFacets(response)) setFacets(response);
        else {
          setInputs((current) => ({ ...current, category: "", country: "", preferredCategory: "", preferredCountry: "", preferredRegion: "" }));
          setFacetStatus("선택지를 확인하지 못했습니다. 종류·생산 국가·세부 산지를 제외하고 추천받을 수 있습니다.");
        }
      })
      .catch((caught) => { if (active) {
        setFacetAuthExpired(caught instanceof ApiResponseError && caught.status === 401);
        setInputs((current) => ({ ...current, category: "", country: "", preferredCategory: "", preferredCountry: "", preferredRegion: "" }));
        setFacetStatus(caught instanceof ApiResponseError && caught.status === 401
          ? "로그인 상태가 만료됐습니다. 로그인 페이지에서 다시 로그인해 주세요."
          : "선택지를 불러오지 못했습니다. 종류·생산 국가·세부 산지를 제외하고 추천받을 수 있습니다.");
      } })
      .finally(() => { if (active) setFacetLoading(false); });
    return () => { active = false; };
  }, [enabled, isInitialized, isAuthenticated, profile.experienceLevel, facetReload]);
  useEffect(() => {
    if (result) resultHeadingRef.current?.focus();
  }, [result]);
  useEffect(() => {
    setDetailsOpen(profile.experienceLevel === "ADVANCED");
    setError(null);
    setResult(null);
    setConditionStatus(null);
  }, [profile.experienceLevel]);

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
    if (!id || !Number.isSafeInteger(id) || feedbackBusy.current ||
      (feedbackSentiment === "NEUTRAL" && savedFeedbackSentiment === null)) return;
    feedbackBusy.current = true;
    setFeedbackLoading(true);
    setFeedbackStatus(null);
    setFeedbackAuthExpired(false);
    try {
      await recommendationApi.submitWhiskeyFeedback(id, {
        stage: "EXPECTED", sentiment: feedbackSentiment, reason: feedbackSentiment === "NEUTRAL" ? "NONE" : feedbackReason,
      });
      setSavedFeedbackSentiment(feedbackSentiment);
      setFeedbackStatus("마시기 전 감상을 저장했습니다. 선택을 바꾸고 다시 저장할 수 있어요.");
    } catch (caught) {
      if (caught instanceof ApiResponseError && caught.status === 401) {
        setFeedbackAuthExpired(true);
        setFeedbackStatus("로그인 상태가 만료되어 평가를 저장하지 못했습니다.");
      } else {
        setFeedbackStatus("평가를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
      }
    } finally {
      feedbackBusy.current = false;
      setFeedbackLoading(false);
    }
  }

  function update(key: InputKey, value: string) {
    const next = { ...inputs, [key]: value };
    const changes: string[] = [];
    const clear = (field: InputKey, label: string) => {
      if (next[field]) { next[field] = ""; changes.push(`${label} 선택을 해제했어요.`); }
    };
    if (key === "category" || key === "preferredCategory") {
      const country = countryForCategory(value);
      if (key === "preferredCategory" && country && next.country && country !== next.country) {
        setConditionStatus("꼭 맞아야 할 생산 국가와 다른 종류예요. 국가 조건을 바꾸거나 다른 종류를 골라주세요.");
        return;
      }
      const countryKey = key === "category" ? "country" : "preferredCountry";
      if (country && next[countryKey] !== country) {
        next[countryKey] = country;
        changes.push(`선택한 종류에 맞춰 ${key === "category" ? "생산 국가" : "선호 국가"}를 설정했어요: ${facetLabel("country", country, facets)}.`);
      }
    }
    if (key === "country" && value && countryForCategory(next.category) && countryForCategory(next.category) !== value) {
      clear("category", "국가와 다른 위스키 종류");
    }
    if (key === "preferredCountry" && value && countryForCategory(next.preferredCategory) && countryForCategory(next.preferredCategory) !== value) {
      clear("preferredCategory", "국가와 다른 선호 종류");
    }
    if (next.country) {
      if (next.preferredCountry && next.preferredCountry !== next.country) clear("preferredCountry", "꼭 맞아야 할 국가와 다른 선호 국가");
      const preferredCategoryCountry = countryForCategory(next.preferredCategory);
      if (preferredCategoryCountry && preferredCategoryCountry !== next.country) clear("preferredCategory", "꼭 맞아야 할 국가와 다른 선호 종류");
    }
    const regionCountry = facets?.regions.find((region) => region.value === next.preferredRegion)?.country;
    const effectiveCountry = next.country || next.preferredCountry;
    if (regionCountry && effectiveCountry && regionCountry !== effectiveCountry) clear("preferredRegion", "국가와 다른 세부 산지");
    else if (key === "preferredRegion" && regionCountry && !effectiveCountry) {
      next.preferredCountry = regionCountry;
      changes.push(`산지에 맞춰 선호 국가를 설정했어요: ${facetLabel("country", regionCountry, facets)}.`);
      if (countryForCategory(next.preferredCategory) && countryForCategory(next.preferredCategory) !== regionCountry) clear("preferredCategory", "산지와 다른 선호 종류");
    }
    setInputs(next);
    setConditionStatus(changes.length ? changes.join(" ") : null);
    setError(null);
  }

  const hasDetailedConditions = profile.experienceLevel !== "BEGINNER";
  const activeDetailedInputCount = hasDetailedConditions
    ? Object.entries(inputs).filter(([key, value]) =>
        (profile.experienceLevel === "ADVANCED" || !["minAbv", "maxAbv", "targetAbv"].includes(key)) &&
        value.trim() !== "").length : 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !enabled) return;
    setError(null);
    setRecommendationAuthExpired(false);
    setResult(null);
    setFeedbackStatus(null);
    setFeedbackSentiment("NEUTRAL");
    setFeedbackReason("NONE");
    setSavedFeedbackSentiment(null);

    if (!isAuthenticated) {
      setError("로그인 후 검수 기반 추천을 이용할 수 있습니다.");
      return;
    }

    if (hasDetailedConditions && !facets && [inputs.category, inputs.country,
      inputs.preferredCategory, inputs.preferredCountry, inputs.preferredRegion].some(Boolean)) {
      setDetailsOpen(true);
      setError("이전에 고른 분류·국가·지역을 확인 중입니다. 선택값을 다시 불러온 뒤 요청해 주세요.");
      return;
    }

    const minAbv = profile.experienceLevel === "ADVANCED" ? optionalNumber(inputs.minAbv) : undefined;
    const maxAbv = profile.experienceLevel === "ADVANCED" ? optionalNumber(inputs.maxAbv) : undefined;
    const targetAbv = profile.experienceLevel === "ADVANCED" ? optionalNumber(inputs.targetAbv) : undefined;
    if (hasDetailedConditions && ([minAbv, maxAbv, targetAbv].some((value) => value !== undefined &&
      (!Number.isFinite(value) || value < 0 || value > 100)) ||
      (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv))) {
      setDetailsOpen(true);
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

    setResultPreferences({
      category: request.context?.preferredCategory ?? "",
      country: request.context?.preferredCountry ?? "",
      region: request.context?.preferredRegion ?? "",
      targetAbv: request.context?.targetAbv ?? null,
      preferredFlavor: request.preferredFlavor ?? "UNKNOWN",
    });
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
        setRecommendationAuthExpired(true);
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
  const unmatchedPreferenceMessages = result?.reasonCodes.flatMap((code) => {
    if (!selected) return [];
    if (code === "PREFERRED_CATEGORY_NOT_MATCHED") return [
      `선호 종류 ${facetLabel("category", resultPreferences.category || "미확인", facets)} → 추천 종류 ${facetLabel("category", selected.category || "미확인", facets)}`];
    if (code === "PREFERRED_COUNTRY_NOT_MATCHED") return [
      `선호 생산 국가 ${facetLabel("country", resultPreferences.country || "미확인", facets)} → 추천 생산 국가 ${facetLabel("country", selected.country || "미확인", facets)}`];
    if (code === "PREFERRED_REGION_NOT_MATCHED") return [
      `선호 세부 산지 ${facetLabel("region", resultPreferences.region || "미확인", facets)} → 추천 세부 산지 ${facetLabel("region", selected.region || "미확인", facets)}`];
    return [];
  }) ?? [];
  if (selected && resultPreferences.targetAbv !== null) {
    if (selected.abv === null) {
      unmatchedPreferenceMessages.push(`선호 도수 ${resultPreferences.targetAbv}%: 추천 병입의 도수가 확인되지 않았습니다.`);
    } else if (Math.abs(resultPreferences.targetAbv - selected.abv) > 10) {
      unmatchedPreferenceMessages.push(`선호 도수 ${resultPreferences.targetAbv}% → 추천 도수 ${selected.abv}%`);
    }
  }
  if (selected && resultPreferences.preferredFlavor !== "UNKNOWN") {
    const flavor = resultPreferences.preferredFlavor === "SWEET" ? "달콤함" : "과일 향";
    const level = resultPreferences.preferredFlavor === "SWEET"
      ? selected.details?.sweetnessLevel : selected.details?.fruitLevel;
    if (level == null) {
      unmatchedPreferenceMessages.push(`선호한 ${flavor}: 추천 병입의 풍미 정보가 확인되지 않았습니다.`);
    } else if (level === 0) {
      unmatchedPreferenceMessages.push(`선호한 ${flavor}: 확인된 풍미 정보에서는 두드러지지 않습니다.`);
    }
  }
  const displayedReasons = result ? recommendationReasons(result, appliedLevel ?? profile.experienceLevel) : [];
  const evidenceUrl = result?.evidenceUrl?.startsWith("https://") ? result.evidenceUrl : null;
  const regionCountryFilter = inputs.country || inputs.preferredCountry;
  const regionOptions = (facets?.regions ?? []).filter((region) => !regionCountryFilter || region.country === regionCountryFilter);
  const preferredCountries = (facets?.countries ?? []).filter((country) => !inputs.country || country.value === inputs.country);
  const preferredCategories = (facets?.categories ?? []).filter((category) => !inputs.country || !countryForCategory(category.value) || countryForCategory(category.value) === inputs.country);
  const fieldChoiceClass = (active: boolean) => `cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a3728] ${
    active ? "border-[#2d2017] bg-[#4a3728]/10 font-bold text-[#2d2017]" :
      "border-[#4a3728]/30 bg-white/20 text-stone-700 hover:border-[#4a3728]/60"
  }`;

  return (
    <main className="min-h-screen bg-[#1a120d] text-stone-100 selection:bg-amber-200/30">
      <nav className={`mx-auto flex w-full items-center px-6 py-4 ${selected ? "max-w-2xl" : "max-w-5xl"}`}>
        {selected ? (
          <button type="button" disabled={feedbackLoading} onClick={() => setResult(null)} className="flex items-center gap-2 text-sm font-light text-stone-500 transition-colors hover:text-white disabled:opacity-50">
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
        <motion.div initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }} className="mx-auto grid w-full max-w-5xl items-start gap-10 px-6 pb-12 pt-4 md:gap-12 lg:grid-cols-2">
          <header className="flex flex-col justify-center space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-300/80">Whiskey Recommendation</p>
            <h1 className="font-serif text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">오늘의 취향에 맞는<br />위스키를 찾아보세요</h1>
            <p className="max-w-md text-sm leading-6 text-stone-400 md:text-base">위스키 경험과 선호하는 향을 고르면 확인된 병입 중에서 오늘의 한 잔을 추천해드립니다.</p>
            {profile.experienceLevel !== "BEGINNER" && <p className="max-w-md text-sm leading-6 text-stone-500">익숙한 취향이 있다면 주문서에서 조건을 더 구체적으로 선택할 수 있습니다.</p>}
          </header>
          <form onSubmit={submit} noValidate aria-busy={loading} className="relative mx-auto w-full max-w-[550px] rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] md:p-8">
            <div className="pointer-events-none absolute inset-2 border border-[#4a3728]/20" />
            <div className="relative mb-5 flex items-center justify-between text-[12px] font-bold tracking-[0.2em] text-stone-700">
              <span>R-WHISKEY</span>
              <span>{todayStr}</span>
            </div>
            <div className="relative mb-6 text-center">
              <h2 className="inline-block border border-[#4a3728] bg-white/10 px-3 py-1 text-[13px] font-bold tracking-widest text-[#2d2017]">오늘의 주문</h2>
            </div>
            <fieldset disabled={loading} className="relative min-w-0">
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
              <motion.p key={profile.experienceLevel} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }} className="mt-4 text-sm leading-6 text-stone-700">
                {profile.experienceLevel === "BEGINNER" ? "처음이라면 아래 두 가지만 골라도 됩니다. 잘 모르겠다면 그대로 추천받으세요." :
                  profile.experienceLevel === "INTERMEDIATE" ? "알고 있는 취향만 고르고, 필요하면 아래 조건으로 더 구체화하세요. 모르는 항목은 비워두어도 됩니다." :
                    "병입 유형과 검수된 세부 정보를 함께 살펴봅니다. 모르는 취향은 비워두어도 됩니다."}
              </motion.p>
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">{profile.experienceLevel === "BEGINNER" ? "연기 향이 나도 괜찮나요?" :
                  profile.experienceLevel === "INTERMEDIATE" ? "연기 향 선호" : "피트·연기 향 허용"}
                </legend>
                <p className="mt-2 text-xs leading-5 text-stone-600">모닥불이나 훈제 음식을 떠올리는 향이에요.<br />병에 따라 흙이나 소독약 같은 인상도 느낄 수 있어요.</p>
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
              <div hidden>
              <button type="button" onClick={() => void saveProfile()} disabled={!isAuthenticated}
                className="mt-4 text-sm font-semibold text-[#4a3728] underline disabled:opacity-50">이 선택을 기본 취향으로 저장</button>
              {profileStatus && <p role="status" className="mt-2 text-xs text-stone-700">{profileStatus}</p>}
              </div>
              {profile.experienceLevel === "INTERMEDIATE" && <fieldset className="mt-6 border-t border-[#4a3728]/25 pt-4">
                <legend className="px-1 text-sm font-bold">병입 유형 넓히기</legend>
                <p className="mb-3 text-xs leading-5 text-stone-600">선택하면 독립 병입이나 올드바틀도 후보에 포함합니다.<br />구매 가능 여부는 별도로 확인해야 합니다.</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeIndependentBottlings}
                    onChange={(event) => setIncludeIndependentBottlings(event.target.checked)} />독립 병입 포함</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeOldBottles}
                    onChange={(event) => setIncludeOldBottles(event.target.checked)} />올드바틀 포함</label>
                </div>
              </fieldset>}
              {profile.experienceLevel === "ADVANCED" && <div className="mt-6 border-t border-[#4a3728]/25 pt-4 text-sm">
                <p className="font-bold">독립 병입 · 올드바틀 기본 포함</p>
                <p className="mt-1 text-xs leading-5 text-stone-700">일반 제품과 함께 병입사의 제품이나 과거에 병입된 제품도 살펴봅니다.<br />구매 가능 여부는 별도로 확인해 주세요.</p>
              </div>}
              {hasDetailedConditions && <PaperDisclosure title="취향과 상세 조건" open={detailsOpen}
                onToggle={() => setDetailsOpen((open) => !open)} count={activeDetailedInputCount}>
              {facetLoading && <p role="status" className="mt-4 text-xs text-stone-600">위스키 선택지를 불러오는 중입니다.</p>}
              {facetStatus && <div role="alert" className="mt-4 text-xs text-red-900">
                <p>{facetStatus}</p>
                {facetAuthExpired ? <Link href="/login" className="mt-2 inline-block font-semibold underline">다시 로그인</Link> :
                  <button type="button" onClick={() => setFacetReload((value) => value + 1)}
                    className="mt-2 font-semibold underline">선택값 다시 불러오기</button>}
              </div>}
              <p className="mt-4 text-xs leading-5 text-stone-600">종류와 생산 국가는 지금 추천 가능한 병이 없어도 고를 수 있어요.<br />조건에 맞는 병이 없다면 알려드릴게요.</p>
              {conditionStatus && <p role="status" className="mt-3 text-xs leading-5 text-amber-900">{conditionStatus}</p>}
              <h3 className="mt-6 text-sm font-bold">꼭 맞아야 할 조건 (선택)</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">선택한 조건에 맞는 병입만 추천합니다.<br />고르지 않아도 됩니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FacetField label="위스키 종류" value={inputs.category} options={facets?.categories ?? []} strength="hard" onChange={(value) => update("category", value)} disabled={!facets} />
                <FacetField label="생산 국가" value={inputs.country} options={facets?.countries ?? []} strength="hard" onChange={(value) => update("country", value)} disabled={!facets} />
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput label="최소 도수 (ABV %)" value={inputs.minAbv} onChange={(value) => update("minAbv", value)} />}
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput label="최대 도수 (ABV %)" value={inputs.maxAbv} onChange={(value) => update("maxAbv", value)} />}
              </div>
              <h3 className="mt-8 text-sm font-bold">가능하면 맞춰줄 취향</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">선호가 맞지 않아도 다른 위스키를 추천할 수 있습니다.<br />결과에서 차이를 알려드립니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FacetField label="선호하는 위스키 종류" value={inputs.preferredCategory} options={preferredCategories} strength="soft" onChange={(value) => update("preferredCategory", value)} disabled={!facets} />
                <FacetField label="선호하는 생산 국가" value={inputs.preferredCountry} options={preferredCountries} strength="soft" onChange={(value) => update("preferredCountry", value)} disabled={!facets} />
                <FacetField label="선호하는 세부 산지" value={inputs.preferredRegion} options={regionOptions} countries={facets?.countries ?? []} strength="soft" onChange={(value) => update("preferredRegion", value)} disabled={!facets} />
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput label="선호 도수 (ABV %)" value={inputs.targetAbv} onChange={(value) => update("targetAbv", value)} />}
              </div>
              {inputs.country && <p className="mt-3 text-xs leading-5 text-stone-600">꼭 맞아야 할 생산 국가 안에서 취향을 고를 수 있어요.</p>}
              </PaperDisclosure>}
              {error && <div role="alert" className="mt-5 rounded border border-red-700/30 bg-red-100 p-3 text-sm text-red-900">
                <p>{error}</p>
                {recommendationAuthExpired && <Link href="/login" className="mt-2 inline-block font-semibold underline">다시 로그인</Link>}
              </div>}
              {result && <p role="status" className="mt-5 rounded border border-[#4a3728]/25 bg-white/30 p-3 text-sm leading-6 text-stone-800">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}
              {result?.state === "NO_MATCH" && result.code === "NO_CANDIDATE_MATCHES_REQUIREMENTS" && hasDetailedConditions &&
                (Boolean(inputs.category || inputs.country) ||
                  (profile.experienceLevel === "ADVANCED" && Boolean(inputs.minAbv || inputs.maxAbv))) &&
                <button type="button" onClick={() => {
                  setInputs((current) => ({ ...current, category: "", country: "", minAbv: "", maxAbv: "" }));
                  setResult(null);
                }} className="mt-3 text-sm font-semibold underline">꼭 맞아야 할 조건 지우기</button>}
              {!isAuthenticated && isInitialized && <Link href="/login" className="mt-4 block text-sm font-semibold underline">로그인하러 가기</Link>}
              <PaperReveal show={loading}><WhiskeyLoader messages={orderMessages} tone="paper" compact /></PaperReveal>
              <button type="submit" disabled={loading || !isAuthenticated || !isInitialized}
                className="mt-7 w-full bg-[#111] px-5 py-3 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "주문을 살펴보고 있어요…" : "위스키 추천 받기"}
              </button>
              </fieldset>
            </form>
        </motion.div>
      ) : (
        <motion.section initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }} className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 pb-12 pt-4">
          <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">오늘의 추천 결과</h2>
          {result && <article className="relative flex w-full max-w-md flex-col items-center rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 pt-12 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:p-10 md:pt-14">
                  <div className="absolute inset-x-7 top-5 flex justify-between text-[10px] font-bold tracking-widest text-stone-600 md:inset-x-10">
                    <span>No. {String(result.recommendationId).padStart(3, "0")}</span>
                    <span>{todayStr}</span>
                  </div>
                  <p className="mb-4 border border-[#4a3728] px-3 py-1 text-[10px] font-bold tracking-[0.2em]">오늘의 추천</p>
                  <h3 className="mt-3 text-center font-serif text-2xl font-bold leading-tight">{selected.displayName}</h3>
                  <p className="mt-3 text-center text-xs leading-6 text-stone-700">
                    {bilingualLabel("category", selected.category, facets) ?? "위스키"}<br />
                    {bilingualLabel("country", selected.country, facets)}
                  </p>
                  {(selected.details?.independentBottling === true || selected.details?.oldBottle === true) && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
                      {selected.details.independentBottling === true && <span className="rounded-full border border-[#4a3728]/30 px-3 py-1 text-[#4a3728]">독립 병입</span>}
                      {selected.details.oldBottle === true && <span className="rounded-full border border-[#4a3728]/30 px-3 py-1 text-[#4a3728]">올드바틀</span>}
                    </div>
                  )}
                  {unmatchedPreferenceMessages.length > 0 && <div role="note" className="mt-5 w-full rounded border border-amber-800/30 bg-amber-100/60 p-3 text-xs leading-5 text-stone-800">
                    <p className="font-semibold">선호 조건 안내</p>
                    <ul className="mt-1 list-inside list-disc">{unmatchedPreferenceMessages.map((message) => <li key={message}>{message}</li>)}</ul>
                  </div>}
                  <div className="mt-6 w-full border-t border-[#4a3728]/25 pt-4">
                    <p className="text-sm font-bold text-stone-800">바텐더의 한마디</p>
                    <div className="mt-3 space-y-2 text-sm leading-7">
                      {displayedReasons.map((message) => <p key={message}>{message}</p>)}
                    </div>
                  </div>
                  <div className="mt-6 w-full border-t border-[#4a3728]/25 pt-4 text-sm">
                    <p className="font-semibold">이 병을 조금 더 알아보면</p>
                    <dl className="mt-4 grid grid-cols-2 gap-4">
                    <Fact label="세부 산지" value={selected.region ? facetLabel("region", selected.region, facets) : null} />
                    <Fact label="병입 구분" value={selected.edition} />
                    <Fact label="도수" value={selected.abv === null ? null : `${selected.abv}%`} />
                    <Fact label="숙성 년수" value={selected.ageStatementType === "NUMBERED" && selected.ageYears !== null ? `${selected.ageYears}년` : selected.ageStatementType === "NAS" ? "숙성 년수 표기 없음 (NAS)" : null} />
                    {selected.details?.bottlerName && <Fact label="병입사" value={selected.details.bottlerName} />}
                    {selected.details?.bottledYear && <Fact label="병입 연도" value={`${selected.details.bottledYear}년`} />}
                  </dl>
                  </div>
                  <div className="mt-4 flex w-full flex-wrap gap-x-4 gap-y-2">
                    {evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4a3728] underline">제품 정보 출처 ↗</a>}
                    {selected.details?.characteristicsEvidenceUrl?.startsWith("https://") &&
                      selected.details.characteristicsEvidenceUrl !== evidenceUrl &&
                      <a href={selected.details.characteristicsEvidenceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-[#4a3728] underline">풍미·병입 정보 출처 ↗</a>}
                  </div>
                  <div className="mt-7 w-full border-t border-[#4a3728]/25 pt-4 text-center">
                    <span className="text-[9px] font-bold uppercase italic tracking-widest text-stone-600">R-Whiskey Selection</span>
                  </div>
                </article>}
              {result?.recommendationId && (
                <ExpectationFeedback sentiment={feedbackSentiment} reason={feedbackReason} savedSentiment={savedFeedbackSentiment}
                  loading={feedbackLoading} status={feedbackStatus} authExpired={feedbackAuthExpired}
                  onSentiment={(value) => { setFeedbackSentiment(value); setFeedbackReason("NONE"); setFeedbackStatus(null); }}
                  onReason={(value) => { setFeedbackReason(value); setFeedbackStatus(null); }} onSave={() => void sendFeedback()} />
              )}
        </motion.section>
      )}
    </main>
  );
}

function FacetField({ label, value, options, countries = [], strength, onChange, disabled }: {
  label: string; value: string;
  options: WhiskeyCatalogFacet[]; countries?: WhiskeyCatalogFacet[]; strength: "hard" | "soft"; onChange: (value: string) => void; disabled: boolean;
}) {
  const unavailable = value && options.find((option) => option.value === value)?.bottlingCount === 0;
  return <PaperSelect label={label} value={value} onChange={onChange} disabled={disabled}
    options={options.map((option) => ({ value: option.value, label: option.label + (option.country ? " · " +
      (countries.find((country) => country.value === option.country)?.label ?? option.country) : "") }))}
    hint={unavailable ? strength === "hard"
      ? "지금 이 조건에 맞춰 추천할 수 있는 병이 없어요."
      : "이 취향에 맞는 병은 아직 없지만, 다른 병을 추천할 수 있어요." : undefined} />;
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="text-xs text-stone-600">{label}</dt><dd className="mt-1 break-words font-medium">{value}</dd></div>;
}
