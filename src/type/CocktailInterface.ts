// 유저 경험치 레벨을 위한 리터럴 타입
export type ExperienceLevel = 'beginner' | 'experienced' | 'home_bar';

// 마시고 싶은 도수 구간(BE 후보 선택에만 쓰이며 저장하지 않는다). 12% 이하 / 22% 이하 / 22% 초과
export type CocktailStrength = 'light' | 'medium' | 'strong';

// 1. FE Input Interface (요청 데이터)
export interface CocktailRecommendationRequest {
  experienceLevel: ExperienceLevel;
  isNonAlcoholic: boolean;        // 무알콜 여부 추가
  preferredTaste: string[];      // 다중 선택 (예: ["달콤한 맛", "상큼한 맛"])
  carbonation: boolean | null;   // 탄산 유무 (null = 상관없음)
  dislikes: string[];            // 기피 재료 (예: ["민트", "계란 흰자"])
  currentMood: string;           // 현재 기분 (자유 텍스트)
  baseSpirit: string;            // 기주 (무알콜이 아니면 누구나 선택 가능, 기본 '상관없음')
  strength?: CocktailStrength | null;  // 도수 구간 (null/없음 = 상관없음, 무알콜이면 쓰지 않음)
  excludeIds?: number[];         // '다른 한 잔' 요청에서 이미 보여 준 레시피 id
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
