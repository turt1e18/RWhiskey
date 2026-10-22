"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect } from "react";

const defaultMessages = [
  "바텐더가 한 잔을 고르는 중...",
  "취향에 맞는 한 잔을 찾는 중...",
  "오늘의 위스키를 준비하는 중...",
  "얼음을 조각하고 있습니다...",
  "잔을 차갑게 칠링하는 중...",
  "최적의 도수를 확인하고 있어요...",
];

/**
 * R-Whiskey 프로젝트의 시그니처 로딩 스피너
 * 언더락 잔, 앰버색 액체 차오름, 읽을 시간을 둔 순차 문구 전환.
 */
export default function WhiskeyLoader({ messages = defaultMessages, tone = "dark", compact = false }: {
  messages?: readonly string[]; tone?: "dark" | "paper"; compact?: boolean;
}) {
  const [messageIndex, setMessageIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const displayMessages = messages.length ? messages : defaultMessages;
  const currentText = displayMessages[messageIndex % displayMessages.length];

  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => setMessageIndex((index) => index + 1), 2800);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  return (
    <div className={`flex flex-col items-center justify-center ${compact ? "px-2 py-5" : "p-10"}`}>
      <span role="status" className="sr-only">취향에 맞는 한 잔을 준비하고 있습니다. 잠시 기다려 주세요.</span>
      <svg aria-hidden="true" width={compact ? 76 : 120} height={compact ? 76 : 120} viewBox="0 0 100 100" fill="none">
        {/* 액체 레이어: 75% 높이까지 반복 차오름 */}
        <motion.rect
          x="22"
          width="56"
          fill="#D97706"
          initial={reduceMotion ? false : { height: 0, y: 78 }}
          animate={{ height: 40, y: 38 }}
          transition={{
            duration: reduceMotion ? 0 : 1.6,
            repeat: reduceMotion ? 0 : Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        {/* 잔 외곽선: 낮은 언더락 잔 형태 (Heavy Base) */}
        <path
          d="M20 25V85C20 87.2091 21.7909 89 24 89H76C78.2091 89 80 87.2091 80 85V25M20 78H80"
          stroke={tone === "paper" ? "#4a3728" : "#9CA3AF"}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* 유리 빛 반사: 흰색 수직선 하이라이트 */}
        <line
          x1="28"
          y1="32"
          x2="28"
          y2="65"
          stroke={tone === "paper" ? "#8b7563" : "white"}
          strokeWidth="1.5"
          strokeOpacity="0.7"
        />
      </svg>

      {/* 회전 문구는 보조기기에 반복 알리지 않는다. */}
      <div aria-hidden="true" className={`w-full overflow-hidden ${compact ? "mt-2 min-h-12" : "mt-6 min-h-12"}`}>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentText}
            initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={`text-sm font-medium leading-6 text-center ${tone === "paper" ? "text-stone-700" : "text-gray-400"}`}
          >
            {currentText}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
