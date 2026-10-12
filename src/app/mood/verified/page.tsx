"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { recommendationApi } from "@/api/whiskeyApi";
import { ApiResponseError } from "@/api/apiClient";
import { useAuthStore } from "@/store/authStore";
import type { WhiskeyCandidateRequest, WhiskeyVerifiedRecommendationResponse } from "@/type/ApiInterface";

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
  const busy = useRef(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const enabled = process.env.NEXT_PUBLIC_WHISKEY_V2_ENABLED === "true";

  useEffect(() => {
    if (enabled && !isInitialized) void fetchUser();
  }, [enabled, isInitialized, fetchUser]);

  function update(key: InputKey, value: string) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !enabled) return;
    setError(null);
    setResult(null);

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
    };

    busy.current = true;
    setLoading(true);
    try {
      const response = await recommendationApi.getVerifiedPreview(request);
      if (!isVerifiedResponse(response) ||
        ((response.state === "SUCCESS" || response.state === "DEGRADED") &&
          (!response.selected || !response.evidenceUrl?.startsWith("https://")))) {
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
  const evidenceUrl = result?.evidenceUrl?.startsWith("https://") ? result.evidenceUrl : null;

  return (
    <main className="min-h-screen bg-[#1a120d] px-5 py-8 text-stone-100 md:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/mood" className="text-sm text-amber-200 hover:underline">← 기존 추천으로 돌아가기</Link>
        <header className="mt-10 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] text-amber-300">VERIFIED WHISKEY PREVIEW</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">검수 기반 위스키 추천</h1>
          <p className="mt-4 text-sm leading-6 text-stone-300">필수 조건으로 후보를 찾고, 선호 조건으로 순서를 정한 뒤 공식 근거와 모델 판정을 확인합니다.</p>
          <p className="mt-2 text-xs leading-5 text-stone-400">이 화면은 미리보기입니다. 결과 저장·시음 노트 연결·사용자 레벨별 입력은 다음 단계에서 연결됩니다.</p>
        </header>

        {!enabled ? (
          <p className="mt-10 rounded-lg border border-stone-700 bg-stone-900 p-5 text-sm">현재 검수 기반 추천 미리보기가 꺼져 있습니다.</p>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <form onSubmit={submit} className="rounded-lg border border-amber-900/50 bg-[#e9dcc1] p-5 text-stone-900 shadow-xl md:p-7">
              <h2 className="font-serif text-xl font-bold">추천 조건</h2>
              <p className="mt-2 text-xs text-stone-600">필수 조건은 일치하는 병입만 남깁니다. 비워두면 제한하지 않습니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="필수 분류" value={inputs.category} onChange={(value) => update("category", value)} placeholder="예: Single Malt" />
                <Field label="필수 국가" value={inputs.country} onChange={(value) => update("country", value)} placeholder="예: Scotland" />
                <Field label="최소 도수 (%)" value={inputs.minAbv} onChange={(value) => update("minAbv", value)} type="number" />
                <Field label="최대 도수 (%)" value={inputs.maxAbv} onChange={(value) => update("maxAbv", value)} type="number" />
              </div>
              <h2 className="mt-8 font-serif text-xl font-bold">선호 조건</h2>
              <p className="mt-2 text-xs text-stone-600">선호 조건은 후보를 제외하지 않고 순위에 반영합니다.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="선호 분류" value={inputs.preferredCategory} onChange={(value) => update("preferredCategory", value)} placeholder="예: Single Malt" />
                <Field label="선호 국가" value={inputs.preferredCountry} onChange={(value) => update("preferredCountry", value)} placeholder="예: Scotland" />
                <Field label="선호 지역" value={inputs.preferredRegion} onChange={(value) => update("preferredRegion", value)} placeholder="예: Speyside" />
                <Field label="선호 도수 (%)" value={inputs.targetAbv} onChange={(value) => update("targetAbv", value)} type="number" />
              </div>
              {error && <p role="alert" className="mt-5 rounded border border-red-700/30 bg-red-100 p-3 text-sm text-red-900">{error}</p>}
              {!isAuthenticated && isInitialized && <Link href="/login" className="mt-4 block text-sm font-semibold underline">로그인하러 가기</Link>}
              <button type="submit" disabled={loading || !isAuthenticated || !isInitialized}
                className="mt-7 w-full rounded bg-[#2b1b10] px-5 py-3 font-semibold text-white hover:bg-[#50311d] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "공식 근거와 병입 정보를 확인하는 중…" : "검수 기반 추천 받기"}
              </button>
            </form>

            <section aria-live="polite" className="rounded-lg border border-stone-700 bg-[#241b16] p-5 shadow-xl md:p-7">
              <h2 className="font-serif text-xl font-bold">추천 결과</h2>
              {!result && !loading && <p className="mt-5 text-sm text-stone-400">조건을 입력하고 추천을 요청하면 이곳에 결과가 표시됩니다.</p>}
              {loading && <p className="mt-5 text-sm text-amber-200">검수된 후보를 확인하고 있습니다. 중복 요청은 보내지 않습니다.</p>}
              {result && <p role="status" className="mt-5 text-sm leading-6 text-stone-200">{result.code ? codeMessages[result.code] ?? stateMessages[result.state] : stateMessages[result.state]}</p>}
              {selected && result && (
                <article className="mt-6 rounded-md border border-amber-700/40 bg-[#e9dcc1] p-6 text-stone-900">
                  <p className="text-xs font-semibold tracking-widest text-stone-600">{result.state === "DEGRADED" ? "대체 제공자 확인" : "공식 근거 확인"}</p>
                  <h3 className="mt-3 font-serif text-2xl font-bold">{selected.displayName}</h3>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <Fact label="분류" value={selected.category} />
                    <Fact label="국가" value={selected.country} />
                    <Fact label="지역" value={selected.region} />
                    <Fact label="병입 구분" value={selected.edition} />
                    <Fact label="도수" value={selected.abv === null ? null : `${selected.abv}%`} />
                    <Fact label="용량" value={selected.volumeMl === null ? null : `${selected.volumeMl}ml`} />
                    <Fact label="연산" value={selected.ageStatementType === "NUMBERED" && selected.ageYears !== null ? `${selected.ageYears}년` : selected.ageStatementType === "NAS" ? "NAS" : null} />
                  </dl>
                  <div className="mt-5 border-t border-stone-400/40 pt-4">
                    <p className="text-xs font-bold">선정 근거</p>
                    <ul className="mt-2 list-inside list-disc text-sm leading-6">
                      {result.reasonCodes.map((code) => reasonMessages[code]).filter((message): message is string => Boolean(message)).map((message) => <li key={message}>{message}</li>)}
                    </ul>
                  </div>
                  {evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block text-sm font-semibold text-amber-900 underline">확인된 공식 근거 보기 ↗</a>}
                </article>
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
        step={type === "number" ? "0.1" : undefined} maxLength={type === "text" ? 100 : undefined}
        placeholder={placeholder}
        className="mt-2 w-full rounded border border-stone-500/60 bg-white/70 px-3 py-2 text-sm font-normal text-stone-900 outline-none focus:border-amber-700" />
    </label>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs text-stone-600">{label}</dt><dd className="mt-1 font-medium">{value || "미확인"}</dd></div>;
}
