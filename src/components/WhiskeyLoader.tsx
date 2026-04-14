"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";

/**
 * R-Whiskey 프로젝트의 시그니처 로딩 스피너
 * 1:1 비율의 언더락 잔, 앰버색 액체 차오름, 무작위 문구 전환 기능 포함
 */
export default function WhiskeyLoader() {
  // 무작위로 보여줄 문구 배열
  const messages = useMemo(() => [
    "바텐더가 한 잔을 고르는 중...",
    "취향에 맞는 한 잔을 찾는 중...",
    "오늘의 위스키를 준비하는 중...",
    "얼음을 조각하고 있습니다...",
    "잔을 차갑게 칠링하는 중...",
    "최적의 도수를 확인하고 있어요...",
  ], []);

  const [currentText, setCurrentText] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * messages.length);
      setCurrentText(messages[randomIndex]);
    }, 1600); // 1.6초 사이클
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center p-10">
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none">
        {/* 액체 레이어: 75% 높이까지 반복 차오름 */}
        <motion.rect
          x="22"
          width="56"
          fill="#D97706"
          initial={{ height: 0, y: 78 }}
          animate={{ height: 40, y: 38 }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* 잔 외곽선: 낮은 언더락 잔 형태 (Heavy Base) */}
        <path
          d="M20 25V85C20 87.2091 21.7909 89 24 89H76C78.2091 89 80 87.2091 80 85V25M20 78H80"
          stroke="#9CA3AF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 유리 빛 반사: 흰색 수직선 하이라이트 */}
        <line
          x1="28"
          y1="32"
          x2="28"
          y2="65"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
      </svg>

      {/* 무작위 문구 슬라이드/페이드 전환 */}
      <div className="h-6 mt-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-gray-400 text-sm font-medium text-center"
          >
            {currentText}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
