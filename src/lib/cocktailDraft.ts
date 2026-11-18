import type { CocktailRecommendationRequest } from "@/type/CocktailInterface";

const KEY = "rw:cocktailDraft";

export interface CocktailDraft {
  request: CocktailRecommendationRequest;
  customBottle: string;
}

/** 로그인하러 나가기 전에 주문서 입력을 이 탭에만 잠시 맡긴다(비밀값 없음). */
export function saveCocktailDraft(draft: CocktailDraft) {
  try { sessionStorage.setItem(KEY, JSON.stringify(draft)); } catch { /* 저장소를 못 쓰면 입력은 비워진다 */ }
}

const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");

/** 맡겨 둔 입력을 한 번만 꺼낸다. 형태가 맞지 않으면 버린다. */
export function takeCocktailDraft(): CocktailDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    const r = d?.request;
    const ok =
      r && ["beginner", "experienced", "home_bar"].includes(r.experienceLevel) &&
      typeof r.isNonAlcoholic === "boolean" && (r.carbonation === null || typeof r.carbonation === "boolean") &&
      isStrings(r.preferredTaste) && isStrings(r.dislikes) &&
      typeof r.currentMood === "string" && typeof r.baseSpirit === "string" &&
      typeof d.customBottle === "string";
    return ok ? (d as CocktailDraft) : null;
  } catch { return null; }
}
