/**
 * Authentication
 */
export interface SignupRequest {
  email: string;
  pw: string;
  name: string;
}

export interface SignupResponse {
  uid: number;
  email: string;
  name: string;
  message: string;
}

export interface LoginRequest {
  email: string;
  pw: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  uid: number | null;
  email: string | null;
  name: string | null;
}

export interface MeResponse {
  authenticated: boolean;
  uid: number | null;
  email: string | null;
  name: string | null;
}

/**
 * Recommendation
 */
export interface RecommendationSaveRequest {
  weatherValue?: string;
  moodValue?: string;
  abvValue?: string;
  additionalValue?: string;
  flexFlag: boolean;
  mainTag?: string;
  whiskyName: string;
  whiskyNameEn?: string;
  classification?: string;
  regionName?: string;
  styleName?: string;
  featureTags?: string[];
  foodName?: string;
  pairingNote?: string;
  bartenderWord?: string;
}

export interface WhiskeyCatalogFacet {
  value: string;
  bottlingCount: number;
  label: string;
  country: string | null;
  countKnown?: boolean;
}

export interface WhiskeyCatalogFacetsResponse {
  categories: WhiskeyCatalogFacet[];
  countries: WhiskeyCatalogFacet[];
  regions: WhiskeyCatalogFacet[];
  casks?: WhiskeyCatalogFacet[];
  code: string | null;
}
/** W-03 candidate lookup contract, also used by the W-06 verified preview. */
export interface WhiskeyCandidateRequest {
  requirements?: {
    category?: string;
    country?: string;
    minAbv?: number;
    maxAbv?: number;
    excludedBottlingIds?: number[];
    region?: string;
    maturationCask?: string;
    finishCask?: string;
  };
  context?: {
    weather?: string;
    mood?: string;
    preferredFlavor?: string;
    additionalContext?: string;
    preferredCategory?: string;
    preferredCountry?: string;
    preferredRegion?: string;
    targetAbv?: number;
    preferredMaturationCask?: string;
    preferredFinishCask?: string;
  };
  limit?: number;
  experienceLevel?: WhiskeyExperienceLevel;
  smokePreference?: WhiskeySmokePreference;
  preferredFlavor?: WhiskeyFlavorPreference;
  includeIndependentBottlings?: boolean;
  includeOldBottles?: boolean;
  aromaPreferences?: WhiskeyAroma[];
  tastePreference?: WhiskeyTastePreference;
  bodyPreference?: WhiskeyBodyPreference;
}

export type WhiskeyExperienceLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type WhiskeySmokePreference = "UNKNOWN" | "ALLOW" | "AVOID" | "MILD" | "BOLD";
export type WhiskeyAroma = "VANILLA_CARAMEL" | "FRESH_FRUIT" | "DRIED_FRUIT" | "FLORAL_HERBAL" | "CEREAL_NUTTY" | "ROASTED_COCOA" | "WOODY_SPICY";
export type WhiskeyTastePreference = "UNKNOWN" | "SWEET" | "DRY" | "BITTER" | "SOUR" | "SALTY" | "UMAMI";
export type WhiskeyBodyPreference = "UNKNOWN" | "LIGHT" | "FULL";
export type WhiskeyFlavorPreference = "UNKNOWN" | "SWEET" | "FRUITY";
export type WhiskeyFeedbackStage = "EXPECTED" | "CONSUMED";
export type WhiskeyFeedbackSentiment = "LIKE" | "NEUTRAL" | "DISLIKE";
export type WhiskeyFeedbackReason = "TASTE" | "PRICE" | "AVAILABILITY" | "OTHER" | "NONE";

export interface WhiskeyProfile {
  experienceLevel: WhiskeyExperienceLevel;
  smokePreference: WhiskeySmokePreference;
  preferredFlavor: WhiskeyFlavorPreference;
  aromaPreferences?: WhiskeyAroma[];
  tastePreference?: WhiskeyTastePreference;
  bodyPreference?: WhiskeyBodyPreference;
}

export interface WhiskeyFeedback {
  recommendationId: number;
  stage: WhiskeyFeedbackStage;
  sentiment: WhiskeyFeedbackSentiment;
  reason: WhiskeyFeedbackReason;
  comment?: string | null;
  updatedAt: string;
}

export type WhiskeyCandidateState =
  | "CANDIDATES_AVAILABLE"
  | "CATALOG_NOT_READY"
  | "NO_MATCH"
  | "NEEDS_CLARIFICATION"
  | "DATA_SOURCE_UNAVAILABLE";

