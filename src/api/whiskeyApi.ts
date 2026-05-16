import apiClient from './apiClient';
import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  TagResponse,
  RecommendationSaveRequest,
  NoteResponse,
  NoteReviewRequest,
  TokenStatusResponse,
} from '../type/ApiInterface';

/**
 * 사용자 인증 관련 API 서비스
 */
export const authApi = {
  // 사용자 회원가입
  signup: (data: SignupRequest) => {
    return apiClient<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  // 사용자 로그인
  login: (data: LoginRequest) => {
    return apiClient<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  // 사용자 로그아웃
  logout: () => {
    return apiClient('/api/auth/logout', {
      method: 'POST',
    });
  },
  // 이메일 인증 코드 발송
  sendVerificationCode: (email: string) => {
    return apiClient<{ success: boolean; message: string }>('/api/auth/email/send', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  // 이메일 인증 코드 확인
  verifyCode: (email: string, emailCode: string) => {
    return apiClient<{ success: boolean; message: string }>('/api/auth/email/verify', {
      method: 'POST',
      body: JSON.stringify({ email, emailCode }),
    });
  },
  // 비밀번호 재설정
  resetPassword: (email: string, newPassword: string) => {
    return apiClient<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },
  // 현재 로그인된 사용자 정보 확인 (세션 유지용)
  me: () => {
    return apiClient<MeResponse>('/api/auth/me', {
      method: 'GET',
    });
  },
};

/**
 * 위스키 태그(필터용) 관련 API 서비스
 */
export const whiskeyTagsApi = {
  getCategories: () => {
    return apiClient<TagResponse[]>('/api/whiskey/tags/categories', {
      method: 'GET',
    });
  },
  getFlavors: () => {
    return apiClient<TagResponse[]>('/api/whiskey/tags/flavors', {
      method: 'GET',
    });
  },
  getRegions: () => {
    return apiClient<TagResponse[]>('/api/whiskey/tags/regions', {
      method: 'GET',
    });
  },
  getStyles: () => {
    return apiClient<TagResponse[]>('/api/whiskey/tags/styles', {
      method: 'GET',
    });
  },
};

/**
 * 위스키 추천(Recommendation) 관련 API 서비스
 */
export const recommendationApi = {
  /**
   * 다음 주문 번호 조회
   * UI 표시용 예상 주문 ID (Max ID + 1)를 반환합니다.
   */
  getNextNo: () => {
    return apiClient<number>('/api/recommendations/next-no', {
      method: 'GET',
    });
  },
  /**
   * 새로운 추천 결과 저장
   * @param data - 사용자 입력 조건 및 AI 추천 결과 데이터
   */
  save: (data: RecommendationSaveRequest) => {
    return apiClient<number>('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  /**
   * 특정 추천 결과 상세 조회
   */
  getDetail: (oid: number) => {
    return apiClient<NoteResponse>(`/api/recommendations/${oid}`, {
      method: 'GET',
    });
  },
};

/**
 * 테이스팅 노트(Notes) 및 라운지(Lounge) 관련 API 서비스
 */
export const notesApi = {
  // 추천 결과를 'Keep'으로 저장하여 테이스팅 노트 생성
  createNote: (oid: number) => {
    return apiClient<NoteResponse>('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ oid }),
    });
  },
  // 내 테이스팅 노트 전체 목록 조회
  getMyNotes: () => {
    return apiClient<NoteResponse[]>('/api/notes', {
      method: 'GET',
    });
  },
  // 특정 노트 상세 조회
  getNoteDetail: (id: number) => {
    return apiClient<NoteResponse>(`/api/notes/${id}`, {
      method: 'GET',
    });
  },
  // 사용자의 후기(Part B) 저장 및 수정
  updateReview: (id: number, data: NoteReviewRequest) => {
    return apiClient<NoteResponse>(`/api/notes/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  // 테이스팅 노트 삭제 (또는 Keep 취소)
  deleteNote: (id: number) => {
    return apiClient(`/api/notes/${id}`, {
      method: 'DELETE',
    });
  },
  // 라운지 커뮤니티 피드 조회
  getLoungeFeed: () => {
    return apiClient<NoteResponse[]>('/api/lounge', {
      method: 'GET',
    });
  },
  // 라운지 게시글 스크랩 토글
  toggleScrap: (id: number) => {
    return apiClient<{ isScrapped: boolean }>(`/api/lounge/${id}/scrap`, {
      method: 'POST',
    });
  },
  // 내가 스크랩한 노트 목록 조회
  getScrappedNotes: () => {
    return apiClient<NoteResponse[]>('/api/notes/scraps', {
      method: 'GET',
    });
  },
};

/**
 * 사용자 토큰 API 서비스
 */
export const userTokenApi = {
  // 토큰 상태 조회
  getStatus: () => {
    return apiClient<TokenStatusResponse>('/api/user/token', {
      method: 'GET',
    });
  },
  // 토큰 차감
  decrement: () => {
    return apiClient<{ success: boolean; message: string }>('/api/user/token/decrement', {
      method: 'POST',
    });
  },
  // 토큰 복구 (에러 발생 시)
  increment: () => {
    return apiClient<{ success: boolean; message: string }>('/api/user/token/increment', {
      method: 'POST',
    });
  },
};
