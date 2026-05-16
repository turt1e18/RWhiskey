import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * 백엔드 서버의 기본 URL 설정
 * - 개발 환경(Local): Next.js rewrites(proxy)를 이용하기 위해 빈 문자열('')
 * - 운영 환경(Prod): 'https://api.turt1e18.work'
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

/**
 * 개발 환경 여부 확인
 */
const IS_DEV = process.env.NODE_ENV !== "production";

/**
 * Axios 인스턴스 설정 (운영 환경 보안 스펙 준수)
 * - withCredentials: true (세션 쿠키 및 CSRF 토큰 전송 필수)
 * - xsrfCookieName: 백엔드에서 발급하는 CSRF 쿠키 이름
 * - xsrfHeaderName: 요청 시 포함할 CSRF 헤더 이름
 */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * 요청 인터셉터 (디버깅용)
 */
api.interceptors.request.use(
  (config) => {
    if (IS_DEV) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
        config.data ? config.data : ""
      );
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 (에러 처리 및 데이터 변환)
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (IS_DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const errorData = error.response?.data || {};
    const errorMessage =
      errorData.message || `API Error: ${error.response?.status || "Unknown"}`;

    if (IS_DEV) {
      console.error(
        `[API Error] ${error.response?.status} ${error.config?.url}`,
        errorData
      );
    }

    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * 공통 HTTP 요청 함수 (기존 Fetch 기반 인터페이스 호환)
 * @param endpoint - API 엔드포인트 경로
 * @param options - method, body, headers 등을 포함한 옵션
 */
async function apiClient<T>(endpoint: string, options: any = {}): Promise<T> {
  const { method, body, headers, ...rest } = options;

  const config: AxiosRequestConfig = {
    url: endpoint,
    method: method || "GET",
    headers: headers,
    // fetch의 body(string)를 axios의 data(object)로 변환
    data: typeof body === "string" ? JSON.parse(body) : body,
    ...rest
  };

  const response = await api.request<T>(config);

  // 204 No Content 처리
  if (response.status === 204) {
    return {} as T;
  }

  return response.data;
}

export default apiClient;
