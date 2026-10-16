import type { WhiskeyCandidateRequest, WhiskeyVerifiedRecommendationResponse } from '../../type/ApiInterface';

export interface V3Request {
  experienceLevel: NonNullable<WhiskeyCandidateRequest['experienceLevel']>;
  hardConditions: NonNullable<WhiskeyCandidateRequest['requirements']>;
  preferences: {
    aromas: NonNullable<WhiskeyCandidateRequest['aromaPreferences']>;
    taste: NonNullable<WhiskeyCandidateRequest['tastePreference']>;
    body: NonNullable<WhiskeyCandidateRequest['bodyPreference']>;
    smoke: NonNullable<WhiskeyCandidateRequest['smokePreference']>;
    category?: string; country?: string; region?: string; targetAbv?: number;
    maturationCask?: string; finishCask?: string;
  };
  explorationIntent: 'BALANCED';
  includeIndependentBottlings: boolean;
  includeOldBottles: boolean;
}
export interface V3Response {
  apiVersion: 'V3';
  state: 'SUCCESS' | 'IN_PROGRESS' | 'NO_MATCH' | 'NEEDS_CLARIFICATION' | 'NEEDS_REVIEW' | 'UNAVAILABLE';
  code?: string | null;
  nextAction: 'NONE' | 'RECOVER' | 'EDIT_REQUEST' | 'NEW_REQUEST' | 'LOGIN';
  operationId?: string | null;
  recommendationId?: number | null;
  historicalRecordId?: number | null;
  selected?: WhiskeyVerifiedRecommendationResponse['selected'];
  presentation?: WhiskeyVerifiedRecommendationResponse['presentation'];
  evidenceUrl?: string | null;
  appliedLevel?: WhiskeyCandidateRequest['experienceLevel'];
  recommendedAt?: string | null;
  verification?: { atRecommendation: 'V3_CERTIFIED'; current: string; certificateId: string; policyVersion: string } | null;
  requestSummary?: V3Request | null;
}

/** No silently dropped hard constraints or free text from an older contract. */
export function toV3Request(input: WhiskeyCandidateRequest): V3Request {
  const h = input.requirements ?? {}; const c = input.context ?? {};
  if (h.excludedBottlingIds?.length || c.weather || c.mood || c.additionalContext || c.preferredFlavor ||
      (input.preferredFlavor && input.preferredFlavor !== 'UNKNOWN')) throw new Error('UNSUPPORTED_V3_INPUT');
  const { excludedBottlingIds: _excluded, ...hardConditions } = h;
  void _excluded;
  return {
    experienceLevel: input.experienceLevel ?? 'BEGINNER', hardConditions,
    preferences: { aromas: input.aromaPreferences ?? [], taste: input.tastePreference ?? 'UNKNOWN',
      body: input.bodyPreference ?? 'UNKNOWN', smoke: input.smokePreference ?? 'UNKNOWN',
      category: c.preferredCategory, country: c.preferredCountry, region: c.preferredRegion,
      targetAbv: c.targetAbv, maturationCask: c.preferredMaturationCask, finishCask: c.preferredFinishCask },
    explorationIntent: 'BALANCED', includeIndependentBottlings: input.includeIndependentBottlings ?? false,
    includeOldBottles: input.includeOldBottles ?? false,
  };
}
export function isV3Response(input: unknown): input is V3Response {
  if (!input || typeof input !== 'object') return false;
  const v = input as Record<string, unknown>;
  return v.apiVersion === 'V3' && ['SUCCESS','IN_PROGRESS','NO_MATCH','NEEDS_CLARIFICATION','NEEDS_REVIEW','UNAVAILABLE'].includes(String(v.state)) &&
    ['NONE','RECOVER','EDIT_REQUEST','NEW_REQUEST','LOGIN'].includes(String(v.nextAction));
}
/** Reuse visual card only after a durable, currently verified result. */
export function toVerifiedCard(v: V3Response): WhiskeyVerifiedRecommendationResponse | null {
  if (v.state !== 'SUCCESS' || v.verification?.atRecommendation !== 'V3_CERTIFIED' || v.verification.current !== 'CURRENT' ||
      !v.verification.certificateId || !v.selected || !v.presentation || !Array.isArray(v.presentation.summary) ||
      !Array.isArray(v.presentation.pairings) || !v.evidenceUrl?.startsWith('https://') ||
      !Number.isSafeInteger(v.recommendationId) || (v.recommendationId ?? 0) < 1 ||
      !v.recommendedAt || !Number.isFinite(Date.parse(v.recommendedAt)) ||
      typeof v.selected.displayName !== 'string' || !v.selected.displayName.trim() ||
      !Number.isSafeInteger(v.selected.productId) || v.selected.productId < 1 ||
      !Number.isSafeInteger(v.selected.bottlingId) || v.selected.bottlingId < 1 ||
      !v.presentation.summary.every(x=>typeof x==='string') ||
      !v.presentation.pairings.every(x=>typeof x?.food==='string' && typeof x?.reason==='string')) return null;
  return { state:'SUCCESS', code:'V3_SAVED', retryable:false, selected:v.selected, presentation:v.presentation,
    recommendationId:v.recommendationId, evidenceUrl:v.evidenceUrl, appliedLevel:v.appliedLevel, reasonCodes:[] };
}
