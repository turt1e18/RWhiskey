/**
 * 브라우저 쿠키에서 특정 이름의 값을 가져오는 유틸리티
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

/**
 * 백엔드 서버의 기본 URL 설정
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * 개발 환경 여부 확인
 */
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Native Fetch API를 사용한 공통 HTTP 요청 함수 (운영 보안 스펙 준수)
 * @param endpoint - API 엔드포인트 경로
 * @param options - Fetch API 옵션
 */
async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  /**
   * [CSRF 방어] 
   * POST, PUT, DELETE 등 상태 변경 요청 시 브라우저 쿠키에서 XSRF-TOKEN을 읽어 
   * X-XSRF-TOKEN 헤더에 수동으로 포함합니다.
   */
  const method = options.method?.toUpperCase() || 'GET';
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutation) {
    const csrfToken = getCookie('XSRF-TOKEN');
    
    if (IS_DEV) {
      console.log(`[CSRF Diagnosis] Method: ${method}, URL: ${url}`);
      console.log(`[CSRF Diagnosis] All Cookies: ${document.cookie}`);
      console.log(`[CSRF Diagnosis] Extracted XSRF-TOKEN: ${csrfToken || 'NOT FOUND (Check HttpOnly or Domain)'}`);
    }

    if (csrfToken) {
      headers.set('X-XSRF-TOKEN', csrfToken);
      if (IS_DEV) console.log(`[CSRF Diagnosis] Header X-XSRF-TOKEN set successfully.`);
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    /**
     * [인증 보안 핵심]
     * credentials: 'include' 옵션이 있어야 실서버(api.turt1e18.work) 통신 시
     * 브라우저가 세션 쿠키(JSESSIONID)를 자동으로 포함합니다.
     */
    credentials: 'include',
  };

  if (IS_DEV) {
    console.log(`[API Request] ${method} ${url}`, options.body ? `Body: ${options.body}` : '');
  }

  try {
    const response = await fetch(url, config);

    if (IS_DEV) {
      console.log(`[API Response] ${response.status} ${url}`);
    }

    // 204 No Content 처리
    if (response.status === 204) {
      return {} as T;
    }

    // 에러 상태 처리
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `API Error: ${response.status}`;
      
      if (IS_DEV) {
        console.error(`[API Error] ${response.status} ${url}`, errorData);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (IS_DEV && !(error instanceof Error && error.message.includes('API Error'))) {
      console.error(`[Network Error] ${url}`, error);
    }
    throw error;
  }
}

export default apiClient;
