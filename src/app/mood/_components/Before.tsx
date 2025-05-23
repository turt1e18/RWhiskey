/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { gemini } from "@/api/google";
import { useState } from "react";

/**
 *
 * @param props setScreenState
 * @returns
 */
export default function BeforeScreen(props: any) {
  const { setSwitchState, userInput, setUserInput, setResultData } = props;

  async function callGemini(data: string) {
    await gemini(data)
      .then((res) => {
        console.log(res);
        if (res != undefined) {
          setResultData(res);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const recommendation = {
    whiskey: "글렌피딕 12년",
    food: "그릴에 구운 연어 스테이크",
    reason:
      "글렌피딕 12년은 신선한 과일 향과 부드러운 맛을 가지고 있어, 연어의 풍미와 잘 맞습니다. 연어의 기름진 맛을 위스키가 깔끔하게 잡아줍니다."
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-screen">
      <div className="flex flex-col gap-6 mb-8 text-white w-[600px]">
        <p className="text-lg font-bold">위스키 추천 예시</p>
        <p className="text-sm text-gray-400 bg-black/40 p-4 rounded-lg">
          "오늘은 해가 화창하고 날씨가 선선해서 산책을 해서 기분이 좋아. 저녁에
          먹을만한 위스키와 그에 어울리는 안주를 추천해줘."
        </p>
        <div className="mt-6 p-4 bg-black/40 rounded-lg text-white/70 w-[600px]">
          <p className="text-lg font-bold">추천 결과:</p>
          <p>
            <strong>위스키:</strong> {recommendation.whiskey}
          </p>
          <p>
            <strong>어울리는 안주:</strong> {recommendation.food}
          </p>
          <p>
            <strong>추천 이유:</strong> {recommendation.reason}
          </p>
        </div>
        <textarea
          className="mt-4 p-4 bg-black/30 rounded-lg text-white/70 w-full h-[200px]"
          placeholder="오늘의 날씨, 기분, 시간대를 자유롭게 입력하세요..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </div>

      <button
        className="mt-8 p-3 bg-[#000000]/60 text-white rounded-lg hover:bg-blue-500 transition-colors"
        onClick={() => {
          callGemini(userInput);
          setSwitchState(1);
        }}
      >
        위스키 추천 받으러 가기
      </button>
    </div>
  );
}
