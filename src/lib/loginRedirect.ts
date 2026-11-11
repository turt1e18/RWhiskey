const KEY = "rw:lastPath";

/** 로그인 화면이 아닌 앱 안 경로를 기억해 둔다(로그인 성공 뒤 그 자리로 돌려보내기 위해). */
export function rememberPath(path: string) {
  if (!isSafeReturnPath(path)) return;
  try { sessionStorage.setItem(KEY, path); } catch { /* 저장소를 못 쓰면 기본 위치로 간다 */ }
}

/** 로그인 뒤 갈 곳. 기억한 경로가 없거나 안전하지 않으면 fallback. */
export function takeReturnPath(fallback = "/main"): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && isSafeReturnPath(path) ? path : fallback;
  } catch { return fallback; }
}

/** 같은 사이트 안의 경로만 허용한다(//, 스킴, /login, /api 제외). */
export function isSafeReturnPath(path: string) {
  return /^\/(?!\/)[^\s\\]*$/.test(path) && !/^\/(login|api)(\/|\?|$)/.test(path);
}
