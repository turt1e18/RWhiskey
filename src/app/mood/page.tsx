/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";
import { useRouter } from "next/navigation";
import { MoodWhiskyDataInterface } from "@/type/MoodDataInterface";

export default function MoodScreen() {
  /**
   * 0 데이터 세팅 화면
   * 1 데이터 결과 화면
   */
  const [screenState, serScreenState] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [resultData, setResultData] = useState<MoodWhiskyDataInterface>({
    whiskyName: "",
    foodName: "",
    pairingNote: ""
  });
  const router = useRouter();
  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return (
          <BeforeScreen
            setSwitchState={serScreenState}
            userInput={userInput}
            setUserInput={setUserInput}
            setResultData={setResultData}
          />
        );
      case 1:
        return (
          <AfterScreen
            setSwitchState={serScreenState}
            resultData={resultData}
            setResultData={setResultData}
            setUserInput={setUserInput}
          />
        );
      default:
        break;
    }
  };

  const routing = (index: number) => {
    if (index === 0) router.push("/main");
    else if (index === 1) router.push("/random");
    else if (index === 2) router.push("/mood");
    else router.push("/cocktail");
  };

  // 뒤로가기 리셋 이벤트
  useEffect(() => {
    if (screenState == 0) {
      setUserInput("");
      setResultData({ whiskyName: "", foodName: "", pairingNote: "" });
    } else {
      return;
    }
    return () => {};
  }, [screenState]);

  return (
    <div className="flex flex-col min-h-screen bg-[#868e96]/30 py-8 overflow-x-hidden">
      {/* 상단 영역 */}
      <div className="flex flex-col justify-center items-center h-1/6">
        {/* 상단 아이콘 */}
        <div className="flex gap-4 mb-4 sm:gap-2 sm:mb-2">
          {" "}
          {/* 모바일(sm)에서 아이콘 간격 조정 */}
          {["🏠", "🎲", "🌧️", "❤️"].map((icon, index) => {
            return (
              <button
                key={index}
                className="p-4 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                        hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                        transition duration-200 ease-in-out
                        sm:p-3 sm:text-sm" // 모바일(sm)에서 패딩 및 텍스트 크기 조정
                onClick={() => {
                  routing(index);
                }}
              >
                {icon}
              </button>
            );
          })}
        </div>
      </div>
      {switchScreen()}
    </div>
  );
}
