// 유저 경험치 레벨을 위한 리터럴 타입
export type ExperienceLevel = 'beginner' | 'experienced' | 'home_bar';

// 1. FE Input Interface (요청 데이터)
export interface CocktailRecommendationRequest {
  experienceLevel: ExperienceLevel;
  isNonAlcoholic: boolean;        // 무알콜 여부 추가
  preferredTaste: string[];      // 다중 선택 (예: ["달콤한 맛", "상큼한 맛"])
  carbonation: boolean;          // 탄산 유무
  dislikes: string[];            // 기피 재료 (예: ["민트", "계란 흰자"])
  currentMood: string;           // 현재 기분 (자유 텍스트)
  baseSpirit: string;            // 기주 (주로 experienced 레벨에서 선택적으로 사용)
}

// 2. FE Output Interface (응답 데이터)
export interface CocktailRecommendationResponse {
  cocktailName: string;          // 칵테일 이름
  baseSpirit: string;            // 사용된 기주 (또는 무알콜)
  abv: string;                   // 대략적인 도수
  foodPairing: string;           // 추천 안주
  bartenderMessage: string;      // 바텐더의 대사 (2~3문장)
  tastingNote: string;           // 테이스팅 노트 (정확히 3문장)
}
