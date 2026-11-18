"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { useFrameIntro } from "./useFrameIntro";

interface DiaryFrameProps {
  left: ReactNode;
  right: ReactNode;
  rightId?: string;
  /** true면 왼쪽도 오른쪽과 같은 종이 면으로 둔다(가죽 표지 대신). 펼친 수첩의 두 장. */
  leftPaper?: boolean;
}

export const DiaryFrame = ({ left, right, rightId, leftPaper = false }: DiaryFrameProps) => {
  const intro = useFrameIntro();
  return (
    <motion.div
      initial={intro ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mx-auto flex flex-col md:flex-row w-[min(1200px,95vw)] min-h-[85vh] md:min-h-[calc(100dvh-8.5rem)] rounded-[14px] overflow-visible"
      style={{
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.6), 0 0 0 8px #2a1810, 0 0 0 10px #1A110D",
      }}
    >
      {/* 좌측: 가죽 표지, 또는 leftPaper일 때 오른쪽과 같은 종이 */}
      {leftPaper ? (
        <div className="relative w-full md:w-1/2 md:h-auto md:max-h-[calc(100dvh-8.5rem)] md:overflow-hidden paper-block p-6 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-3 bg-gradient-to-l from-black/15 to-transparent md:block" />
          {left}
        </div>
      ) : (
        <div className="relative w-full md:w-1/2 min-h-[28vh] md:min-h-0 md:h-auto md:max-h-[calc(100dvh-8.5rem)] md:overflow-hidden leather-inner p-5 md:p-10">
          {/* 가죽 스티치 */}
          <div className="pointer-events-none absolute inset-3 rounded-md border border-dashed border-[#c9a14a]/30" />
          {left}
        </div>
      )}

      {/* 책등 (가로/세로 분기) */}
      <div
        className="hidden md:block w-2 bg-gradient-to-r from-black/60 via-black/30 to-black/60"
        style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)" }}
      />
      <div
        className="block md:hidden h-2 bg-gradient-to-b from-black/60 via-black/30 to-black/60"
        style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.7)" }}
      />

      {/* 우측 종이 */}
      <motion.div
        layoutId={rightId}
        className="relative w-full md:w-1/2 flex-1 md:flex-none paper-block p-6 md:p-12 overflow-visible"
      >
        <div className="pointer-events-none absolute left-0 top-0 h-full w-3 bg-gradient-to-r from-black/15 to-transparent" />
        {right}
      </motion.div>
    </motion.div>
  );
};
