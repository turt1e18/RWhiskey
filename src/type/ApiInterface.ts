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
