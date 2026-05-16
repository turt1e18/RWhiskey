/**
 * 백엔드 서버의 기본 URL 설정
 * 환경 변수(NEXT_PUBLIC_API_BASE_URL)가 있으면 사용하고, 없으면 로컬 기본값을 사용합니다.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

/**
 * 개발 환경 여부 확인
 */
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Fetch API를 사용한 공통 HTTP 요청 함수
 * @param endpoint - API 엔드포인트 경로 (예: /api/auth/me)
 * @param options - Fetch API 옵션 (method, body, headers 등)
 * @returns Promise<T> - 서버 응답 데이터
 */
async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // POST 또는 PUT 요청인데 body가 없는 경우 빈 객체({})를 기본값으로 설정
  const isPostOrPut = options.method === 'POST' || options.method === 'PUT';
  const body = isPostOrPut && !options.body ? JSON.stringify({}) : options.body;

  const config: RequestInit = {
    ...options,
    headers,
    body,
    /**
     * credentials: 'include'
     * 세션 기반 인증을 위해 브라우저 쿠키(JSESSIONID 등)를 
     * 요청 헤더에 자동으로 포함하도록 설정합니다.
     */
    credentials: 'include',
  };

  if (IS_DEV) {
    console.log(`[API Request] ${config.method || 'GET'} ${url}`, body ? `Body: ${body}` : '');
  }

  const response = await fetch(url, config);

  // 리다이렉트 여부 확인 로그
  if (response.redirected && IS_DEV) {
    console.warn(`[API Redirected] To: ${response.url}`);
  }

  if (IS_DEV) {
    console.log(`[API Response] ${response.status} ${url}`);
  }

  // 204 No Content 처리 (예: 로그아웃 성공 시 데이터가 없는 경우)
  if (response.status === 204) {
    return {} as T;
  }

  // HTTP 에러 상태 코드 처리 (4xx, 5xx)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export default apiClient;
