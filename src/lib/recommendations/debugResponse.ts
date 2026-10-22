const responseFields = [
  "apiVersion", "state", "code", "nextAction", "retryable", "operationId",
  "recommendationId", "historicalRecordId", "selected", "presentation", "evidenceUrl",
  "appliedLevel", "recommendedAt", "verification", "requestSummary", "reasonCodes",
] as const;
const sensitiveKey = /password|secret|token|authorization|cookie|api[_-]?key|email|user[_-]?id|^uid$|idempotency/i;
const candidateFields = new Set([
  "brand", "expression", "edition", "batch", "bottler", "market", "category", "country", "region", "abv",
  "ageStatement", "ageYears", "vintageYear", "bottledYear", "caskNumber", "maturationCask", "finishCask",
  "independentBottling", "oldBottle", "sourceUrlHints",
]);

function safeSnapshot(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value, (key, entry: unknown) => {
    if (sensitiveKey.test(key)) return undefined;
    if (typeof entry === "string" && /^https?:\/\//i.test(entry)) {
      try {
        const url = new URL(entry);
        url.username = "";
        url.password = "";
        for (const name of Array.from(url.searchParams.keys())) if (sensitiveKey.test(name)) url.searchParams.delete(name);
        return url.toString();
      } catch { return "[invalid URL]"; }
    }
    return entry;
  }));
}

/** Browser development diagnostics only; never log request/config/credentials. */
export function logVerifiedResponse(version: "V2" | "V3", operation: string, response: unknown, httpStatus?: number) {
  if (process.env.NODE_ENV !== "development") return;
  const body = response !== null && typeof response === "object" && !Array.isArray(response)
    ? response as Record<string, unknown> : null;
  if (version === "V3" && body && Array.isArray(body._devGeminiCandidates)) {
    if (body._devGeminiCandidates.length === 0) console.log("[Gemini Candidate List]", { operation, rounds: [], note: "이번 응답에는 추출 가능한 Gemini 후보 리스트가 없습니다. 이전 결과 재생·생성 전 종료·불완전 응답일 수 있으며, 모델 호출이 없었다는 뜻은 아닙니다." });
    for (const round of body._devGeminiCandidates.slice(0, 2)) {
      if (!round || typeof round !== "object" || !Array.isArray(round.candidates)) continue;
      const candidates = round.candidates.slice(0, 5).map((row: unknown) => row && typeof row === "object" && !Array.isArray(row)
        ? Object.fromEntries(Object.entries(row).filter(([key]) => candidateFields.has(key))) : null);
      console.log("[Gemini Candidate List]", safeSnapshot({ operation, round: round.round,
        stage: "GEMINI_BEFORE_CANDIDATE_VALIDATION", verificationStatus: "UNVERIFIED", candidates }));
    }
  }
  const fields = body ? Object.fromEntries(responseFields.filter((key) => key in body).map((key) => [key, body[key]])) : null;
  const snapshot = safeSnapshot(fields);
  console.log("[Whiskey Verified Response]", { version, operation, httpStatus: httpStatus ?? null, response: snapshot });
}
