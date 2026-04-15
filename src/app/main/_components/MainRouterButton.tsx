"use client";

import { MainRouter } from "@/type/MainInterface";
import { useRouter } from "next/navigation";

type MainRouterButtonProps = MainRouter & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function MainRouterButton(props: MainRouterButtonProps) {
  const router = useRouter();

  // route 값에 따라 페이지 이동
  function routePage(route: number) {
    if (route === 0) router.push("/random");
    else if (route === 1) router.push("/mood");
    else router.push("/cocktail");
  }

  // 버튼 종류별 스타일 분기
  function getButtonStyle(variant?: "primary" | "secondary" | "ghost") {
    if (variant === "primary") {
      return (
        "bg-gradient-to-br from-[#ffb247] to-[#d98b1e] " +
        "text-[#1a140b] font-bold " +
        "shadow-[0_10px_30px_rgba(255,178,71,0.2)] " +
        "hover:shadow-[0_15px_40px_rgba(255,178,71,0.35)] " +
        "hover:-translate-y-0.5"
      );
    }

    if (variant === "secondary") {
      return (
        "backdrop-blur-xl bg-white/5 border border-white/20 text-white font-bold " +
        "hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 " +
        "shadow-xl"
      );
    }

    return (
      "bg-transparent border border-[#ffb247]/40 text-[#ffb247] font-semibold " +
      "hover:bg-[#ffb247] hover:text-[#1a140b] hover:-translate-y-0.5"
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        routePage(props.route);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          routePage(props.route);
        }
      }}
      className={
        "relative group overflow-hidden w-full max-w-[440px] inline-flex items-center justify-center text-center cursor-pointer rounded-xl " +
        "px-8 py-4 md:px-12 md:py-5 text-base md:text-lg " +
        "transition-all duration-300 " +
        getButtonStyle(props.variant)
      }
    >
      {/* hover 시 내부 하이라이트 */}
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />

      {/* 버튼 텍스트 */}
      <span className="relative z-10">{props.text}</span>
    </div>
  );
}
