export default function MainScreen() {
  return (
    <div className="flex flex-col bg-[#000000]/60 bg-cover w-screen h-screen justify-center items-center">
      <div className="flex flex-col basis-48 justify-center items-center">
        <span className="font-sans text-[#ffffff] text-[40px] font-bold">
          RWhiskey
        </span>
      </div>
      <div className="flex flex-col basis-52 justify-evenly items-center">
        <span className="font-sans text-[#ffffff] text-[18px] font-medium">
          Discover your perfect whiskey through our three specialized services:
        </span>
        <span className="font-sans text-[#ffffff] text-[16px] font-thin">
          🎲 Random Daily Shot - Let fate guide your whiskey journey
        </span>
        <span className="font-sans text-[#ffffff] text-[16px] font-thin">
          🌤️ Mood & Weather - Find the perfect match for your moment
        </span>
        <span className="font-sans text-[#ffffff] text-[16px] font-thin">
          🍸 Cocktail Discovery - Explore crafted whiskey combinations
        </span>
      </div>
    </div>
  );
}
