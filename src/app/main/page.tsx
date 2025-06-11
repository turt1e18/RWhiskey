"use client";
import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";

export default function MainScreen() {
  return (
    // 기본적으로 모바일을 위한 패딩(p-6)을 추가하고, PC(md 이상)에서는 패딩을 0으로 설정합니다.
    <div className="flex flex-col overflow-auto bg-[#868e96]/30 bg-cover w-screen h-screen justify-center items-center p-6 md:p-0">
      {/* 모바일에서는 로고 영역의 높이를 줄이고(basis-36), 
        PC(md 이상)에서는 기존 높이(basis-48)를 유지합니다.
      */}
      <div className="flex flex-col basis-36 md:basis-48 justify-center items-center">
        <RWhiskeyLogo />
      </div>

      {/* 설명 텍스트 영역입니다.
        모바일에서는 텍스트를 중앙 정렬하고, PC에서는 왼쪽 정렬을 유지합니다.
        폰트 크기도 모바일/PC에 따라 조절합니다.
      */}
      <div className="flex flex-col basis-52 justify-evenly items-center text-center md:items-start md:text-left">
        <span className="font-sans text-[#ffffff] text-base md:text-[18px] font-medium">
          Discover your perfect whiskey through our three specialized services:
        </span>
        {/* 모바일에서는 가독성을 위해 폰트 크기를 줄입니다 (text-sm -> 14px).
         */}
        <span className="font-sans text-[#ffffff] text-sm md:text-[16px] font-thin">
          🎲 Random Daily Shot - Let fate guide your whiskey journey
        </span>
        <span className="font-sans text-[#ffffff] text-sm md:text-[16px] font-thin">
          🌤️ Mood & Weather - Find the perfect match for your moment
        </span>
        <span className="font-sans text-[#ffffff] text-sm md:text-[16px] font-thin">
          🍸 Cocktail Discovery - Explore crafted whiskey combinations
        </span>
      </div>

      {/* 버튼 영역입니다.
        모바일에서는 버튼 사이의 간격(gap-4)을 주어 더 나은 터치 경험을 제공합니다.
        basis-48 대신 자연스러운 높이를 갖도록 하고, 상단에 마진(mt-8)을 추가합니다.
      */}
      <div className="flex flex-col w-full max-w-[440px] justify-evenly items-center gap-4 mt-8 md:mt-0 md:basis-48 md:gap-0">
        <MainRouterButton
          text={"🎲 Random Daily Shot Recommendation"}
          route={0}
        />
        <MainRouterButton
          text={"🌤️ Daily Shot Recommendation by Mood & Weather"}
          route={1}
        />
        <MainRouterButton text={"🍹 Cocktail Recommendation"} route={2} />
      </div>
    </div>
  );
}
