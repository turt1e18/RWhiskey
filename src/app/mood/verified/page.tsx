"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import WhiskeyLoadingOverlay from "@/components/recommendations/WhiskeyLoadingOverlay";
import RecommendationBackLink from "@/components/recommendations/RecommendationBackLink";
import { logVerifiedResponse } from "@/lib/recommendations/debugResponse";
import { PaperAbvInput, PaperDisclosure, PaperSelect } from "@/components/recommendations/PaperControls";
import ExpectationFeedback from "@/components/recommendations/ExpectationFeedback";
import WhiskeyTasteFields from "@/components/recommendations/WhiskeyTasteFields";
import WhiskeyBottleImage from "@/components/recommendations/WhiskeyBottleImage";
import { useV3Order } from "@/components/recommendations/useV3Order";
import WhiskeyAiSuggestionCard from "@/components/recommendations/WhiskeyAiSuggestionCard";
import type { V3Response } from "@/lib/recommendations/v3Contract";
import { bilingualLabel, countryForCategory, recommendationReasons, whiskeyLabel as facetLabel } from "@/components/recommendations/whiskeyPresentation";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError, ApiRequestTimeout } from "@/api/apiClient";
import { useAuthStore } from "@/store/authStore";
import type {
  WhiskeyCandidateRequest, WhiskeyCatalogFacet, WhiskeyCatalogFacetsResponse, WhiskeyExperienceLevel, WhiskeyFeedbackReason,
  WhiskeyFeedbackSentiment, WhiskeyFlavorPreference,
  WhiskeyProfile, WhiskeySmokePreference, WhiskeyVerifiedRecommendationResponse,
} from "@/type/ApiInterface";

type InputKey = "category" | "country" | "minAbv" | "maxAbv" |
  "preferredCategory" | "preferredCountry" | "preferredRegion" | "targetAbv" |
  "region" | "maturationCask" | "finishCask" | "preferredMaturationCask" | "preferredFinishCask";
type Inputs = Record<InputKey, string>;

const initialInputs: Inputs = {
  category: "", country: "", minAbv: "", maxAbv: "",
  preferredCategory: "", preferredCountry: "", preferredRegion: "", targetAbv: "",
  region: "", maturationCask: "", finishCask: "", preferredMaturationCask: "", preferredFinishCask: "",
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
  REQUEST_DEADLINE_EXCEEDED: "이번 주문을 시간 안에 확인하지 못했어요. 선택은 그대로예요. 잠시 뒤 다시 시도해 주세요.",
  REQUEST_BUDGET_EXHAUSTED: "이번에는 추천 확인을 끝내지 못했어요. 선택은 그대로예요. 잠시 뒤 다시 시도해 주세요.",
  RATE_LIMITED: "짧은 시간에 여러 번 요청했어요. 잠시 기다린 뒤 다시 요청해 주세요.",
  DAILY_LIMITED: "오늘 이용 가능한 추천 요청을 모두 사용했어요. 내일 다시 찾아주세요.",
  RECOMMENDATION_BUSY: "아직 살펴보는 주문이 있어요. 잠시 기다린 뒤 다시 확인해 주세요.",
  REQUEST_IN_PROGRESS: "이전 주문을 아직 살펴보고 있어요. 잠시 기다린 뒤 이전 주문 결과를 확인해 주세요.",
  IDEMPOTENCY_CONFLICT: "이전 주문과 선택한 조건이 달라요. 조건을 확인하고 새 주문으로 요청해 주세요.",
  ADMISSION_UNAVAILABLE: "지금은 주문을 안전하게 접수할 수 없어요. 잠시 뒤 다시 시도해 주세요.",
  CATEGORY_COUNTRY_CONFLICT: "고른 위스키 종류와 생산 국가가 달라요. 둘 중 한 선택을 바꿔 주세요.",
  REGION_COUNTRY_CONFLICT: "세부 산지와 생산 국가가 달라요. 산지나 국가를 다시 골라 주세요.",
  PREFERRED_COUNTRY_CONFLICT: "선호하는 국가가 꼭 맞아야 할 국가와 달라요.",
  PREFERRED_CATEGORY_CONFLICT: "선호하는 종류가 국가 조건과 달라요.",
  PREFERRED_REGION_CONFLICT: "선호하는 산지가 생산 국가와 달라요.",
  UNKNOWN_REGION: "세부 산지를 목록에서 다시 골라 주세요.",
  UNKNOWN_CASK: "숙성 통이나 피니시 통을 목록에서 다시 골라 주세요.",
  INVALID_AROMA_PREFERENCES: "경험 단계에 맞춰 향을 다시 골라 주세요.",
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
  aromaPreferences: [], tastePreference: "UNKNOWN", bodyPreference: "UNKNOWN",
};
const levelLabels: Record<WhiskeyExperienceLevel, string> = {
  BEGINNER: "초심자", INTERMEDIATE: "중급", ADVANCED: "상급",
};
const smokeOptions: { value: WhiskeySmokePreference; label: string }[] = [
  { value: "UNKNOWN", label: "잘 모르겠어요" },
  { value: "ALLOW", label: "괜찮아요" },
  { value: "MILD", label: "은은한 정도만 좋아요" },
  { value: "BOLD", label: "진한 향도 좋아요" },
  { value: "AVOID", label: "피하고 싶어요" },
];

