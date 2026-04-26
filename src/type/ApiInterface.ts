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
  weather_value?: string;
  mood_value?: string;
  abv_value?: string;
  additional_value?: string;
  flex_flag: boolean;
  whisky_name: string;
  whisky_name_en?: string;
  classification?: string;
  feature_tags?: string[];
  food_name?: string;
  pairing_note?: string;
  bartender_word?: string;
  region_name?: string; // Keep snake_case for backend save request as per API CONTRACT
  style_name?: string;  // Keep snake_case for backend save request as per API CONTRACT
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
  checkList: string[];
  method: string[];
  foodName: string;
  pairingNote: string;
}
