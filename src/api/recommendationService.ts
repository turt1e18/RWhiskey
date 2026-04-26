import apiClient from "./apiClient";
import { recommendationApi } from "./whiskeyApi";
import {
  GeminiWhiskyResponse,
  RecommendationSaveRequest
} from "../type/ApiInterface";

/**
 * 위스키 추천 트랜잭션 서비스
 */
export const getWhiskyRecommendation = async (
  uid: number,
  userInput: {
    weather_value?: string;
    mood_value?: string;
    abv_value?: string;
    additional_value?: string;
    flex_flag: boolean;
  }
) => {
  try {
    // 1. 백엔드에 토큰 차감 요청
    console.log("[Step 1] Token Decrement for UID:", uid);
    try {
      await apiClient("/api/user/token/decrement", {
        method: "POST",
        body: JSON.stringify({})
      });
    } catch (tokenError) {
      console.warn(
        "Token decrement failed or endpoint missing. Proceeding to AI...",
        tokenError
      );
      // 토큰 엔드포인트가 아직 없는 경우(404)를 대비해 로그만 남기고 진행
      if (
        !(tokenError instanceof Error && tokenError.message.includes("404"))
      ) {
        throw tokenError;
      }
    }

    // 2. Gemini AI API 호출
    console.log("[Step 2] Gemini AI Request");
    const geminiResponse = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: `날씨: ${userInput.weather_value}, 기분: ${userInput.mood_value}, 요구사항: ${userInput.additional_value}`,
        type: 0,
        rich: userInput.flex_flag
      })
    });

    if (!geminiResponse.ok) {
      throw new Error("Gemini AI 추천을 가져오는데 실패했습니다.");
    }

    const aiResult: GeminiWhiskyResponse = await geminiResponse.json();

    // 3. 최종 결과 화면 표시용 데이터 구성 및 백엔드 서버에 저장 요청
    const saveRequest: RecommendationSaveRequest = {
      // userInput의 값들을 명시적으로 할당 (undefined 방지)
      weather_value: userInput.weather_value || "맑음",
      mood_value: userInput.mood_value || "차분함",
      abv_value: userInput.abv_value || "기본도수",
      additional_value: userInput.additional_value || "",
      flex_flag: !!userInput.flex_flag,

      // AI 결과 매핑
      whisky_name: aiResult.whiskyName || "Unknown Whisky",
      whisky_name_en: aiResult.whiskyNameEn || "",
      classification: aiResult.classification || "",
      feature_tags: Array.isArray(aiResult.featureTags)
        ? aiResult.featureTags
        : [],
      food_name: aiResult.foodName || '',
      pairing_note: aiResult.pairingNote || '',
      bartender_word: aiResult.bartenderWord || '',
      region_name: aiResult.regionName || '',
      style_name: aiResult.styleName || '',
      };

    console.log("[Step 3] Saving Recommendation:", saveRequest);
    const savedOid = await recommendationApi.save(uid, saveRequest);

    return {
      aiResult,
      savedOid
    };
  } catch (error) {
    console.error("Whisky Recommendation Transaction Failed:", error);
    throw error;
  }
};
