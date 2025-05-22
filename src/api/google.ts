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
export async function gemini(data: string) {
  const ai = new GoogleGenAI({ apiKey: ACCESS_KEY3 });

  const promptText = `
  You are a whisky and food pairing expert and bartender.
  Provide your single recommendation in JSON format.
  All values in the JSON output must be in Korean.
  Recommend one whisky and one food pairing.
  The whisky must be under 150,000 KRW.
  Consider the user's mood and current weather for the recommendations.
  Only include 'whisky_name', 'food_name', and 'pairing_note'.
  The 'pairing_note' should briefly describe the recommended whisky (1 reason for recommendation) and the food pairing (1 reason for recommendation), explaining why they go well together. Do NOT include price information in the 'pairing_note'.
  reason : ${data}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: promptText
  });
  let resultText = response.text?.toString();
  if (resultText != undefined) {
    resultText = resultText?.substring(7); // 아니 뭔 그지같은 이상한게 딸려와 ```json 제거
    resultText = resultText?.substring(0, resultText.length - 4); // ``` 제거

    resultText = resultText?.trim(); // 이상한 공백 제거
    resultText = JSON.parse(resultText);
  }
  console.log(resultText);
}