function isVerifiedResponse(value: unknown): value is WhiskeyVerifiedRecommendationResponse {
  if (typeof value !== "object" || value === null || !("state" in value)) return false;
  return typeof value.state === "string" && value.state in stateMessages &&
    "code" in value && typeof value.code === "string" &&
    "reasonCodes" in value && Array.isArray(value.reasonCodes) && value.reasonCodes.every((code) => typeof code === "string");
}

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export default function VerifiedWhiskeyPreviewPage() {
  const [inputs, setInputs] = useState<Inputs>(initialInputs);
  const [result, setResult] = useState<WhiskeyVerifiedRecommendationResponse | null>(null);
  const [aiResult,setAiResult]=useState<V3Response|null>(null);
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
  const [feedbackComment, setFeedbackComment] = useState("");
  const [abvUnit, setAbvUnit] = useState<"ABV" | "PROOF">("ABV");
  const [levelStatus, setLevelStatus] = useState<string | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<WhiskeyFeedbackReason>("NONE");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);
  const [feedbackAuthExpired, setFeedbackAuthExpired] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const feedbackBusy = useRef(false);
  const busy = useRef(false);
  const pendingRequest = useRef<{ payload: string; key: string } | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const uid = useAuthStore((state) => state.user?.uid ?? undefined);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const aiEnabled = process.env.NEXT_PUBLIC_WHISKEY_AI_SUGGESTION_ENABLED === "true";
  const v3Enabled = aiEnabled || process.env.NEXT_PUBLIC_WHISKEY_V3_ENABLED === "true";
  const v3 = useV3Order(uid, v3Enabled, (card, response) => {
    setAiResult(null);setResult(card); setShowForm(false); setSavedAt(response.recommendedAt ?? null);
    setFeedbackStatus(null); setFeedbackSentiment("NEUTRAL"); setFeedbackReason("NONE");
    setFeedbackComment(""); setSavedFeedbackSentiment(null);
    const p=response.requestSummary?.preferences;
    setResultPreferences({category:p?.category ?? "",country:p?.country ?? "",region:p?.region ?? "",targetAbv:p?.targetAbv ?? null,preferredFlavor:"UNKNOWN"});
  }, response=>{setAiResult(response);setResult(null);setShowForm(false);setSavedAt(response.recommendedAt??null);});
  const v3Mode = v3Enabled || Boolean(v3.pending) || result?.code === "V3_SAVED" || Boolean(aiResult);
  const enabled = v3Mode || process.env.NEXT_PUBLIC_WHISKEY_V2_ENABLED === "true";
  const currentCard=useRef({uid,id:result?.recommendationId});currentCard.current={uid,id:result?.recommendationId};
  useEffect(() => { setAiResult(null);setResult(null);setShowForm(true);setSavedAt(null);setFeedbackStatus(null);setSavedFeedbackSentiment(null);setFeedbackComment(""); }, [uid]);
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
      .then((saved) => { if (active) setProfile({ ...defaultProfile, ...saved }); })
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
          setInputs((current) => ({ ...current, category: "", country: "", preferredCategory: "", preferredCountry: "", preferredRegion: "", region: "", maturationCask: "", finishCask: "", preferredMaturationCask: "", preferredFinishCask: "" }));
          setFacetStatus("선택지를 확인하지 못했습니다. 종류·생산 국가·세부 산지를 제외하고 추천받을 수 있습니다.");
        }
      })
      .catch((caught) => { if (active) {
        setFacetAuthExpired(caught instanceof ApiResponseError && caught.status === 401);
        setInputs((current) => ({ ...current, category: "", country: "", preferredCategory: "", preferredCountry: "", preferredRegion: "", region: "", maturationCask: "", finishCask: "", preferredMaturationCask: "", preferredFinishCask: "" }));
        setFacetStatus(caught instanceof ApiResponseError && caught.status === 401
          ? "로그인 상태가 만료됐습니다. 로그인 페이지에서 다시 로그인해 주세요."
          : "선택지를 불러오지 못했습니다. 종류·생산 국가·세부 산지를 제외하고 추천받을 수 있습니다.");
      } })
      .finally(() => { if (active) setFacetLoading(false); });
    return () => { active = false; };
  }, [enabled, isInitialized, isAuthenticated, profile.experienceLevel, facetReload]);
  useEffect(() => {
    if (result || aiResult) resultHeadingRef.current?.focus();
  }, [result, aiResult, showForm]);
  useEffect(() => {
    setDetailsOpen(profile.experienceLevel === "ADVANCED");
    setError(null);
    if (!v3Enabled) setResult(current => current?.code === "V3_SAVED" ? current : null);
    setConditionStatus(null);
  }, [profile.experienceLevel, v3Enabled]);

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
    const owner=uid;
    const stillCurrent=()=>currentCard.current.uid===owner && currentCard.current.id===id;
    setFeedbackLoading(true);
    setFeedbackStatus(null);
    setFeedbackAuthExpired(false);
    try {
      await recommendationApi.submitWhiskeyFeedback(id, {
        stage: "EXPECTED", sentiment: feedbackSentiment, reason: feedbackSentiment === "NEUTRAL" ? "NONE" : feedbackReason,
        comment: feedbackSentiment !== "NEUTRAL" && feedbackReason === "OTHER" ? feedbackComment.trim() || null : null,
      });
      if (!stillCurrent()) return;
      setSavedFeedbackSentiment(feedbackSentiment);
      setFeedbackStatus("마시기 전 감상을 저장했습니다. 선택을 바꾸고 다시 저장할 수 있어요.");
    } catch (caught) {
      if (!stillCurrent()) return;
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
      const country = countryForCategory(value, facets);
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
    if (key === "country" && value && countryForCategory(next.category, facets) && countryForCategory(next.category, facets) !== value) {
      clear("category", "국가와 다른 위스키 종류");
    }
    if (key === "preferredCountry" && value && countryForCategory(next.preferredCategory, facets) && countryForCategory(next.preferredCategory, facets) !== value) {
      clear("preferredCategory", "국가와 다른 선호 종류");
    }
    if (next.country) {
      if (next.preferredCountry && next.preferredCountry !== next.country) clear("preferredCountry", "꼭 맞아야 할 국가와 다른 선호 국가");
      const preferredCategoryCountry = countryForCategory(next.preferredCategory, facets);
      if (preferredCategoryCountry && preferredCategoryCountry !== next.country) clear("preferredCategory", "꼭 맞아야 할 국가와 다른 선호 종류");
    }
    const regionCountry = facets?.regions.find((region) => region.value === next.preferredRegion)?.country;
    const effectiveCountry = next.country || next.preferredCountry;
    if (regionCountry && effectiveCountry && regionCountry !== effectiveCountry) clear("preferredRegion", "국가와 다른 세부 산지");
    else if (key === "preferredRegion" && regionCountry && !effectiveCountry) {
      next.preferredCountry = regionCountry;
      changes.push(`산지에 맞춰 선호 국가를 설정했어요: ${facetLabel("country", regionCountry, facets)}.`);
      if (countryForCategory(next.preferredCategory, facets) && countryForCategory(next.preferredCategory, facets) !== regionCountry) clear("preferredCategory", "산지와 다른 선호 종류");
    }
    const hardRegionCountry = facets?.regions.find((region) => region.value === next.region)?.country;
    if (hardRegionCountry && next.country && hardRegionCountry !== next.country) clear("region", "국가와 다른 세부 산지");
    else if (key === "region" && hardRegionCountry && !next.country) { next.country = hardRegionCountry; changes.push("산지에 맞춰 생산 국가를 설정했어요."); }
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
    if (busy.current || v3.busy || !enabled) return;
    if (v3.pending) { await v3.run(); return; }
    if (v3Mode && !v3Enabled) { setError("새 추천 접수가 닫혀 있어요. 이전 추천과 시음 기록은 계속 볼 수 있어요."); return; }
    setError(null);
    setRecommendationAuthExpired(false);
    if (!v3Enabled) setResult(null);
    if (!v3Enabled) {
      setFeedbackStatus(null); setFeedbackSentiment("NEUTRAL"); setFeedbackReason("NONE");
      setFeedbackComment(""); setSavedFeedbackSentiment(null);
    }

    if (!isAuthenticated) {
      setError("로그인 후 위스키 추천을 이용할 수 있습니다.");
      return;
    }

    if (!recovering && hasDetailedConditions && !facets && [inputs.category, inputs.country,
      inputs.preferredCategory, inputs.preferredCountry, inputs.preferredRegion, inputs.region, inputs.maturationCask, inputs.finishCask, inputs.preferredMaturationCask, inputs.preferredFinishCask].some(Boolean)) {
      setDetailsOpen(true);
      setError("이전에 고른 분류·국가·지역을 확인 중입니다. 선택값을 다시 불러온 뒤 요청해 주세요.");
      return;
    }

    const abv = (value: string) => { const number = optionalNumber(value); return number === undefined ? undefined : number / (abvUnit === "PROOF" ? 2 : 1); };
    const minAbv = profile.experienceLevel === "ADVANCED" ? abv(inputs.minAbv) : undefined;
    const maxAbv = profile.experienceLevel === "ADVANCED" ? abv(inputs.maxAbv) : undefined;
    const targetAbv = profile.experienceLevel === "ADVANCED" ? abv(inputs.targetAbv) : undefined;
    if (!recovering && hasDetailedConditions && ([minAbv, maxAbv, targetAbv].some((value) => value !== undefined &&
      (!Number.isFinite(value) || value < 0 || value > 100)) ||
      (minAbv !== undefined && maxAbv !== undefined && minAbv > maxAbv))) {
      setDetailsOpen(true);
      setError("도수는 0~100 사이로 입력하고 최솟값이 최댓값보다 크지 않게 해주세요.");
      return;
    }

    const request: WhiskeyCandidateRequest = recovering && pendingRequest.current
      ? JSON.parse(pendingRequest.current.payload) as WhiskeyCandidateRequest : {
      requirements: hasDetailedConditions ? {
        ...(inputs.category.trim() && { category: inputs.category.trim() }),
        ...(inputs.country.trim() && { country: inputs.country.trim() }),
        ...(inputs.region && { region: inputs.region }),
        ...(inputs.maturationCask && { maturationCask: inputs.maturationCask }),
        ...(inputs.finishCask && { finishCask: inputs.finishCask }),
        ...(minAbv !== undefined && { minAbv }),
        ...(maxAbv !== undefined && { maxAbv }),
      } : {},
      context: hasDetailedConditions ? {
        ...(inputs.preferredCategory.trim() && { preferredCategory: inputs.preferredCategory.trim() }),
        ...(inputs.preferredCountry.trim() && { preferredCountry: inputs.preferredCountry.trim() }),
        ...(inputs.preferredRegion.trim() && { preferredRegion: inputs.preferredRegion.trim() }),
        ...(targetAbv !== undefined && { targetAbv }),
        ...(inputs.preferredMaturationCask && { preferredMaturationCask: inputs.preferredMaturationCask }),
        ...(inputs.preferredFinishCask && { preferredFinishCask: inputs.preferredFinishCask }),
      } : {},
      limit: 3,
      experienceLevel: profile.experienceLevel,
      smokePreference: profile.smokePreference,
      preferredFlavor: "UNKNOWN",
      aromaPreferences: profile.aromaPreferences ?? [],
      tastePreference: profile.tastePreference ?? "UNKNOWN",
      bodyPreference: profile.bodyPreference ?? "UNKNOWN",
      includeIndependentBottlings: profile.experienceLevel !== "BEGINNER" && includeIndependentBottlings,
      includeOldBottles: profile.experienceLevel !== "BEGINNER" && includeOldBottles,
    };

    if (v3Enabled) { await v3.run(request); return; }
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
      const payload = JSON.stringify(request);
      if (!pendingRequest.current || pendingRequest.current.payload !== payload) {
        pendingRequest.current = { payload, key: crypto.randomUUID() };
        setRecovering(false);
      }
      const response = await recommendationApi.getVerifiedPreview(request, pendingRequest.current.key);
      logVerifiedResponse("V2", "recommend", response);
      if (!isVerifiedResponse(response) ||
        ((response.state === "SUCCESS" || response.state === "DEGRADED") &&
          (!response.selected || !response.evidenceUrl?.startsWith("https://") ||
            !Number.isSafeInteger(response.recommendationId) || (response.recommendationId ?? 0) <= 0))) {
        setRecovering(true);
        setError("주문 결과를 확인하지 못했어요. 잠시 뒤 이전 주문 결과를 확인해 주세요.");
        return;
      }
      pendingRequest.current = null;
      setRecovering(false);
      setResult(response);

    } catch (caught) {
      if (caught instanceof ApiResponseError) logVerifiedResponse("V2", "recommend-error", caught.data, caught.status);
      if (caught instanceof ApiResponseError && caught.status === 401) {
        setRecommendationAuthExpired(true);
        setError("로그인 상태가 만료됐습니다. 다시 로그인해 주세요.");
      } else if (caught instanceof ApiResponseError && caught.status === 403) {
        setError("요청 인증에 실패했습니다. 화면을 새로고침한 뒤 다시 시도해 주세요.");
      } else if (caught instanceof ApiResponseError && isVerifiedResponse(caught.data)) {
        setRecovering(caught.data.code === "REQUEST_IN_PROGRESS");
        if (caught.data.code !== "REQUEST_IN_PROGRESS") pendingRequest.current = null;
        setResult(caught.data);
      } else if (caught instanceof ApiResponseError && caught.status >= 500) {
        setRecovering(pendingRequest.current !== null);
        setError("주문 처리 결과를 아직 확인하지 못했어요. 잠시 뒤 이전 주문 결과를 확인해 주세요.");
      } else if (caught instanceof ApiResponseError) {
        pendingRequest.current = null;
        setRecovering(false);
        setError("요청을 처리하지 못했습니다. 선택한 조건을 확인해 주세요.");
      } else {
        setRecovering(pendingRequest.current !== null);
        setError(caught instanceof ApiRequestTimeout ? "주문 결과를 아직 받지 못했어요. 선택은 그대로예요. 잠시 뒤 이전 주문 결과를 확인해 주세요." : "연결을 확인하지 못했어요. 잠시 뒤 이전 주문 결과를 확인해 주세요.");
      }
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const selected = (!v3Mode || !showForm) && (result?.state === "SUCCESS" || result?.state === "DEGRADED") ? result.selected : null;
  const appliedLevel = result?.appliedLevel;
  const unmatchedPreferenceMessages = result?.reasonCodes.flatMap((code) => {
    if (!selected) return [];
    if (code === "PREFERRED_MATURATION_CASK_NOT_MATCHED") return ["선호한 숙성 통과 다른 병이에요. 확인된 숙성 통은 아래 병 정보에서 살펴보세요."];
    if (code === "PREFERRED_FINISH_CASK_NOT_MATCHED") return ["선호한 피니시 통은 이번 병에서 확인되지 않았어요. 다른 풍미와 조건을 참고해 골랐습니다."];
    if (code.startsWith("AROMA_NOT_MATCHED_")) return ["선택한 향 중 일부는 이번 병의 설명에서 확인되지 않았어요. 바텐더의 한마디에서 맞는 향을 살펴보세요."];
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
  const displayedReasons = result?.presentation?.summary?.length ? result.presentation.summary : result ? recommendationReasons(result, appliedLevel ?? profile.experienceLevel) : [];
  const evidenceUrl = result?.evidenceUrl?.startsWith("https://") ? result.evidenceUrl : null;
  const regionCountryFilter = inputs.country || inputs.preferredCountry;
  const regionOptions = (facets?.regions ?? []).filter((region) => !regionCountryFilter || region.country === regionCountryFilter);
  const preferredCountries = (facets?.countries ?? []).filter((country) => !inputs.country || country.value === inputs.country);
  const categoryOptions = (facets?.categories ?? []).filter((category) => !inputs.country || !category.country || category.country === inputs.country);
  const preferredCategories = (facets?.categories ?? []).filter((category) => !(inputs.country || inputs.preferredCountry) || !category.country || category.country === (inputs.country || inputs.preferredCountry));
  const hardRegions = (facets?.regions ?? []).filter((region) => !inputs.country || region.country === inputs.country);
  const caskLabel = (value: string) => facets?.casks?.find((item) => item.value === value)?.label ?? ({ BOURBON: "버번 통", SHERRY: "셰리 통", WINE: "와인 통", PORT: "포트 통", RUM: "럼 통", VIRGIN_OAK: "새 오크 통", OTHER: "기타 통" } as Record<string,string>)[value] ?? value;
  const fieldChoiceClass = (active: boolean) => `cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#4a3728] ${
    active ? "border-[#2d2017] bg-[#4a3728]/10 font-bold text-[#2d2017]" :
      "border-[#4a3728]/30 bg-white/20 text-stone-700 hover:border-[#4a3728]/60"
  }`;

  return (
    <main className="flex min-h-dvh flex-col bg-[#1a120d] text-stone-100 selection:bg-amber-200/30">
      <nav className={`mx-auto flex w-full items-center justify-between gap-4 px-6 py-4 ${selected ? "max-w-2xl" : "max-w-5xl"}`}>
        <RecommendationBackLink href="/mood" />
        {(selected || aiResult && !showForm) && (
          <button type="button" disabled={feedbackLoading} onClick={() => v3Mode ? setShowForm(true) : setResult(null)} className="flex items-center gap-2 text-sm font-light text-stone-500 transition-colors hover:text-white disabled:opacity-50">
            조건 다시 고르기
          </button>
        )}
      </nav>

      <div className="flex flex-1 flex-col justify-center py-6 md:py-10">
      {v3Mode && <section aria-live="polite" className="mx-auto w-full max-w-3xl px-6 pb-4 text-sm leading-6">
        {v3.message && <p role="status" className="rounded border border-amber-200/30 bg-[#241b16] p-4"><strong className="mb-1 block">이번 주문 안내</strong>{v3.message}</p>}
        {v3.message && (v3.authRequired || !isAuthenticated) && <Link href="/login" className="mt-3 inline-block underline">로그인하고 이전 주문 확인하기</Link>}
        {v3.historicalId && <Link href={`/notes/verified/${v3.historicalId}`} className="mt-3 inline-block underline">당시 추천 기록 보기</Link>}
        {v3.missing && <div className="mt-3">
          <p>접수된 주문이 있으면 결과를 먼저 확인해요. 새 주문은 이 확인이 끝난 뒤 보낼 수 있어요.</p>
          <button type="button" disabled={v3.busy || feedbackLoading} onClick={()=>void v3.closeMissing()} className="mt-2 min-h-11 underline">접수 여부 확인 후 새 주문 준비</button>
        </div>}
        {showForm && (result?.recommendationId || aiResult) && <button type="button" onClick={()=>setShowForm(false)} className="mt-3 min-h-11 underline">이전 추천 카드 다시 보기</button>}
        {v3.pending && !showForm && <button type="button" disabled={v3.busy || feedbackLoading} onClick={()=>void v3.run()} className="mt-3 min-h-11 underline">이전 주문 결과 확인</button>}
      </section>}

      {!enabled ? (
        <p className="mx-auto mt-10 max-w-2xl rounded border border-stone-700 bg-[#241b16] p-5 text-sm">현재 검수 기반 추천을 사용할 수 없습니다.</p>
      ) : aiResult && !showForm ? (
        <section className="mx-auto w-full py-4">
          <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">오늘의 AI 추천 결과</h2>
          <WhiskeyAiSuggestionCard key={`${uid}:${aiResult.operationId}`} response={aiResult}/>
        </section>
      ) : !selected ? (
        <motion.div initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }} className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-4 md:gap-12 lg:grid-cols-2">
          <header className="flex flex-col justify-center space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-amber-300/80">Whiskey Recommendation</p>
            <h1 className="text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">오늘의 취향에 맞는<br />위스키를 찾아보세요</h1>
            <p className="max-w-md text-sm leading-6 text-stone-400 md:text-base">{aiEnabled ? "위스키 경험과 선호하는 향을 고르면 AI가 찾은 후보 중에서 오늘의 한 잔을 골라드려요. 제품 정보는 외부 교차검증 전인 제안이에요." : "위스키 경험과 선호하는 향을 고르면 확인된 병입 중에서 오늘의 한 잔을 추천해드립니다."}</p>
            {profile.experienceLevel !== "BEGINNER" && <p className="max-w-md text-sm leading-6 text-stone-500">익숙한 취향이 있다면 주문서에서 조건을 더 구체적으로 선택할 수 있습니다.</p>}
          </header>
          <form onSubmit={submit} noValidate aria-busy={loading || v3.busy} className="relative mx-auto w-full max-w-[550px] rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] md:p-8">
            <div className="pointer-events-none absolute inset-2 border border-[#4a3728]/20" />
            <div className="relative mb-5 flex items-center justify-between text-[12px] font-bold tracking-[0.2em] text-stone-700">
              <span>R-WHISKEY</span>
              <span>{todayStr}</span>
            </div>
            <div className="relative mb-6 text-center">
              <h2 className="inline-block border border-[#4a3728] bg-white/10 px-3 py-1 text-[13px] font-bold tracking-widest text-[#2d2017]">오늘의 주문</h2>
            </div>
            <fieldset disabled={loading || v3.busy} className="relative min-w-0">
              <fieldset className="mt-5">
                <legend className="text-sm font-bold">위스키 경험 단계</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
                    <label key={level} className={fieldChoiceClass(profile.experienceLevel === level)}>
                      <input type="radio" name="experienceLevel" checked={profile.experienceLevel === level}
                        onChange={() => {
                          const max = level === "BEGINNER" ? 2 : 4;
                          setLevelStatus((profile.aromaPreferences?.length ?? 0) > max ? "초심자는 먼저 고른 향 2개로 시작해요. 향을 다시 고를 수 있어요." : null);
                          setProfile((current) => ({ ...current, experienceLevel: level, aromaPreferences: (current.aromaPreferences ?? []).slice(0, max) }));
                        }} className="sr-only" />
                      {levelLabels[level]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <motion.p key={profile.experienceLevel} initial={{ opacity: reduceMotion ? 1 : 0 }} animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.18 }} className="mt-4 text-sm leading-6 text-stone-700">
                {profile.experienceLevel === "BEGINNER" ? "처음이라면 아래 두 가지만 골라도 됩니다. 잘 모르겠다면 그대로 추천받으세요." :
                  profile.experienceLevel === "INTERMEDIATE" ? "알고 있는 취향만 고르고, 필요하면 아래 조건으로 더 구체화하세요. 모르는 항목은 비워두어도 됩니다." :
                    (aiEnabled ? "제안된 병입 유형과 세부 정보를 함께 살펴봐요. 정확한 제품 정보는 외부 교차검증 전이에요." : "병입 유형과 검수된 세부 정보를 함께 살펴봅니다. 모르는 취향은 비워두어도 됩니다.")}
              </motion.p>
              {levelStatus && <p role="status" className="mt-2 text-xs text-amber-900">{levelStatus}</p>}
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
              {profile.smokePreference === "MILD" && <p className="mt-2 text-xs leading-5 text-stone-600">{aiEnabled ? "모델이 연기 향이 없거나 은은하다고 제안한 후보만 골라요. 실제 향을 확인한 것은 아니에요." : "연기 향이 없거나 은은하다고 확인된 병만 찾아요."} 향 정보가 없는 병은 제외됩니다.</p>}
              {profile.smokePreference === "BOLD" && <p className="mt-2 text-xs leading-5 text-stone-600">진한 연기 향을 우선 살펴보지만, 다른 병을 추천할 수도 있어요.</p>}
              <WhiskeyTasteFields profile={profile} onChange={setProfile} />
              <div hidden>
              <button type="button" onClick={() => void saveProfile()} disabled={!isAuthenticated}
                className="mt-4 text-sm font-semibold text-[#4a3728] underline disabled:opacity-50">이 선택을 기본 취향으로 저장</button>
              {profileStatus && <p role="status" className="mt-2 text-xs text-stone-700">{profileStatus}</p>}
              </div>
              {(profile.experienceLevel === "INTERMEDIATE" || (profile.experienceLevel === "ADVANCED" && v3Mode)) && <fieldset className="mt-6 border-t border-[#4a3728]/25 pt-4">
                <legend className="px-1 text-sm font-bold">병입 유형 넓히기</legend>
                <p className="mb-3 text-xs leading-5 text-stone-600">선택하면 독립 병입이나 올드바틀도 후보에 포함합니다.<br />구매 가능 여부는 별도로 확인해야 합니다.</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeIndependentBottlings}
                    onChange={(event) => setIncludeIndependentBottlings(event.target.checked)} />독립 병입 포함</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={includeOldBottles}
                    onChange={(event) => setIncludeOldBottles(event.target.checked)} />올드바틀 포함</label>
                </div>
              </fieldset>}
              {profile.experienceLevel === "ADVANCED" && !v3Mode && <div className="mt-6 border-t border-[#4a3728]/25 pt-4 text-sm">
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
              {profile.experienceLevel === "ADVANCED" && <div className="mt-4">
                <p className="mb-2 text-xs">도수 입력 단위</p><div className="flex gap-2">{(["ABV", "PROOF"] as const).map((unit) => <button key={unit} type="button"
                  aria-pressed={abvUnit === unit} className={fieldChoiceClass(abvUnit === unit)}
                  onClick={() => { if (unit === abvUnit) return; const factor = unit === "PROOF" ? 2 : 0.5;
                    setInputs((current) => ({ ...current, minAbv: current.minAbv ? String(Number((Number(current.minAbv)*factor).toFixed(3))) : "",
                      maxAbv: current.maxAbv ? String(Number((Number(current.maxAbv)*factor).toFixed(3))) : "", targetAbv: current.targetAbv ? String(Number((Number(current.targetAbv)*factor).toFixed(3))) : "" })); setAbvUnit(unit); }}>{unit === "ABV" ? "ABV %" : "US Proof"}</button>)}</div>
                <p className="mt-2 text-xs text-stone-600">미국식 Proof는 ABV의 2배예요. 단위를 바꿔도 같은 도수가 유지됩니다.</p>
              </div>}
              <h3 className="mt-6 text-sm font-bold">꼭 맞아야 할 조건 (선택)</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">{aiEnabled ? "모델이 제안한 제품 정보가 선택한 조건에 맞는 후보만 골라요. 실제 제품 사실을 확인한 것은 아니에요." : "선택한 조건에 맞는 병입만 추천합니다."}<br />고르지 않아도 됩니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FacetField label="생산 국가" value={inputs.country} options={facets?.countries ?? []} strength="hard" onChange={(value) => update("country", value)} disabled={!facets} />
                <FacetField label="위스키 종류" value={inputs.category} options={categoryOptions} countries={facets?.countries ?? []} strength="hard" onChange={(value) => update("category", value)} disabled={!facets} />
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput unit={abvUnit} label={abvUnit === "ABV" ? "최소 도수 (ABV %)" : "최소 도수 (US Proof)"} value={inputs.minAbv} onChange={(value) => update("minAbv", value)} />}
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput unit={abvUnit} label={abvUnit === "ABV" ? "최대 도수 (ABV %)" : "최대 도수 (US Proof)"} value={inputs.maxAbv} onChange={(value) => update("maxAbv", value)} />}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FacetField label="세부 산지" value={inputs.region} options={hardRegions} countries={facets?.countries ?? []} strength="hard" onChange={(value) => update("region", value)} disabled={!facets} />
                <FacetField label="숙성에 사용한 통" value={inputs.maturationCask} options={facets?.casks ?? []} strength="hard" onChange={(value) => update("maturationCask", value)} disabled={!facets?.casks} />
                <FacetField label="피니시에 사용한 통" value={inputs.finishCask} options={facets?.casks ?? []} strength="hard" onChange={(value) => update("finishCask", value)} disabled={!facets?.casks} />
              </div>
              <p className="mt-2 text-xs leading-5 text-stone-600">숙성 통은 위스키를 숙성한 통이에요.<br />피니시는 마지막에 다른 통에서 더 숙성하는 방식이에요. {aiEnabled ? "통 정보가 미확인인 후보는 이 조건을 충족한 것으로 보지 않아요. 제안된 정보는 교차검증 전이에요." : "확인된 통 정보가 있는 병만 조건에 맞춰요."}</p>
              <h3 className="mt-8 text-sm font-bold">가능하면 맞춰줄 취향</h3>
              <p className="mt-2 text-xs leading-5 text-stone-600">선호가 맞지 않아도 다른 위스키를 추천할 수 있습니다.<br />결과에서 차이를 알려드립니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <FacetField label="선호하는 생산 국가" value={inputs.preferredCountry} options={preferredCountries} strength="soft" onChange={(value) => update("preferredCountry", value)} disabled={!facets} />
                <FacetField label="선호하는 위스키 종류" value={inputs.preferredCategory} options={preferredCategories} countries={facets?.countries ?? []} strength="soft" onChange={(value) => update("preferredCategory", value)} disabled={!facets} />
                <FacetField label="선호하는 세부 산지" value={inputs.preferredRegion} options={regionOptions} countries={facets?.countries ?? []} strength="soft" onChange={(value) => update("preferredRegion", value)} disabled={!facets} />
                {profile.experienceLevel === "ADVANCED" && <PaperAbvInput unit={abvUnit} label={abvUnit === "ABV" ? "선호 도수 (ABV %)" : "선호 도수 (US Proof)"} value={inputs.targetAbv} onChange={(value) => update("targetAbv", value)} />}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FacetField label="선호하는 숙성 통" value={inputs.preferredMaturationCask} options={facets?.casks ?? []} strength="soft" onChange={(value) => update("preferredMaturationCask", value)} disabled={!facets?.casks} />
                <FacetField label="선호하는 피니시 통" value={inputs.preferredFinishCask} options={facets?.casks ?? []} strength="soft" onChange={(value) => update("preferredFinishCask", value)} disabled={!facets?.casks} />
              </div>
              {inputs.country && <p className="mt-3 text-xs leading-5 text-stone-600">꼭 맞아야 할 생산 국가 안에서 취향을 고를 수 있어요.</p>}
              </PaperDisclosure>}
              {error && <div role="alert" className="mt-5 rounded border border-red-700/30 bg-red-100 p-3 text-sm text-red-900">
                <p>{error}</p>
                {recommendationAuthExpired && <Link href="/login" className="mt-2 inline-block font-semibold underline">다시 로그인</Link>}
              </div>}
              {!v3Mode && result && <p role="status" className="mt-5 rounded border border-[#4a3728]/25 bg-white/30 p-3 text-sm leading-6 text-stone-800">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}
              {result?.state === "NO_MATCH" && result.code === "NO_CANDIDATE_MATCHES_REQUIREMENTS" && hasDetailedConditions &&
                (Boolean(inputs.category || inputs.country || inputs.region || inputs.maturationCask || inputs.finishCask) ||
                  (profile.experienceLevel === "ADVANCED" && Boolean(inputs.minAbv || inputs.maxAbv))) &&
                <button type="button" onClick={() => {
                  setInputs((current) => ({ ...current, category: "", country: "", region: "", maturationCask: "", finishCask: "", minAbv: "", maxAbv: "" }));
                  setResult(null);
                }} className="mt-3 text-sm font-semibold underline">꼭 맞아야 할 조건 지우기</button>}
              {!isAuthenticated && isInitialized && <Link href="/login" className="mt-4 block text-sm font-semibold underline">로그인하러 가기</Link>}
              {(recovering || v3.pending) && <p role="status" className="mt-4 text-sm text-stone-700">이전 주문은 접수할 때 고른 조건으로 확인해요. 지금 바꾼 선택은 다음 주문에 적용돼요.</p>}
              <button type="submit" disabled={loading || v3.busy || !isAuthenticated || !isInitialized}
                className="mt-7 w-full bg-[#111] px-5 py-3 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] disabled:cursor-not-allowed disabled:opacity-60">
                {loading || v3.busy ? "주문을 살펴보고 있어요…" : recovering || v3.pending ? "이전 주문 결과 확인" : v3Mode && !v3Enabled ? "새 주문 접수 닫힘" : "위스키 추천 받기"}
              </button>
              </fieldset>
            </form>
        </motion.div>
      ) : (
        <motion.section initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }} className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-4">
          <h2 ref={resultHeadingRef} tabIndex={-1} className="sr-only">오늘의 추천 결과</h2>
          {result && <article className="relative flex w-full max-w-md flex-col items-center rounded-sm border border-[#4a3728] bg-[#e5d5b7] p-7 pt-12 text-stone-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:p-10 md:pt-14">
                  <div className="absolute inset-x-7 top-5 flex justify-between text-[10px] font-bold tracking-widest text-stone-600 md:inset-x-10">
                    <span>No. {String(result.recommendationId).padStart(3, "0")}</span>
                    <span>{savedAt ? new Date(savedAt).toLocaleDateString("ko-KR") : todayStr}</span>
                  </div>
                  <p className="mb-4 border border-[#4a3728] px-3 py-1 text-[10px] font-bold tracking-[0.2em]">{v3Mode && v3.message ? "이전 추천" : "오늘의 추천"}</p>
                  <WhiskeyBottleImage key={selected.bottlingId} url={selected.details?.experience?.imageUrl} name={selected.displayName} />
                  <h3 className="mt-3 text-center text-2xl font-bold leading-tight">{selected.displayName}</h3>
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
                    <ul className="mt-1 list-inside list-disc">{[...new Set(unmatchedPreferenceMessages)].map((message) => <li key={message}>{message}</li>)}</ul>
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
                    <Fact label="숙성 통" value={selected.details?.experience?.maturationCasks.map(caskLabel).join(" · ") || null} />
                    <Fact label="피니시 통" value={selected.details?.experience?.finishCasks.map(caskLabel).join(" · ") || null} />
                    <Fact label="캐스크 번호" value={selected.details?.experience?.caskNumber ?? null} />
                    <Fact label="배치" value={selected.batchCode ?? null} />
                    <Fact label="증류 연도" value={selected.vintageYear ? String(selected.vintageYear) : null} />
                    <Fact label="출시 연도" value={selected.releaseYear ? String(selected.releaseYear) : null} />
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
                  {Boolean(result.presentation?.pairings.length) && <div className="mt-5 w-full border-t border-[#4a3728]/25 pt-4">
                    <h4 className="text-sm font-bold">함께 즐겨볼 안주</h4>
                    {result.presentation?.pairings.map((item) => <p key={item.food} className="mt-2 text-sm leading-6"><strong>{item.food}</strong> — {item.reason}</p>)}
                    <p className="mt-2 text-xs text-stone-600">풍미를 참고한 제안이에요. 알레르기와 개인 취향을 확인해 주세요.</p>
                  </div>}
                  <Link href={`/notes/verified/${result.recommendationId}`} className="mt-6 min-h-11 w-full border border-[#4a3728] px-3 py-3 text-center text-sm font-semibold">마신 뒤 시음 기록 남기기</Link>
                  <p className="mt-2 text-xs text-stone-600">나중에 내 시음 노트에서도 이 추천을 다시 찾을 수 있어요.</p>
                  <div className="mt-7 w-full border-t border-[#4a3728]/25 pt-4 text-center">
                    <span className="text-[9px] font-bold uppercase italic tracking-widest text-stone-600">R-Whiskey Selection</span>
                  </div>
                </article>}
              {result?.recommendationId && (
                <ExpectationFeedback sentiment={feedbackSentiment} reason={feedbackReason} savedSentiment={savedFeedbackSentiment}
                  loading={feedbackLoading} status={feedbackStatus} authExpired={feedbackAuthExpired}
                  comment={feedbackComment} onComment={setFeedbackComment}
                  onSentiment={(value) => { setFeedbackSentiment(value); setFeedbackReason("NONE"); setFeedbackComment(""); setFeedbackStatus(null); }}
                  onReason={(value) => { setFeedbackReason(value); setFeedbackComment(""); setFeedbackStatus(null); }} onSave={() => void sendFeedback()} />
              )}
        </motion.section>
      )}
      </div>
      <WhiskeyLoadingOverlay active={loading || v3.busy} messages={orderMessages} />
    </main>
  );
}

function FacetField({ label, value, options, countries = [], strength, onChange, disabled }: {
  label: string; value: string;
  options: WhiskeyCatalogFacet[]; countries?: WhiskeyCatalogFacet[]; strength: "hard" | "soft"; onChange: (value: string) => void; disabled: boolean;
}) {
  const matchedOption = options.find((option) => option.value === value);
  const unavailable = value && matchedOption?.countKnown !== false && matchedOption?.bottlingCount === 0;
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
