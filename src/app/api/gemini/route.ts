import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ACCESS_KEY3 = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  const body = await req.json();
  const data = body.data;
  const type = body.type;
  const rich = body.rich;

  if (!ACCESS_KEY3) {
    console.log({
      err: "API key is MIA"
    });
  }
  try {
    const ACCESS_KEY3 = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: ACCESS_KEY3 });
    // 의미없는 데이터 {'ㅋㅋ'} 와 같은 초성 전처리
    // const preClearingData = data.replace(/[하핳ㅎㅋㅏ-ㅣ가-힣]+/g, "").trim();
    // console.log("zz : ", preClearingData);
    // const finalData =
    //   preClearingData.length !== 0
    //     ? preClearingData
    //     : "아무 기분이 들지 않으며 평범한 날씨";
    const preClearingData = data
      // 한글 완성형만 남기고 나머지 제거 (가~힣)
      .replace(/[^가-힣\s]/g, "") // 특수문자, 숫자, 알파벳, 자모 제거
      .replace(/\s+/g, " ") // 공백 정리
      .trim();

    const finalData =
      preClearingData.length !== 0
        ? preClearingData
        : "아무 기분이 들지 않으며 평범한 날씨";

    console.log("zz : ", finalData);

    const promptTextV1Cock = `
    You're a cocktail & food pairing expert/bartender.
    Provide a single JSON recommendation. All values MUST be in Korean, exclusively.
    Recommend 1 popular, easy-to-make cocktail & 1 food pairing.
    Food: simple, easily prepared/acquired (e.g.,${!rich ? " convenience store, " : ""} pantry staples, easy no-cook options).
    ${rich ? "Pair food thoughtfully with the cocktail, considering more refined or curated options." : ""}
    Consider user's mood & current weather.
    Include: 'cocktailName', 'checkList', 'method', 'foodName', 'pairingNote'.
    'checkList': List ingredients/approx. quantities using common cups (mug, paper, water glass). Ensure all text here is in Korean only.
    'method': Array of strings, step-by-step prep. No leading numbers/bullets. Reference cup sizes. Ensure all text here is in Korean only.
    'pairingNote': Exactly 2 sentences. Explain 1 cocktail reason, 1 food reason, & their synergy.
    User 'Reason' input is Korean. Interpret nuance, emotional context, cultural implications accurately for thoughtful recommendation.
    Reason: ${finalData}
    `;

    const promptTextV10Whisky = `
    You're a whisky & food pairing expert/bartender. Prioritize diverse recommendations.
    Output a single JSON object directly. All values Korean.
    ${!rich ? "Recommend 1 whisky (<200k KRW) & 1 food pairing." : "Recommend 1 affordable whisky (>250k KRW) & 1 food pairing."}
    Crucially, ensure diverse, non-repetitive whisky. NO Glenfiddich.
    Food: simple, easily prepared/acquired (e.g.,${!rich ? " convenience store, " : ""} pantry staples, easy no-cook options).
    ${rich ? "Pair food thoughtfully with the whisky, considering more refined or curated, potentially gourmet, options." : ""}
    Include: 'whiskyName', 'foodName', 'pairingNote'.
    'pairingNote': Exactly 2 sentences. Explain 1 whisky reason, 1 food reason, & their synergy. No price.
    User 'Reason' input is Korean. Interpret nuance, emotional context, cultural implications accurately for thoughtful recommendation.
    Reason: ${finalData}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: type == 1 ? promptTextV1Cock : promptTextV10Whisky
    });

    if (type == 1) console.log(promptTextV1Cock);
    else console.log(promptTextV10Whisky);

    let resultText = response.text?.toString();
    if (resultText != undefined) {
      resultText = resultText?.substring(7); // 아니 뭔 그지같은 이상한게 딸려와 ```json 제거
      resultText = resultText?.substring(0, resultText.length - 4); // ``` 제거
      resultText = resultText?.trim(); // 이상한 공백 제거
      resultText = JSON.parse(resultText);
    }
    console.log(" after : ", resultText);
    return NextResponse.json(resultText);
  } catch (err) {
    console.error("image is MIA", err);
  }
}
