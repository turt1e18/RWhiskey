import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ACCESS_KEY3 = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const data = body.data;
  const type = body.type;

  if (!ACCESS_KEY3) {
    console.log({
      err: "API key is MIA"
    });
  }
  try {
    const ACCESS_KEY3 = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: ACCESS_KEY3 });
    // 의미없는 데이터 {'ㅋㅋ'} 와 같은 초성 전처리
    const preClearingData = data.replace(/[하핳ㅎㅋㅏ-ㅣ가-힣]+/g, "").trim();
    const finalData = preClearingData || "아무 기분이 들지 않으며 평범한 날씨";
    // const promptText = `
    // You are a whisky and food pairing expert and bartender.
    // Provide your single recommendation in JSON format.
    // All values in the JSON output must be in Korean.
    // Recommend one whisky and one food pairing.
    // The whisky must be under 150,000 KRW.
    // Consider the user's mood and current weather for the recommendations.
    // Only include 'whiskyName', 'foodName', and 'pairingNote'.
    // The 'pairing_note' should briefly describe the recommended whisky (1 reason for recommendation) and the food pairing (1 reason for recommendation), explaining why they go well together. Do NOT include price information in the 'pairing_note'.
    // reason : ${data}
    // `;
    const promptTextV1Cock = `
    You're a cocktail & food pairing expert/bartender.
    Provide a single JSON recommendation, all values in Korean.
    Recommend 1 cocktail & 1 food pairing.
    Food must be simple, easily prepared/acquired (e.g., convenience store, pantry, no-cook).
    Consider user's mood & current weather.
    Include: 'cocktailName', 'checkList', 'method', 'foodName', 'pairingNote'.
    'checkList': List ingredients/approx. quantities using common cups (mug, paper, water glass).
    'method': Array of strings, step-by-step prep. No leading numbers/bullets. Reference cup sizes.
    'pairingNote': Exactly 2 sentences. Explain 1 cocktail reason, 1 food reason, and their synergy.
    reason: ${finalData}
    `;
    const promptTextV8Whisky = `
    You're a whisky & food pairing expert/bartender. Prioritize diverse recommendations.
    Output a single JSON object directly. All values Korean.
    Recommend 1 whisky (<150k KRW) & 1 food pairing.
    Crucially, ensure diverse, non-repetitive whisky. NO Glenfiddich.
    Food: simple, easily prepared/acquired (e.g., convenience store, pantry, no-cook).
    Consider user's mood & current weather. Emphasize whisky character (e.g., refreshing, robust, light, warm) suits temp/season.
    Include: 'whiskyName', 'foodName', 'pairingNote'.
    'pairingNote': Exactly 2 sentences. Explain 1 whisky reason, 1 food reason, & their synergy. No price.
    User 'Reason' input is Korean. Interpret nuance, emotional context, cultural implications accurately for thoughtful recommendation.
    Reason: ${finalData}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: type == 1 ? promptTextV1Cock : promptTextV8Whisky
    });
    let resultText = response.text?.toString();
    if (resultText != undefined) {
      resultText = resultText?.substring(7); // 아니 뭔 그지같은 이상한게 딸려와 ```json 제거
      resultText = resultText?.substring(0, resultText.length - 4); // ``` 제거
      resultText = resultText?.trim(); // 이상한 공백 제거
      resultText = JSON.parse(resultText);
    }
    return NextResponse.json(resultText);
  } catch (err) {
    console.error("image is MIA", err);
  }
}

// /**
//  *
//  * @param data 사용자가 입력한 기분과 날씨
//  * @returns 프롬프트 생성 데이터
//  */
// export async function gemini(data: string, type: number) {
//   const ACCESS_KEY3 = process.env.GEMINI_API_KEY;
//   const ai = new GoogleGenAI({ apiKey: ACCESS_KEY3 });
//   // 의미없는 데이터 {'ㅋㅋ'} 와 같은 초성 전처리
//   const preClearingData = data.replace(/[하핳ㅎㅋㅏ-ㅣ가-힣]+/g, "").trim();
//   const finalData = preClearingData || "아무 기분이 들지 않으며 평범한 날씨";

//   // const promptText = `
//   // You are a whisky and food pairing expert and bartender.
//   // Provide your single recommendation in JSON format.
//   // All values in the JSON output must be in Korean.
//   // Recommend one whisky and one food pairing.
//   // The whisky must be under 150,000 KRW.
//   // Consider the user's mood and current weather for the recommendations.
//   // Only include 'whiskyName', 'foodName', and 'pairingNote'.
//   // The 'pairing_note' should briefly describe the recommended whisky (1 reason for recommendation) and the food pairing (1 reason for recommendation), explaining why they go well together. Do NOT include price information in the 'pairing_note'.
//   // reason : ${data}
//   // `;

//   const promptTextV1Cock = `
//   You're a cocktail & food pairing expert/bartender.
//   Provide a single JSON recommendation, all values in Korean.
//   Recommend 1 cocktail & 1 food pairing.
//   Food must be simple, easily prepared/acquired (e.g., convenience store, pantry, no-cook).
//   Consider user's mood & current weather.
//   Include: 'cocktailName', 'checkList', 'method', 'foodName', 'pairingNote'.
//   'checkList': List ingredients/approx. quantities using common cups (mug, paper, water glass).
//   'method': Array of strings, step-by-step prep. No leading numbers/bullets. Reference cup sizes.
//   'pairingNote': Exactly 2 sentences. Explain 1 cocktail reason, 1 food reason, and their synergy.
//   reason: ${finalData}
//   `;

//   const promptTextV8Whisky = `
//   You're a whisky & food pairing expert/bartender. Prioritize diverse recommendations.
//   Output a single JSON object directly. All values Korean.
//   Recommend 1 whisky (<150k KRW) & 1 food pairing.
//   Crucially, ensure diverse, non-repetitive whisky. NO Glenfiddich.
//   Food: simple, easily prepared/acquired (e.g., convenience store, pantry, no-cook).
//   Consider user's mood & current weather. Emphasize whisky character (e.g., refreshing, robust, light, warm) suits temp/season.
//   Include: 'whiskyName', 'foodName', 'pairingNote'.
//   'pairingNote': Exactly 2 sentences. Explain 1 whisky reason, 1 food reason, & their synergy. No price.
//   User 'Reason' input is Korean. Interpret nuance, emotional context, cultural implications accurately for thoughtful recommendation.
//   Reason: ${finalData}
//   `;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.0-flash",
//     contents: type == 1 ? promptTextV1Cock : promptTextV8Whisky
//   });
//   let resultText = response.text?.toString();
//   if (resultText != undefined) {
//     resultText = resultText?.substring(7); // 아니 뭔 그지같은 이상한게 딸려와 ```json 제거
//     resultText = resultText?.substring(0, resultText.length - 4); // ``` 제거

//     resultText = resultText?.trim(); // 이상한 공백 제거
//     resultText = JSON.parse(resultText);
//   }
//   console.log(resultText);
//   return resultText;
// }
