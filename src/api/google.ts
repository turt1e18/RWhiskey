import axios from "axios";
import { GoogleGenAI } from "@google/genai";

const ACCESS_KEY = process.env.NEXT_PUBLIC_GOOGLESEARCH_ACCESS_KEY;
const ACCESS_KEY2 = process.env.NEXT_PUBLIC_GOOGLESEARCHID_ACCESS_KEY;
const ACCESS_KEY3 = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

/**
 *
 * @param name 서칭 기준 데이터
 * @returns 이미지 url
 */
export async function customSearchApi(name?: string) {
  if (!ACCESS_KEY) {
    console.log({
      err: "API key is MIA"
    });
  }

  try {
    console.log(name);
    const result = await axios
      .get("https://customsearch.googleapis.com/customsearch/v1", {
        params: {
          q: name,
          searchType: "image",
          num: 1,
          key: ACCESS_KEY,
          cx: ACCESS_KEY2
        }
      })
      .then((res) => {
        return res.data.items[0].link;
      })
      .catch((err) => {
        console.log(err);
      });
    return result;
  } catch (err) {
    console.error("image is MIA", err);
  }
}

/**
 *
 * @param data 사용자가 입력한 기분과 날씨
 * @returns 프롬프트 생성 데이터
 */
export async function gemini(data: string, type: number) {
  const ai = new GoogleGenAI({ apiKey: ACCESS_KEY3 });

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
  reason: ${data}
  `;

  const promptTextV2Whisky = `
  You are a whisky & food pairing expert for single-person households (자취생).
  Provide a single JSON recommendation. All values must be in Korean.
  Recommend one whisky (<150,000 KRW) and one food pairing.
  Food must be simple, easily prepared/acquired (e.g., convenience store, pantry, no-cook).
  Consider user's mood and current weather.
  Include: 'whiskyName', 'foodName', 'pairingNote'.
  'pairingNote' must be ~2 sentences, explaining 1 whisky reason, 1 food reason, and their pairing synergy. No price.
  reason : ${data}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: type == 1 ? promptTextV1Cock : promptTextV2Whisky
  });
  let resultText = response.text?.toString();
  if (resultText != undefined) {
    resultText = resultText?.substring(7); // 아니 뭔 그지같은 이상한게 딸려와 ```json 제거
    resultText = resultText?.substring(0, resultText.length - 4); // ``` 제거

    resultText = resultText?.trim(); // 이상한 공백 제거
    resultText = JSON.parse(resultText);
  }
  console.log("안쪽 : ", resultText);
  return resultText;
}
