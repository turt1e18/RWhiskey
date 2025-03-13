"use client";
import { useState } from "react";

export default function MainScreen() {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#000000]/60">
      {/* 상단 영역 */}
      <div className="flex flex-col justify-center items-center h-1/3">
        {/* 상단 아이콘 */}
        <div className="flex gap-4 mb-4">
          {["🏠", "🎲", "🌧️", "❤️"].map((icon, index) => {
            return (
              <button
                key={index}
                className="p-4 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                        hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                        transition duration-200 ease-in-out"
              >
                {icon}
              </button>
            );
          })}
        </div>

        {/* 랜덤 위스키 버튼 */}
        <button
          className="px-9 py-3 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                        hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                        transition duration-200 ease-in-out"
          onClick={() => {
            setIsClicked(true);
          }}
        >
          Get Random Whiskey
        </button>
      </div>

      {/* 하단 영역 */}
      <div
        className={`${isClicked ? "flex" : "hidden"} justify-center items-center h-2/3 transition-all duration-300 `}
      >
        {/* 위스키 정보 영역 */}
        <div className="bg-black/40 px-6 py-12 rounded-2xl shadow-lg text-white w-[90%] max-w-[650px] text-center">
          <img
            src="https://via.placeholder.com/300"
            alt="Whiskey"
            className="rounded-lg mb-4"
          />
          <h2 className="text-xl font-bold">Yamazaki 12 Year</h2>
          <p className="text-sm text-gray-400">
            Japanese Single Malt &nbsp;&nbsp; $199.99 &nbsp;&nbsp; 4.7/5
          </p>
          <p className="text-sm mt-2">
            Delicate and elegant with hints of peach, pineapple, grapefruit, and
            clove. The palate is smooth with good body and a sweet taste of
            coconut and vanilla.
          </p>
        </div>
      </div>
    </div>
  );
}
