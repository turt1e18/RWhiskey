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
  
  // 신규: 추천에 사용된 옵션들을 부모에서 관리 (재추천 시 필요)
  const [weather, setWeather] = useState("맑음");
  const [mood, setMood] = useState("차분함");
  const [strength, setStrength] = useState("기본도수");
  const [imRich, setImRich] = useState(false);

  const [resultData, setResultData] = useState<Promise<MoodWhiskyDataInterface> | null>(null);
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
            // 옵션 상태 전달
            weather={weather}
            setWeather={setWeather}
            mood={mood}
            setMood={setMood}
            strength={strength}
            setStrength={setStrength}
            imRich={imRich}
            setImRich={setImRich}
          />
        );
      case 1:
        return (
          <AfterScreen
            setSwitchState={serScreenState}
            resultData={resultData}
            setResultData={setResultData}
            setUserInput={setUserInput}
            // 재추천을 위한 옵션 상태 전달
            weather={weather}
            mood={mood}
            strength={strength}
            imRich={imRich}
            userInput={userInput}
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
      setResultData(null);
    }
  }, [screenState]);

  return (
    <div className="flex flex-col min-h-screen md:h-screen bg-[#1a120d] overflow-y-auto md:overflow-hidden">
      {switchScreen()}
    </div>
  );
}
