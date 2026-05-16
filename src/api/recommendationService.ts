import { recommendationApi, userTokenApi } from "./whiskeyApi";
import {
  GeminiWhiskyResponse,
  RecommendationSaveRequest
} from "../type/ApiInterface";

/**
 * 위스키 추천 트랜잭션 서비스
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
    // 1. 백엔드에 토큰 차감 요청 (선차감)
    console.log("[Step 1] Token Decrement");
    try {
      await userTokenApi.decrement();
      isTokenDecremented = true;
    } catch (tokenError) {
      console.warn("Token decrement failed:", tokenError);
      // 404가 아닌 실제 에러(잔액 부족 등)인 경우 추천 진행 중단
      if (tokenError instanceof Error && !tokenError.message.includes("404")) {
        throw tokenError;
      }
    }

    // 2. Gemini AI API 호출
    console.log("[Step 2] Gemini AI Request");
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

    // 3. 최종 결과 화면 표시용 데이터 구성 및 백엔드 서버에 저장 요청
    const saveRequest: RecommendationSaveRequest = {
      weatherValue: userInput.weatherValue || "맑음",
      moodValue: userInput.moodValue || "차분함",
      abvValue: userInput.abvValue || "기본도수",
      additionalValue: userInput.additionalValue || "",
      flexFlag: !!userInput.flexFlag,
      mainTag: userInput.mainTasteTag, 
      whiskyName: aiResult.whiskyName || "Unknown Whisky",
      whiskyNameEn: aiResult.whiskyNameEn || "",
      classification: aiResult.classification || "",
      featureTags: Array.isArray(aiResult.featureTags) ? aiResult.featureTags : [],
      foodName: aiResult.foodName || '',
      pairingNote: aiResult.pairingNote || '',
      bartenderWord: aiResult.bartenderWord || '',
      regionName: aiResult.regionName || '',
      styleName: aiResult.styleName || '',
    };

    console.log("[Step 3] Saving Recommendation:", saveRequest);
    const savedOid = await recommendationApi.save(saveRequest);

    return {
      aiResult,
      savedOid
    };
  } catch (error) {
    console.error("Whisky Recommendation Transaction Failed:", error);

    // 보상 트랜잭션: 토큰 선차감은 성공했으나 이후 과정에서 에러 발생 시 롤백 (increment)
    if (isTokenDecremented) {
      console.log("[Compensation] Attempting to rollback token");
      try {
        await userTokenApi.increment();
        console.log("[Compensation] Token rollback successful.");
      } catch (rollbackError) {
        console.error("[Compensation] Token rollback failed:", rollbackError);
      }
    }
    
    throw error;
  }
};
