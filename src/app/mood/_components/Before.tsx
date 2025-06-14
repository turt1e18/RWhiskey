/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";

/**
 *
 * @param props setScreenState
 * @returns
 */
export default function BeforeScreen(props: any) {
  const { setSwitchState, userInput, setUserInput, setResultData } = props;
  const [imRich, setImRich] = useState(false);
  async function callGemini(data: string, imRich: boolean) {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        body: JSON.stringify({ data: data, type: 0, rich: imRich })
      });
      if (res != undefined) {
        const jsonData = await res.json();
        setResultData(jsonData);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSwitchState(1);
    }
  }

  const recommendation = {
    whiskey: "글렌피딕 12년",
    food: "그릴에 구운 연어 스테이크",
    reason:
      "글렌피딕 12년은 신선한 과일 향과 부드러운 맛을 가지고 있어, 연어의 풍미와 잘 맞습니다. 연어의 기름진 맛을 위스키가 깔끔하게 잡아줍니다."
  };

  return (
    <div className="flex flex-col justify-center items-center w-screen h-5/6 mt-20">
      <div className="flex flex-col gap-6 mb-4 text-white w-[90%] max-w-[600px] sm:w-full">
        <p className="text-lg font-bold sm:text-base">위스키 추천 예시</p>
        <p className="text-sm text-gray-400 bg-black/40 p-4 rounded-lg sm:text-xs sm:p-3">
          "오늘은 해가 화창하고 날씨가 선선해서 산책을 해서 기분이 좋아. 저녁에
          먹을만한 위스키와 그에 어울리는 안주를 추천해줘."
        </p>
        <div className="mt-6 p-4 bg-black/40 rounded-lg text-white/70 w-full sm:p-3">
          <p className="text-lg font-bold sm:text-base">추천 결과:</p>
          <p className="sm:text-sm">
            <strong>위스키:</strong> {recommendation.whiskey}
          </p>
          <p className="sm:text-sm">
            <strong>어울리는 안주:</strong> {recommendation.food}
          </p>
          <p className="sm:text-sm">
            <strong>추천 이유:</strong> {recommendation.reason}
          </p>
        </div>
        <textarea
          className="mt-4 p-4 bg-black/30 rounded-lg text-white/70 w-full h-[200px] resize-none sm:p-3 sm:text-sm sm:h-[150px]"
          placeholder="오늘의 날씨, 기분, 시간대를 자유롭게 입력하세요..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          maxLength={80}
        />
        <div className="flex">
          <div className="flex items-center h-5">
            <input
              id="helper-checkbox"
              aria-describedby="helper-checkbox-text"
              type="checkbox"
              checked={imRich}
              onChange={() => setImRich(!imRich)}
              className="
                w-4 h-4 accent-orange-500 text-white-500 bg-gray-100 border-gray-300 rounded-sm
                focus:outline-none focus:ring-0
              "
            />
          </div>
          <div className="ms-2 text-sm">
            <label
              htmlFor="helper-checkbox"
              className="font-medium text-gray-900 dark:text-gray-300"
            >
              "오늘 Flex 하길 원해요."
            </label>
            <p
              id="helper-checkbox-text"
              className="text-xs font-normal text-gray-500 dark:text-gray-300"
            >
              기본적으로 추천 위스키는 저가형으로 입력됩니다.
              <br />
              다만 이 옵션을 체크하시면 재력에 맞게 추천해드립니다.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 px-4 py-3 bg-yellow-100/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-md w-[90%] max-w-[600px] sm:px-4 sm:py-2 sm:text-xs">
        ⚠️ 본 추천은 AI의 분석에 기반한 참고 정보입니다. <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;실제 취향이나 상황과 다를 수 있으니
        참고용으로 이용해 주세요.
      </div>

      <button
        className="mt-8 p-3 bg-[#000000]/60 text-white rounded-lg hover:bg-blue-500 transition-colors sm:p-2 sm:text-sm"
        onClick={() => {
          if (userInput.length != 0) {
            callGemini(userInput, imRich);
            setSwitchState(1);
          } else {
            alert("내용을 입력해주세요.");
          }
        }}
      >
        위스키 추천 받으러 가기
      </button>
    </div>
  );
}
