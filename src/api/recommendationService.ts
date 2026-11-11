import { getRecommendationImage } from "./recommendationImages";
import { jsonRequestHeaders } from "@/api/apiClient";
import { recommendationApi, cocktailApi, userTokenApi } from "./whiskeyApi";
import {
  GeminiWhiskyResponse,
  GeminiCocktailResponse,
  RecommendationSaveRequest,
  CocktailSaveRequest
} from "../type/ApiInterface";
import { CocktailRecommendationRequest } from "../type/CocktailInterface";

/** /api/gemini 실패 응답을 사용자에게 보여 줄 오류로 바꾼다. */
async function geminiFailure(res: Response) {
  const code = (await res.json().catch(() => null))?.code;
  if (code === "DAILY_LIMITED") return new Error("오늘 사용할 수 있는 추천 횟수를 모두 사용했어요.");
  if (code === "RATE_LIMITED") return new Error("요청이 너무 잦아요. 잠시 후 다시 시도해 주세요.");
  if (res.status === 401) return new Error("로그인이 필요해요.");
  return new Error("Gemini AI 추천을 가져오는데 실패했습니다.");
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
  let isTokenDecremented = false;

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
    // 응답을 받았다면 서버가 1회를 차감한 채로 두었다. 이후 저장이 실패하면 아래 catch에서 환불한다.
    isTokenDecremented = true;

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

    // 저장에 실패하면 가짜 번호(9999)로 이어가지 않고 아래 catch에서 토큰을 환불한 뒤 오류를 낸다.
    const savedOid = await recommendationApi.save(saveRequest);

    return {
      aiResult,
      savedOid
    };
  } catch (error) {
    console.error("Whisky Recommendation Failed:", error);

    // [보상 트랜잭션] 토큰 복구
    if (isTokenDecremented) {
      try {
        await userTokenApi.increment();
      } catch (incError) {
        console.error("Token increment (recovery) failed:", incError);
      }
    }
    
    throw error;
  }
};

/**
 * 칵테일 추천 서비스 (Gemini API + Backend Integration)
 */
export const getCocktailRecommendation = async (
  request: CocktailRecommendationRequest,
  flexFlag: boolean
) => {
  let isTokenDecremented = false;

  try {
    // 1. Gemini AI API 호출 (횟수 차감과 호출 실패 시 환불은 서버가 처리한다)
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: jsonRequestHeaders(),
      body: JSON.stringify({
        data: request,
        type: 1,
        rich: flexFlag
      })
    });

    if (!geminiResponse.ok) throw await geminiFailure(geminiResponse);
    isTokenDecremented = true;

    const aiResult: GeminiCocktailResponse = await geminiResponse.json();

    const foundImage = await getRecommendationImage("cocktail " + aiResult.cocktailName);
    const images = foundImage ? [foundImage] : [];

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
      method: aiResult.method
    };

    const savedOid = await cocktailApi.save(saveRequest);

    return {
      aiResult: { ...aiResult, images },
      savedOid
    };
  } catch (error) {
    console.error("Cocktail Recommendation Failed:", error);

    // [보상 트랜잭션] 토큰 복구
    if (isTokenDecremented) {
      try {
        await userTokenApi.increment();
      } catch (incError) {
        console.error("Token increment (recovery) failed:", incError);
      }
    }
    
    throw error;
  }
};
