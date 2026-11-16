import type { CocktailRecommendationRequest } from "@/type/CocktailInterface";
import type { CocktailDataInterface } from "@/type/CocktailDataInterface";

/**
 * 주문서 입력을 서버로 보내고 결과 화면용 데이터로 바꾼다(주문서와 "다른 한 잔"이 함께 쓴다).
 * 화면에 보이지 않는 기주 선택(무알콜)과 도수 구간(무알콜)은 보내지 않는다.
 */
export async function runRecommendation(request: CocktailRecommendationRequest, customBottle: string, excludeIds: number[] = []): Promise<CocktailDataInterface> {
  const hasBase = !request.isNonAlcoholic;
  const baseSpirit = !hasBase ? "상관없음"
    : request.baseSpirit === "기타(바틀지정)" ? (request.experienceLevel === "home_bar" ? `기타(${customBottle})` : "상관없음")
    : request.baseSpirit;
  const finalRequest: CocktailRecommendationRequest = {
    ...request,
    baseSpirit,
    strength: hasBase ? request.strength ?? null : null,
    excludeIds: excludeIds.length > 0 ? excludeIds : undefined,
  };
  const { getCocktailRecommendation } = await import("@/api/recommendationService");
  const res = await getCocktailRecommendation(finalRequest);
  return {
    oid: res.savedOid,
    ...res.aiResult,
    aiGenerated: res.aiResult.cocktailId == null,
    foodName: res.aiResult.foodPairing,
    pairingNote: res.aiResult.tastingNote,
    bartenderWord: res.aiResult.bartenderMessage,
    images: res.aiResult.images,
  };
}
