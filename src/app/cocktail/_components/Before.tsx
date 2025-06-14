"use client";
import { useState } from "react";

export default function BeforeScreen(props: any) {
  const { userInput, setUserInput, setResultData, setSwitchState } = props;
  const [imRich, setImRich] = useState(false);
  const recommendation = {
    cocktailName: "진토닉",
    checkList: [
      "드라이 진 1.5oz (약 45ml)",
      "토닉 워터 4oz (약 120ml)",
      "레몬 또는 라임 웨지 1개 (장식용)",
      "얼음"
    ],
    method: [
      "하이볼 잔에 얼음을 가득 채웁니다.",
      "진을 잔에 따릅니다.",
      "토닉 워터를 부드럽게 붓고 가볍게 저어줍니다.",
      "레몬 또는 라임 웨지로 장식합니다."
    ],
    foodName: "치즈 스틱 또는 간단한 견과류",
    pairingNote:
      "나른하고 피곤한 날, 시원하고 상큼한 진토닉은 기분 전환에 최고입니다. 최소한의 재료로 쉽게 만들 수 있어 자취생에게 안성맞춤이며, 치즈 스틱이나 견과류처럼 가볍고 바삭한 안주와 곁들이면 더욱 좋습니다. 진토닉의 깔끔한 맛이 안주의 기름진 맛을 잡아주어 조화롭습니다."
  };

  async function callGemini(data: string, imRich: boolean) {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        body: JSON.stringify({ data: data, type: 1, rich: imRich })
      });
      if (res != undefined) {
        const jsonData = await res.json();
        console.log(jsonData);
        setResultData(jsonData);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setSwitchState(1);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center w-screen h-5/6 mt-1">
      <div
        className="flex flex-col gap-6 text-white w-[90%] max-w-[600px]
                     sm:w-full"
      >
        <p className="text-lg font-bold sm:text-base">칵테일 추천 예시</p>
        <p className="text-sm text-gray-400 bg-black/40 p-4 rounded-lg sm:text-xs sm:p-3">
          &quot;오늘은 조금 나른하고 피곤한데 심지어 날씨는 흐려.&quot;
        </p>
        <div
          className="p-6 bg-black/40 rounded-lg text-white/70 w-full space-y-4
                     sm:p-4"
        >
          <p className="text-lg font-bold text-white sm:text-base">추천 결과</p>
          <div>
            <p className="font-semibold text-white sm:text-sm">🍸 칵테일:</p>
            <p className="sm:text-sm">{recommendation.cocktailName}</p>
          </div>
          <div>
            <p className="font-semibold text-white sm:text-sm">📌 준비물:</p>
            <ul className="list-disc list-inside space-y-1 sm:text-sm">
              {recommendation.checkList.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white sm:text-sm">🧪 제조 순서:</p>
            <ul className="list-none space-y-1 sm:text-sm">
              {recommendation.method.map((value, index) => (
                <li key={index}>
                  [{index + 1}단계] {value}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white sm:text-sm">🥨 추천 안주:</p>
            <p className="sm:text-sm">{recommendation.foodName}</p>
          </div>
          <div>
            <p className="font-semibold text-white sm:text-sm">💡 추천 이유:</p>
            <p className="sm:text-sm">{recommendation.pairingNote}</p>
          </div>
        </div>
        <textarea
          className="p-4 bg-black/30 rounded-lg text-white/70 w-full h-[200px] resize-none
                   sm:p-3 sm:text-sm sm:h-[150px]"
          placeholder="오늘의 날씨, 기분, 시간대를 자유롭게 입력하세요..."
          value={userInput}
          maxLength={80}
          onChange={(e) => setUserInput(e.target.value)}
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
      <div className="mt-5 px-4 py-3 bg-yellow-100/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-md w-[90%] max-w-[600px] sm:px-4 sm:py-2 sm:text-xs">
        ⚠️ 본 추천은 AI의 분석에 기반한 참고 정보입니다. <br />
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;실제 취향이나 상황과 다를 수 있으니
        참고용으로 이용해 주세요.
      </div>

      <button
        className="mt-8 p-3 bg-[#000000]/60 text-white rounded-lg hover:bg-blue-500 transition-colors
                 sm:p-2 sm:text-sm"
        onClick={() => {
          if (userInput.length != 0) {
            callGemini(userInput, imRich);
          } else {
            alert("내용을 입력해주세요.");
          }
        }}
      >
        칵테일 추천 받으러 가기
      </button>
    </div>
  );
}
