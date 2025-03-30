"use client";

import { useState } from "react";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";
import { useRouter } from "next/navigation";

export default function MoodScreen() {
  /**
   * 0 데이터 세팅 화면
   * 1 데이터 결과 화면
   */
  const [screenState, serScreenState] = useState(0);
  const [userInput, setUserInput] = useState("");
  const router = useRouter();
  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return (
          <BeforeScreen
            setSwitchState={serScreenState}
            userInput={userInput}
            setUserInput={setUserInput}
          />
        );
      case 1:
        return <AfterScreen setSwitchState={serScreenState} />;
      default:
        break;
    }
  };

  const routing = (index: number) => {
    if (index === 0) router.push("/main");
    else if (index === 1) router.refresh();
    else if (index === 2) router.push("/mood");
    else router.push("/cocktail");
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#000000]/60">
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
