import { ApiResponseError } from "@/api/apiClient";

const hasKorean = (text: string) => /[가-힣]/.test(text);

/** 로그인 실패 원인을 사용자가 할 수 있는 행동으로 구분한다(자격 증명 오류와 서버·네트워크 문제를 섞지 않는다). */
export function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiResponseError) {
    if (error.status === 401) return "이메일 또는 비밀번호가 올바르지 않아요.";
    if (error.status === 429) return "시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.";
    if (error.status === 403) return "요청이 거부됐어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.";
    return "지금은 로그인할 수 없어요. 잠시 뒤에 다시 시도해 주세요.";
  }
  return "서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.";
}

/** 추천 실패 문구. 서버·라이브러리 원문("Failed to fetch", "API Error: 500" 등)은 보여 주지 않는다. */
export function recommendationErrorMessage(error: unknown): string {
  const generic = "추천을 가져오는 중 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.";
  if (error instanceof ApiResponseError) {
    if (error.status === 401 || error.status === 403) return "로그인이 필요해요. 다시 로그인한 뒤 이용해 주세요.";
    if (error.status === 429) return "요청이 너무 잦아요. 잠시 뒤에 다시 시도해 주세요.";
    return generic;
  }
  // 서비스가 직접 만든 한국어 안내(한도 초과 등)만 그대로 보여 준다.
  if (error instanceof Error && !(error instanceof TypeError) && hasKorean(error.message)) return error.message;
  return generic;
}
