import { getRecommendationPhoto } from "./recommendationImages";
import { cocktailImageQuery } from "@/lib/cocktailImageQuery";
import { jsonRequestHeaders } from "@/api/apiClient";
import { LOGIN_REQUIRED_MESSAGE, DAILY_LIMIT_MESSAGE } from "@/lib/userFacingError";
import { recommendationApi, cocktailApi, userTokenApi } from "./whiskeyApi";
import {
  GeminiWhiskyResponse,
  GeminiCocktailResponse,
  RecommendationSaveRequest,
  CocktailSaveRequest,
  CocktailImageCredit
} from "../type/ApiInterface";
import { CocktailRecommendationRequest } from "../type/CocktailInterface";

/** /api/gemini 실패 응답을 사용자에게 보여 줄 오류로 바꾼다. */
async function geminiFailure(res: Response) {
  const code = (await res.json().catch(() => null))?.code;
  if (code === "DAILY_LIMITED") return new Error(DAILY_LIMIT_MESSAGE);
  if (code === "RATE_LIMITED") return new Error("요청이 너무 잦아요. 잠시 뒤에 다시 시도해 주세요.");
  if (res.status === 401 || res.status === 403) return new Error(LOGIN_REQUIRED_MESSAGE);
  return new Error("추천을 가져오는 중 문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.");
}

/**
 * 위스키 추천 서비스 (Gemini API + Backend Integration)
 */
export const getWhiskyRecommendation = async (
  userInput: {
    weatherValue?: string;
    moodValue?: string;
    abvValue?: string;
    additionalValue?: string;
    flexFlag: boolean;
    mainTasteTag?: string;
  }
) => {
  let settlementToken: string | null = null;

  try {
    // 1. Gemini AI API 호출 (횟수 차감과 호출 실패 시 환불은 서버가 처리한다)
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: jsonRequestHeaders(),
      body: JSON.stringify({
        data: `날씨: ${userInput.weatherValue}, 기분: ${userInput.moodValue}, 요구사항: ${userInput.additionalValue}${userInput.mainTasteTag ? `, 강조풍미: ${userInput.mainTasteTag}` : ""}`,
        type: 0,
        rich: userInput.flexFlag,
        mainTasteTag: userInput.mainTasteTag
      })
    });

    if (!geminiResponse.ok) throw await geminiFailure(geminiResponse);
    // 서버가 1회를 차감해 두었고, 응답의 정산 표로 저장을 마치거나 실패 시 환불한다.
    settlementToken = geminiResponse.headers.get("X-Settlement-Token");

    const aiResult: GeminiWhiskyResponse = await geminiResponse.json();

    // 3. 백엔드에 추천 결과 저장
    const saveRequest: RecommendationSaveRequest = {
      weatherValue: userInput.weatherValue,
      moodValue: userInput.moodValue,
      abvValue: userInput.abvValue,
      additionalValue: userInput.additionalValue,
      flexFlag: userInput.flexFlag,
      mainTag: userInput.mainTasteTag,
      whiskyName: aiResult.whiskyName,
      whiskyNameEn: aiResult.whiskyNameEn,
      classification: aiResult.classification,
      regionName: aiResult.regionName,
      styleName: aiResult.styleName,
      featureTags: aiResult.featureTags,
      foodName: aiResult.foodName,
      pairingNote: aiResult.pairingNote,
      bartenderWord: aiResult.bartenderWord
    };

    // 저장에 실패하면 가짜 번호(9999)로 이어가지 않고 아래 catch에서 정산 표로 환불한 뒤 오류를 낸다.
    const savedOid = await recommendationApi.save(saveRequest, settlementToken ?? undefined);

    return {
      aiResult,
      savedOid
    };
  } catch (error) {
    console.error("Whisky Recommendation Failed:", error);

    // [보상 트랜잭션] 토큰 복구
    if (settlementToken) {
      try {
        await userTokenApi.refund(settlementToken);
      } catch (refundError) {
        console.error("Token refund failed:", refundError);
      }
    }
    
    throw error;
  }
};

/**
 * 칵테일 추천 서비스 (Gemini API + Backend Integration)
 */
export const getCocktailRecommendation = async (
  request: CocktailRecommendationRequest
) => {
  let settlementToken: string | null = null;

  try {
    // 1. Gemini AI API 호출 (횟수 차감과 호출 실패 시 환불은 서버가 처리한다)
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: jsonRequestHeaders(),
      body: JSON.stringify({
        data: request,
        type: 1
      })
    });

    if (!geminiResponse.ok) throw await geminiFailure(geminiResponse);
    settlementToken = geminiResponse.headers.get("X-Settlement-Token");

    const aiResult: GeminiCocktailResponse = await geminiResponse.json();

    // 카탈로그 추천은 검수된 사진만 쓴다(없으면 검색하지 않고 사진 없음). 그 밖의 경로는 이미지 검색이다.
    let images: string[];
    let imageCredit: CocktailImageCredit | null = null;
    if (aiResult.cocktailId != null) {
      imageCredit = aiResult.image ?? null;
      images = imageCredit ? [imageCredit.url] : [];
    } else {
      // 큰 원본 이미지는 핫링크 차단으로 자주 안 열려서, 항상 열리는 검색 썸네일을 우선 쓴다.
      const photo = await getRecommendationPhoto(cocktailImageQuery(aiResult.cocktailName, aiResult.cocktailNameEn));
      const foundImage = photo ? (photo.fallbackUrl ?? photo.url) : null;
      images = foundImage ? [foundImage] : [];
    }

    // 4. 백엔드에 추천 결과 저장
    const saveRequest: CocktailSaveRequest = {
      experienceLevel: request.experienceLevel,
      isNonAlcoholic: request.isNonAlcoholic,
      preferredTaste: request.preferredTaste,
      carbonation: request.carbonation,
      dislikes: request.dislikes,
      currentMood: request.currentMood,
      requestBaseSpirit: request.baseSpirit,
      cocktailName: aiResult.cocktailName,
      responseBaseSpirit: aiResult.baseSpirit,
      abv: aiResult.abv,
      foodName: aiResult.foodPairing,
      bartenderWord: aiResult.bartenderMessage,
      pairingNote: aiResult.tastingNote,
      images,
      checkList: aiResult.checkList,
      method: aiResult.method,
      cocktailId: aiResult.cocktailId
    };

    const savedOid = await cocktailApi.save(saveRequest, settlementToken ?? undefined);

    return {
      aiResult: { ...aiResult, images, imageCredit },
      savedOid
    };
  } catch (error) {
    console.error("Cocktail Recommendation Failed:", error);

    // [보상 트랜잭션] 토큰 복구
    if (settlementToken) {
      try {
        await userTokenApi.refund(settlementToken);
      } catch (refundError) {
        console.error("Token refund failed:", refundError);
      }
    }
    
    throw error;
  }
};
