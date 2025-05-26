"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CocktailDataInterface } from "@/type/CocktailDataInterface";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";

export default function CocktailScreen() {
  /**
   * 0 데이터 세팅 화면
   * 1 데이터 결과 화면
   */
  const [screenState, setScreenState] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [resultData, setResultData] = useState<CocktailDataInterface>({
    checkList: [""],
    method: [""],
    cocktailName: "",
    foodName: "",
    pairingNote: ""
  });
  const router = useRouter();

  const routing = (index: number) => {
    if (index === 0) router.push("/main");
    else if (index === 1) router.push("/random");
    else if (index === 2) router.push("/mood");
    else router.push("/cocktail");
  };

  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return (
          <BeforeScreen
            userInput={userInput}
            setUserInput={setUserInput}
            setResultData={setResultData}
            setSwitchState={setScreenState}
          />
        );
      case 1:
        return (
          <AfterScreen
            setSwitchState={setScreenState}
            userInput={userInput}
            setUserInput={setUserInput}
            setResultData={setResultData}
            resultData={resultData}
          />
        );
      default:
        break;
    }
  };

  // 뒤로가기 리셋 이벤트
  useEffect(() => {
    if (screenState == 0) {
      setUserInput("");
      setResultData({
        checkList: [""],
        method: [""],
        cocktailName: "",
        foodName: "",
        pairingNote: ""
      });
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
        <div className="flex gap-4 mb-4">
          {["🏠", "🎲", "🌧️", "❤️"].map((icon, index) => {
            return (
              <button
                key={index}
                className="p-4 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                      hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                      transition duration-200 ease-in-out"
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
