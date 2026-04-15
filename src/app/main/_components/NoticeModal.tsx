"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NoticeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show modal every time the component mounts
    setIsOpen(true);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#2d2417] border border-[#ffb247]/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📢</span>
                <h2 className="text-xl md:text-2xl font-bold text-[#ffb247]">
                  안내 말씀
                </h2>
              </div>

              <div className="space-y-4 text-white/80 leading-relaxed text-[0.9375rem] md:text-base font-light">
                <p>R-Whiskey 서비스를 이용해 주셔서 감사합니다.</p>
                <p>
                  본 서비스는 위스키와 칵테일을 사랑하는 분들을 위해 제작된 추천
                  플랫폼입니다.
                </p>
                <p className="text-[13px] md:text-[14px] text-white/60 leading-normal">
                  현재 사이트의 전체적인 리디자인을 준비중입니다. 몇몇 서비스가
                  정상적으로 작동되지 않을 수도 있으니 양해 부탁드립니다.
                </p>
                <p className="text-sm text-white/60 italic">
                  * 과도한 음주는 건강에 해로울 수 있습니다.
                </p>
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-8 py-3 px-6 bg-[#ffb247] hover:bg-[#d98b1e] text-[#1a140b] font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                확인 및 닫기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
