import { recommendationApi, cocktailApi, userTokenApi } from "./whiskeyApi";
import {
  GeminiWhiskyResponse,
  GeminiCocktailResponse,
  RecommendationSaveRequest,
  CocktailSaveRequest
} from "../type/ApiInterface";
import { CocktailRecommendationRequest } from "../type/CocktailInterface";

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
    // 1. 토큰 차감 시도
    try {
      await userTokenApi.decrement();
      isTokenDecremented = true;
    } catch (tokenError) {
      console.warn("Token decrement failed:", tokenError);
      // 404 에러(비로그인 등)는 무시하고 진행할 수 있으나, 그 외의 에러는 중단
      if (tokenError instanceof Error && !tokenError.message.includes("404") && !tokenError.message.includes("401")) {
        throw tokenError;
      }
    }

    // 2. Gemini AI API 호출
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: `날씨: ${userInput.weatherValue}, 기분: ${userInput.moodValue}, 요구사항: ${userInput.additionalValue}${userInput.mainTasteTag ? `, 강조풍미: ${userInput.mainTasteTag}` : ""}`,
        type: 0,
        rich: userInput.flexFlag,
        mainTasteTag: userInput.mainTasteTag
      })
    });

    if (!geminiResponse.ok) {
      throw new Error("Gemini AI 추천을 가져오는데 실패했습니다.");
    }

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

    let savedOid = 9999;
    try {
      savedOid = await recommendationApi.save(saveRequest);
    } catch (saveError) {
      console.error("Failed to save recommendation to backend:", saveError);
      // 저장 실패 시에도 AI 결과는 보여줄 수 있도록 폴백 처리하거나 에러를 던짐
    }

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
  flexFlag: boolean,
  imageUrl?: string // BeforeScreen에서 검색한 이미지 URL 전달 가능
) => {
  let isTokenDecremented = false;

  try {
    // 1. 토큰 차감 시도
    try {
      await userTokenApi.decrement();
      isTokenDecremented = true;
    } catch (tokenError) {
      console.warn("Token decrement failed:", tokenError);
      if (tokenError instanceof Error && !tokenError.message.includes("404") && !tokenError.message.includes("401")) {
        throw tokenError;
      }
    }

    // 2. Gemini AI API 호출
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: request,
        type: 1,
        rich: flexFlag
      })
    });

    if (!geminiResponse.ok) {
      throw new Error("Gemini AI 추천을 가져오는데 실패했습니다.");
    }

    const aiResult: GeminiCocktailResponse = await geminiResponse.json();

    // 3. 구글 이미지 검색 API 호출 (정확도를 위해 cocktail 접두사 추가)
    let imageUrl = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop"; // 폴백 이미지
    try {
      const googleRes = await fetch("/api/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: `cocktail ${aiResult.cocktailName}`, type: 3 })
      });

      if (googleRes.ok) {
        const fetchedUrl = await googleRes.json();
        if (fetchedUrl) imageUrl = fetchedUrl;
      }
    } catch (imageError) {
      console.warn("Google Image search failed, using fallback:", imageError);
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
      images: [imageUrl],
      checkList: aiResult.checkList,
      method: aiResult.method
    };

    let savedOid = 9999;
    try {
      savedOid = await cocktailApi.save(saveRequest);
    } catch (saveError) {
      console.error("Failed to save cocktail recommendation to backend:", saveError);
    }

    return {
      aiResult: { ...aiResult, images: [imageUrl] },
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
