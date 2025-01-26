// components/RWhiskey.tsx
import React from "react";

const RWhiskey: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-fit">
      <svg
        viewBox="0 0 800 400"
        className="w-full max-w-4xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 텍스트와 유리 효과를 위한 정의 */}
        <defs>
          {/* 물결 애니메이션 */}
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D88B3B" />
            <stop offset="100%" stopColor="#B45B29" />
          </linearGradient>

          {/* 마스크 설정 */}
          <mask id="textMask">
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="sans-serif"
              fontSize="148"
              fontWeight="bold"
              fill="white"
            >
              RWhiskey
            </text>
          </mask>
        </defs>

        {/* 고정된 텍스트 내부에 물결 */}
        <g mask="url(#textMask)">
          {/* 상단 흰색 영역 */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="50%"
            fill="white" // 완전히 흰색으로 설정
          />

          {/* 하단 물결 애니메이션 */}
          <rect
            x="0"
            y="50%"
            width="100%"
            height="50%"
            fill="white" // 애니메이션이 없는 부분을 흰색으로 처리
          />
          <path
            d="M0 200 Q100 190 200 200 T400 200 T600 200 T800 200 V400 H0 Z"
            fill="url(#waveGradient)"
          >
            <animate
              attributeName="d"
              dur="4.5s"
              repeatCount="indefinite"
              values="
                M0 200 Q100 190 200 200 T400 200 T600 200 T800 200 V400 H0 Z;
                M0 220 Q120 240 200 230 T400 240 T600 220 T800 230 V400 H0 Z;
                M0 210 Q110 190 220 210 T400 190 T600 210 T800 220 V400 H0 Z;
                M0 190 Q100 230 250 190 T400 200 T600 180 T800 190 V400 H0 Z;
                M0 200 Q100 190 200 200 T400 200 T600 200 T800 200 V400 H0 Z
              "
            />
          </path>
        </g>
      </svg>
    </div>
  );
};

export default RWhiskey;