export interface WhiskeyCandidateResponse {
  state: WhiskeyCandidateState;
  code: string | null;
  retryable: boolean;
  candidates: Array<{
    productId: number;
    bottlingId: number;
    displayName: string;
    category: string | null;
    country: string | null;
    region: string | null;
    edition: string | null;
    abv: number | null;
    volumeMl: number | null;
    ageStatementType: "NUMBERED" | "NAS" | "UNKNOWN";
    ageYears: number | null;
    batchCode?: string | null;
    vintageYear?: number | null;
    releaseYear?: number | null;
    verificationBasis?: "PRIMARY" | "CORROBORATED";
    verificationPolicy?: string;
    details?: {
      smokeLevel: number | null;
      sweetnessLevel: number | null;
      fruitLevel: number | null;
      spiceLevel: number | null;
      releaseType: "UNKNOWN" | "CORE" | "LIMITED";
      independentBottling: boolean | null;
      oldBottle: boolean | null;
      bottlerName: string | null;
      bottledYear: number | null;
      characteristicsEvidenceUrl: string | null;
      availabilityStatus: "UNKNOWN" | "AVAILABLE" | "SOLD_OUT" | "DISCONTINUED";
      availabilitySeller: string | null;
      availabilityRegion: string | null;
      availabilityCheckedAt: string | null;
      experience?: WhiskeyExperienceDetails | null;
    } | null;
  }>;
}

export type WhiskeyVerifiedState =
  | "SUCCESS"
  | "DEGRADED"
  | "CATALOG_NOT_READY"
  | "NO_MATCH"
  | "NEEDS_CLARIFICATION"
  | "NEEDS_REVIEW"
  | "UNAVAILABLE";

export interface WhiskeyVerifiedRecommendationResponse {
  state: WhiskeyVerifiedState;
  code: string | null;
  retryable: boolean;
  selected: WhiskeyCandidateResponse["candidates"][number] | null;
  reasonCodes: string[];
  evidenceUrl: string | null;
  appliedLevel?: WhiskeyExperienceLevel | null;
  recommendationId?: number | null;
  presentation?: WhiskeyPresentation | null;
}

export interface WhiskeyExperienceDetails {
  aromaTags: WhiskeyAroma[];
  tasteLevels: Record<string, number>;
  bodyLevel: number | null;
  maturationCasks: string[];
  finishCasks: string[];
  caskNumber: string | null;
  imageUrl: string | null;
  imageSourceUrl: string | null;
  sourceUrls: string[];
}
export interface WhiskeyPresentation {
  summary: string[];
  pairings: { food: string; reason: string; sourceUrl: string }[];
}
export interface WhiskeySavedRecommendation {
  id: number;
  experienceLevel: WhiskeyExperienceLevel;
  createdAt: string;
  selected: WhiskeyCandidateResponse["candidates"][number] | null;
  presentation: WhiskeyPresentation | null;
  snapshotAvailable: boolean;
}
export interface WhiskeyTastingNoteRequest {
  tastedOn?: string | null;
  nose?: string | null;
  palate?: string | null;
  finish?: string | null;
  memo?: string | null;
  rating?: number | null;
  sentiment?: WhiskeyFeedbackSentiment | null;
}
export interface WhiskeyTastingNoteResponse extends WhiskeyTastingNoteRequest {
  recommendation: WhiskeySavedRecommendation;
  updatedAt: string | null;
}
export interface WhiskeyTastingNoteSummary {
  recommendationId: number;
  displayName: string;
  edition: string | null;
  rating: number | null;
  updatedAt: string;
}

/**
 * Tags
 */
export interface TagResponse {
  id: number;
  label: string;
}

/**
 * Gemini AI Response (Frontend specific)
 */
export interface GeminiWhiskyResponse {
  whiskyName: string;
  whiskyNameEn: string;
  classification: string;
  featureTags: string[];
  foodName: string;
  pairingNote: string;
  bartenderWord: string;
  regionName: string;
  styleName: string;
}

export interface GeminiCocktailResponse {
  cocktailName: string;
  baseSpirit: string;
  abv: string;
  foodPairing: string;
  bartenderMessage: string;
  tastingNote: string;
  checkList: string[];
  method: string[];
}

/**
 * Cocktail Recommendation Save Request
 */
export interface CocktailSaveRequest {
  experienceLevel: string;
  isNonAlcoholic: boolean;
  preferredTaste: string[];
  carbonation: boolean;
  dislikes: string[];
  currentMood: string;
  requestBaseSpirit: string;
  cocktailName: string;
  responseBaseSpirit: string;
  abv: string;
  foodName: string;
  bartenderWord: string;
  pairingNote: string;
  images: string[];
  checkList: string[];
  method: string[];
}

/**
 * Tasting Note API
 */
export interface NoteResponse {
  id: number;
  oid: number;
  status: string;
  whiskeyName: string;
  whiskeyNameEn: string;
  whiskeyCategory: string;
  regionId?: number;
  styleId?: number;
  featureTags?: string[];
  foodName: string;
  pairingNote: string;
  bartenderWord: string;
  weatherValue: string;
  moodValue: string;
  abvValue: string;
  additionalValue: string;
  recommendedAt: string;
  reviewType: "BASIC" | "FREE";
  rating: number;
  nose: string;
  palate: string;
  finish: string;
  memo: string;
  shared: boolean;
  ratedAt: string;
  isScrapped: boolean;
  ownerNickname: string;
}

export interface NoteReviewRequest {
  reviewType: "BASIC" | "FREE";
  rating?: number;
  nose?: string;
  palate?: string;
  finish?: string;
  memo?: string;
  shared: boolean;
}

/**
 * User Token API
 */
export interface TokenStatusResponse {
  dailyLimit: number;
  usedCount: number;
  remaining: number;
}
