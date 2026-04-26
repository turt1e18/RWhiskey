import apiClient from './apiClient';
import {
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  TagResponse,
  RecommendationSaveRequest,
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
    return apiClient<{ message: string }>('/api/auth/email/send', {
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
  // 현재 로그인된 사용자 정보 확인
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
   * 새로운 추천 결과 저장
   * @param uid - 사용자 고유 ID
   * @param data - 사용자 입력 조건 및 AI 추천 결과 데이터
   */
  save: (uid: number, data: RecommendationSaveRequest) => {
    return apiClient<number>(`/api/recommendations/${uid}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  /**
   * 저장된 추천 결과 삭제
   * @param oid - 추천 결과의 고유 ID (oid)
   */
  delete: (oid: number) => {
    return apiClient(`/api/recommendations/${oid}`, {
      method: 'DELETE',
    });
  },
};
