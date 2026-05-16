export type NoteFormType = "basic" | "free";
export type DrinkCategory = "whisky" | "cocktail";

/**
 * 테이스팅 노트 후기 데이터 인터페이스 (입력값 중심)
 */
export interface ReviewDataInterface {
  category: DrinkCategory;
  formType: NoteFormType;
  
  // 기본 양식 (basic) 데이터
  nose?: string;    // 향
  palate?: string;  // 맛
  finish?: string;  // 여운
  
  // 자율 양식 (free) 데이터
  memo?: string;    // 후기 줄글
  
  // 공통 데이터
  rating: number;   // 별점 (총점)
}

/**
 * 기존 WhiskyEntry와 통합된 확장 인터페이스 (내 기록용)
 */
export interface TastingNoteEntryInterface extends ReviewDataInterface {
  id: string;
  oid?: number;             // 연관된 주문 번호
  status: "평가완료" | "미평가";
  
  // 음료 정보 (drink_name/en 기반)
  whiskyName?: string;      
  whiskyNameEn?: string;
  cocktailName?: string;    
  
  // 추천 당시 컨텍스트
  date: string;             // recommended_at
  weatherValue?: string;    // weather_value
  moodValue?: string;       // mood_value
  abvValue?: string;        // abv_value
  additionalValue?: string; // 추가 입력값
  
  // 추천 결과 상세
  classification?: string;
  regionId?: number;
  styleId?: number;
  featureTags?: string[];   // feature_tags
  foodName?: string;        // food_name
  pairingNote?: string;     // pairing_note
  bartenderWord?: string;   // bartender_word
  
  // 평가 정보
  ratedAt?: string;         // rated_at
  shared: boolean;          // shared (라운지 공유 여부)
  
  // 라운지 전용 필드
  isScrapped?: boolean;     // is_scrapped
  ownerNickname?: string;   // owner_nickname
}

/**
 * 라운지 게시판 데이터 인터페이스
 */
export interface LoungeNoteInterface extends ReviewDataInterface {
  id: string;
  author: string;         // 작성자 닉네임
  whiskyName?: string;    // 위스키 이름 (한글)
  whiskyNameEn?: string;  // 위스키 이름 (영어)
  cocktailName?: string;  // 칵테일 이름
  likes: number;          // 건배(좋아요) 수
  rotate: number;         // 핀 회전 각도
  pinColor: string;       // 핀 색상
  createdAt: string;      // 게시일
  pairing?: string;       // 페어링 정보 추가
}
