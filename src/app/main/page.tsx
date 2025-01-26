import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";

export default function MainScreen() {
  return (
    <div className="flex flex-col overflow-auto bg-[#000000]/60 bg-cover w-screen h-screen justify-center items-center">
      <div className="flex flex-col basis-48 justify-center items-center">
        <RWhiskeyLogo />
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
      <div className="flex flex-col max-w-[440px] w-full basis-48 justify-evenly items-center">
        <MainRouterButton text={"🎲 Random Daily Shot Recommendation"} />
        <MainRouterButton
          text={"🌤️ Daily Shot Recommendation by Mood & Weather"}
        />
        <MainRouterButton text={"🍹 Cocktail Recommendation"} />
      </div>
    </div>
  );
}

// <div className="flex justify-center items-center h-fit">
//           <svg
//             viewBox="0 0 600 200"
//             className="w-full max-w-lg"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             {/* 텍스트 정의 */}
//             <defs>
//               {/* 물결 애니메이션 */}
//               <linearGradient
//                 id="waveGradient"
//                 x1="0%"
//                 y1="0%"
//                 x2="100%"
//                 y2="0%"
//               >
//                 <stop offset="0%" stopColor="#D88B3B" />
//                 <stop offset="100%" stopColor="#B45B29" />
//               </linearGradient>

//               {/* 유리 효과 그라디언트 */}
//               <linearGradient
//                 id="glassEffect"
//                 x1="0%"
//                 y1="0%"
//                 x2="0%"
//                 y2="100%"
//               >
//                 <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
//                 <stop offset="70%" stopColor="rgba(255, 255, 255, 0.2)" />
//                 <stop offset="100%" stopColor="transparent" />
//               </linearGradient>

//               {/* 마스크 설정 */}
//               <mask id="textMask">
//                 <text
//                   x="50%"
//                   y="50%"
//                   textAnchor="middle"
//                   dominantBaseline="middle"
//                   fontFamily="sans-serif"
//                   fontSize="128"
//                   fontWeight="bold"
//                   fill="white"
//                 >
//                   RWhiskey
//                 </text>
//               </mask>
//             </defs>

//             {/* 배경이 될 사각형 */}
//             <rect
//               x="0"
//               y="0"
//               width="100%"
//               height="100%"
//               fill="#fff"
//               mask="url(#textMask)"
//             />

//             {/* 움직이는 물결 */}
//             <g mask="url(#textMask)">
//               <rect
//                 x="0"
//                 y="50%"
//                 width="100%"
//                 height="100%"
//                 fill="url(#waveGradient)"
//               />
//               <path
//                 d="M0 200 Q50 190 100 200 T200 200 T300 200 T400 200 T500 200 T600 200 V200 H0 Z"
//                 fill="url(#waveGradient)"
//               >
//                 <animate
//                   attributeName="d"
//                   dur="3s"
//                   repeatCount="indefinite"
//                   values="
//           M0 200 Q100 190 200 200 T400 200 T600 200 T800 200 V400 H0 Z;
//           M0 200 Q150 210 300 190 T500 220 T700 180 T800 210 V400 H0 Z;
//           M0 200 Q50 220 150 180 T400 210 T650 190 T800 200 V400 H0 Z;
//           M0 200 Q200 180 350 210 T500 190 T700 200 T800 210 V400 H0 Z;
//           M0 200 Q100 190 200 200 T400 200 T600 200 T800 200 V400 H0 Z
//           "
//                 />
//               </path>
//             </g>

//             {/* 상단 유리 효과 */}
//             <g mask="url(#textMask)">
//               <rect
//                 x="0"
//                 y="0"
//                 width="100%"
//                 height="50%"
//                 fill="url(#glassEffect)"
//                 style={{
//                   filter: "blur(4px)"
//                 }}
//               />
//             </g>
//           </svg>
//         </div>
