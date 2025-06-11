"use client";
import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";

export default function MainScreen() {
  return (
    <div className="flex flex-col overflow-auto bg-[#868e96]/30 bg-cover w-screen h-screen justify-center items-center p-6 md:p-0">
      <div className="flex flex-col basis-36 md:basis-48 justify-center items-center">
        <RWhiskeyLogo />
      </div>
      <div className="flex flex-col basis-52 justify-evenly items-center text-center md:items-start md:text-left">
        <span className="font-sans text-[#ffffff] text-base md:text-[18px] font-medium">
          Discover your perfect whiskey through our three specialized services:
        </span>
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
