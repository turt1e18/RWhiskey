"use client";

import { useState } from "react";
import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";
import NoticeModal from "./_components/NoticeModal";
import { useAuthStore } from "@/store/authStore";

export default function MainScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      await logout();
      alert("로그아웃 되었습니다.");
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <>
      <NoticeModal />
      {/* =========================
          상단 고정 네비게이션
      ========================= */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black/40 to-transparent backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between">
          {/* 좌측 로고 영역 */}
          <div className="flex items-center gap-3">
            <RWhiskeyLogo className="w-[112px] sm:w-[128px] md:w-[180px]" />
          </div>

          {/* 우측 네비게이션 메뉴 - 데스크탑 전용 */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#intro"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              소개
            </a>
            <a
              href="#how-to"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              이용 방법
            </a>
            <a
              href="#start"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              추천 결과
            </a>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white/90">
                  <span className="text-[#ffb247] font-bold">{user?.name}</span>님
                </span>
                <a
                  href="/notes"
                  className="text-sm font-medium px-5 py-2 rounded-full bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors shadow-lg"
                >
                  내 노트 보기
                </a>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium px-5 py-2 rounded-full bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="text-sm font-medium px-5 py-2 rounded-full bg-[#ffb247] text-[#1a140b] hover:bg-[#ffc266] transition-colors shadow-lg"
              >
                로그인
              </a>
            )}
          </div>

          {/* 모바일/테블릿 메뉴 버튼 (햄버거) */}
          <button
            onClick={toggleMenu}
            className="flex md:hidden flex-col gap-1.5 p-2 z-[60]"
            aria-label="메뉴 열기"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-transform ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-opacity ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-transform ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* 모바일 사이드바 메뉴 (Drawer) */}
      <div
        className={`fixed inset-0 z-[55] transition-all duration-300 ${
          isMenuOpen ? "visible" : "invisible delay-300"
        }`}
      >
        {/* 배경 오버레이 */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMenuOpen(false)}
        />

        {/* 메뉴 컨텐츠 */}
        <div
          className={`absolute top-0 right-0 w-[280px] h-full bg-[#1a140b] border-l border-white/10 p-8 pt-24 flex flex-col gap-8 shadow-2xl transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {isAuthenticated && (
            <div className="pb-6 border-b border-white/10">
              <p className="text-white/60 text-xs uppercase tracking-widest mb-2">
                Member
              </p>
              <p className="text-lg text-white font-medium">
                <span className="text-[#ffb247] font-bold">{user?.name}</span>님
                반갑습니다
              </p>
            </div>
          )}

          <div className="flex flex-col gap-6">
            <a
              href="#intro"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-medium text-white/90 hover:text-[#ffb247]"
            >
              서비스 소개
            </a>
            <a
              href="#how-to"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-medium text-white/90 hover:text-[#ffb247]"
            >
              이용 방법
            </a>
            <a
              href="#start"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-medium text-white/90 hover:text-[#ffb247]"
            >
              추천 결과 확인
            </a>
          </div>

          <div className="mt-auto pt-8 border-t border-white/10">
            {isAuthenticated ? (
              <div className="flex flex-col gap-3">
                <a
                  href="/notes"
                  className="w-full py-4 rounded-xl bg-white/10 text-white border border-white/20 text-center font-bold"
                >
                  내 노트 보기
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full py-4 rounded-xl bg-white/5 text-white/70 border border-white/10 text-center font-bold"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="block w-full py-4 rounded-xl bg-[#ffb247] text-[#1a140b] text-center font-bold"
              >
                로그인 하러가기
              </a>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          메인 화면
          모바일: 자연 스크롤
          데스크탑: snap 스크롤 유지
      ========================= */}
      <main className="min-h-screen overflow-y-auto bg-[#1a140b] text-white md:h-screen md:snap-y md:snap-mandatory md:scroll-smooth">
        {/* =========================
            1. Hero Section
        ========================= */}
        <section
          id="hero"
          className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-24 pb-12 sm:px-6 md:snap-start md:px-6 md:pt-28"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />

          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-[#1a140b]" />

          {/* 중앙 광원 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,178,71,0.15)_0%,transparent_60%)] pointer-events-none" />

          {/* 실제 콘텐츠 */}
          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl">
            <h1 className="text-[2rem] leading-[1.2] sm:text-[2.5rem] md:text-[3.75rem] font-bold mb-4 md:mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#ffd384] via-white to-[#ffb247]">
                오늘의 위스키와 칵테일을
                <br />
                추천받아보세요
              </span>
            </h1>

            <p className="text-[0.9375rem] sm:text-[1rem] md:text-[1.25rem] text-white/75 font-light leading-relaxed mb-8 md:mb-12">
              랜덤 추천부터 기분 기반 맞춤 추천까지,
              <br className="hidden sm:block" />
              당신에게 어울리는 한 잔을 찾아드립니다.
            </p>

            <div className="flex flex-col w-full max-w-[27.5rem] gap-3 md:gap-4">
              <MainRouterButton
                text="위스키 추천 받기"
                route={1}
                variant="primary"
              />
              <MainRouterButton
                text="칵테일 추천 받기"
                route={2}
                variant="secondary"
              />
              <button
                onClick={() => alert("추후 추가될 기능입니다.")}
                className="w-full py-4 rounded-xl bg-transparent border border-[#ffb247]/40 text-[#ffb247]/60 hover:text-[#ffb247] hover:border-[#ffb247] transition-all font-semibold text-base"
              >
                랜덤 위스키 추천
              </button>
            </div>
          </div>

          {/* 아래 이동 유도 - 모바일 숨김 */}
          <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/50 text-3xl">
            ↓
          </div>
        </section>

        {/* =========================
            2. 서비스 소개 섹션
        ========================= */}
        <section
          id="intro"
          className="relative overflow-hidden px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:py-20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,178,71,0.05)_0%,transparent_50%)]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-[#ffb247]/90 text-[0.875rem] md:text-[1.25rem] mb-2 md:mb-3 tracking-[0.2em] uppercase italic">
                Overview
              </h2>
              <h3 className="text-[1.75rem] sm:text-[2rem] md:text-[3rem] font-bold mb-3 md:mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
                  어떤 서비스인가요?
                </span>
              </h3>
              <div className="h-[0.25rem] w-16 md:w-20 bg-[#ffb247] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
              {/* 랜덤 추천 카드 */}
              <div className="relative p-5 md:p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/40 to-[#1a140b] border border-white/10 shadow-2xl">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ffb247]/10 rounded-xl flex items-center justify-center mb-5 md:mb-8 border border-[#ffb247]/20 text-2xl md:text-4xl">
                  🎲
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  랜덤 위스키 추천
                </h4>
                <p className="text-slate-400 leading-relaxed font-light mb-4 text-[0.875rem] md:text-[1rem]">
                  오늘의 위스키를 랜덤으로 추천합니다.
                </p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[0.6875rem] text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-[0.8125rem] md:text-[0.875rem] text-slate-300 italic">
                    Glenfiddich 15년 - 부드러운 꿀 향과 오크의 조화
                  </p>
                </div>
              </div>

              {/* 맞춤 추천 카드 */}
              <div className="relative p-5 md:p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/60 to-[#1a140b] border border-[#ffb247]/20 shadow-[0_0_40px_rgba(255,178,71,0.05)]">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ffb247]/20 rounded-xl flex items-center justify-center mb-5 md:mb-8 border border-[#ffb247]/40 text-2xl md:text-4xl">
                  🌤️
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  맞춤 위스키 추천
                </h4>
                <p className="text-slate-300 leading-relaxed font-light mb-4 text-[0.875rem] md:text-[1rem]">
                  기분과 상황에 어울리는 위스키를 찾아드립니다.
                </p>
                <div className="pt-4 border-t border-[#ffb247]/10">
                  <p className="text-[0.6875rem] text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-[0.8125rem] md:text-[0.875rem] text-slate-300 italic">
                    Macallan 12년 - 셰리 오크의 풍부한 과일 향
                  </p>
                </div>
              </div>

              {/* 칵테일 추천 카드 */}
              <div className="relative p-5 md:p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/40 to-[#1a140b] border border-white/10 shadow-2xl">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-[#ffb247]/10 rounded-xl flex items-center justify-center mb-5 md:mb-8 border border-[#ffb247]/20 text-2xl md:text-4xl">
                  🍸
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  칵테일 추천
                </h4>
                <p className="text-slate-400 leading-relaxed font-light mb-4 text-[0.875rem] md:text-[1rem]">
                  분위기에 맞는 칵테일과 레시피를 제안합니다.
                </p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[0.6875rem] text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-[0.8125rem] md:text-[0.875rem] text-slate-300 italic">
                    Negroni - 달콤쌉싸름한 맛의 완벽한 밸런스
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            3. 이용 방법 섹션
        ========================= */}
        <section
          id="how-to"
          className="relative overflow-hidden px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:py-20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a140b] via-transparent to-[#1a140b]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 md:mb-20 gap-4 md:gap-8">
              <div>
                <h2 className="text-[#ffb247]/90 text-[0.875rem] md:text-[1.25rem] mb-2 md:mb-3 tracking-[0.2em] uppercase italic">
                  Process
                </h2>
                <h3 className="text-[1.75rem] sm:text-[2rem] md:text-[3rem] font-bold text-white">
                  이용 방법
                </h3>
              </div>

              <p className="text-slate-300 max-w-md text-left md:text-right font-light text-[0.9375rem] md:text-[1.125rem] leading-relaxed border-l-2 md:border-l-0 md:border-r-2 border-[#ffb247]/50 pl-4 md:px-6">
                간단한 세 단계로 추천을 받아보세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-[1.125rem] md:text-[1.5rem] mb-5 md:mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  1
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  상황과 기분 선택
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-2 md:px-4 text-[0.875rem] md:text-[1rem] break-keep">
                  오늘의 분위기나 선호하는 맛을 간단히 선택합니다.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-[1.125rem] md:text-[1.5rem] mb-5 md:mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  2
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  맞춤 정보 분석
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-2 md:px-4 text-[0.875rem] md:text-[1rem] break-keep">
                  선택하신 정보를 바탕으로 당신을 위한 주류를 추천합니다.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-[1.125rem] md:text-[1.5rem] mb-5 md:mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  3
                </div>
                <h4 className="text-[1.25rem] md:text-[1.5rem] font-bold text-white mb-3 md:mb-4">
                  결과 확인
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-2 md:px-4 text-[0.875rem] md:text-[1rem] break-keep">
                  위스키 이름, 특징, 추천 이유를 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            4. 결과 미리보기 섹션
            모바일에서는 한 화면 집착보다
            자연스럽게 읽히도록 세로 적층
        ========================= */}
        <section
          id="start"
          className="relative overflow-hidden bg-[#2d2417] px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:py-12 lg:py-0"
        >
          {/* 배경 */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ffb247]/20 via-transparent to-transparent" />
          </div>

          {/* 전체 컨테이너 */}
          <div className="relative z-10 w-full max-w-7xl mx-auto md:min-h-full md:flex md:flex-col md:justify-center md:pt-[4rem] lg:pt-[5.5rem] md:pb-[1.5rem]">
            {/* 제목 */}
            <div className="text-center mb-[1.5rem] md:mb-[1.25rem]">
              <h3 className="text-[1.75rem] md:text-[2.5rem] lg:text-[3rem] font-bold text-white mb-[0.5rem] md:mb-[0.75rem] leading-tight">
                추천 결과 미리보기
              </h3>
              <p className="text-white/70 text-[0.75rem] md:text-[0.875rem] lg:text-[1rem] leading-relaxed max-w-[42rem] mx-auto">
                추천 결과는 카드 형태로 제공되며, 맛의 특징과 추천 이유를 한눈에
                확인할 수 있습니다.
              </p>
            </div>

            {/* tablet부터 무조건 좌우 2열 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] md:gap-[1.25rem] lg:gap-[2rem] items-center md:flex-1">
              {/* =========================
          좌측 카드
      ========================= */}
              {/* =========================
    좌측: 첨부파일 카드 형태 그대로 반영
========================= */}
              <div className="flex justify-center items-center h-full min-h-0">
                <article
                  className="
    w-full max-w-[15.5rem] md:max-w-[17.5rem] lg:max-w-[22rem]
    px-[0.875rem] py-[1rem] md:px-[1rem] md:py-[1.125rem] lg:px-[1.5rem] lg:py-[1.75rem]
    flex flex-col items-center relative
    bg-[#e5d5b7] text-stone-900
    border border-[#4a3728]
    rounded-[0.125rem]
    shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_10px_rgba(0,0,0,0.3)]
    overflow-visible
  "
                >
                  <div className="w-full flex justify-between absolute top-[0.625rem] md:top-[0.75rem] px-[0.875rem] md:px-[1rem] lg:px-[1.5rem] left-0 right-0">
                    <span className="text-[0.4375rem] md:text-[0.5rem] lg:text-[0.5625rem] font-bold tracking-[0.15em] text-stone-700 italic">
                      No. 001
                    </span>
                    <span className="text-[0.4375rem] md:text-[0.5rem] lg:text-[0.5625rem] font-bold tracking-[0.15em] text-stone-700 italic">
                      2024/05/20
                    </span>
                  </div>

                  <div
                    className="
      uppercase mt-[0.375rem] mb-[0.625rem] md:mb-[0.75rem] lg:mb-[0.875rem]
      border border-[#4a3728]
      px-[0.625rem] py-[0.125rem]
      text-[0.4375rem] md:text-[0.5rem] lg:text-[0.625rem]
      font-bold tracking-[0.2em]
      text-[#4a3728]
    "
                  >
                    오늘의 추천
                  </div>

                  <div className="text-[0.4375rem] md:text-[0.5rem] lg:text-[0.625rem] text-stone-700 tracking-[0.08em] font-medium mb-[0.625rem] md:mb-[0.875rem] lg:mb-[1rem] text-center">
                    싱글 몰트 / 아일라 위스키 / 스카치 위스키
                  </div>

                  <div className="w-full h-[6rem] md:h-[7rem] lg:h-[12rem] flex items-center justify-center mb-[0.625rem] md:mb-[0.875rem] lg:mb-[1rem] overflow-hidden">
                    <img
                      alt="Premium Whiskey Bottle"
                      className="max-h-full object-contain"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYKP5t3Gq3nsLh5zVKaC4O0xCsaZlMlgRPphdkfsPYCu_C7d6UKnbVv08o7FUoKrMfQPcN8U5EF9Iox9wxQy3NtU1yHyIkgyDcrXFK4kzv7CDcXu8M7-LwUHOE-a3rnhiwMXYzvAyziYjjBoNP0pYH3_wu46advcvc0p_OHsRler7y91mPaLpLcZ5o9Rgs8aAZJ0c6rxYinNBKfHZtmlcoAMEirnrxRfv84ZFVF3QpSLX34OoUkTM10eHu3K6oq9j0DZhRyeQZl2-T"
                    />
                  </div>

                  <h1 className="text-[1rem] md:text-[1.125rem] lg:text-[1.875rem] text-center mb-[0.5rem] md:mb-[0.75rem] lg:mb-[0.75rem] leading-tight text-black font-serif font-semibold">
                    라가불린 16년
                  </h1>

                  <div className="flex flex-wrap justify-center gap-[0.25rem] md:gap-[0.375rem] lg:gap-[0.375rem] mb-[0.625rem] md:mb-[0.875rem] lg:mb-[1.25rem]">
                    {["스모키", "피트", "오크"].map((tag) => (
                      <span
                        key={tag}
                        className="
          border border-[rgba(74,55,40,0.3)]
          rounded-full
          px-[0.375rem] md:px-[0.5rem] lg:px-[0.625rem]
          py-[0.125rem]
          text-[0.5rem] md:text-[0.5625rem] lg:text-[0.6875rem]
          text-[#4a3728]
          bg-transparent
        "
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="w-full">
                    <div className="border-t border-[rgba(74,55,40,0.25)] my-[0.375rem] md:my-[0.5rem] lg:my-[0.625rem]" />
                    <h2 className="text-[0.5rem] md:text-[0.5625rem] lg:text-[0.6875rem] font-bold text-stone-800 uppercase tracking-[0.14em] mb-[0.1875rem] md:mb-[0.25rem] lg:mb-[0.375rem]">
                      어울리는 안주
                    </h2>
                    <p className="text-[0.5625rem] md:text-[0.625rem] lg:text-[0.75rem] leading-relaxed text-black font-medium">
                      진한 풍미의 블루 치즈나 훈제 연어, 혹은 다크 초콜릿 한
                      조각.
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="border-t border-[rgba(74,55,40,0.25)] my-[0.375rem] md:my-[0.5rem] lg:my-[0.625rem]" />
                    <h2 className="text-[0.5rem] md:text-[0.5625rem] lg:text-[0.6875rem] font-bold text-stone-800 uppercase tracking-[0.14em] mb-[0.1875rem] md:mb-[0.25rem] lg:mb-[0.375rem]">
                      추천 이유
                    </h2>
                    <p className="text-[0.5625rem] md:text-[0.625rem] lg:text-[0.75rem] leading-relaxed text-black font-medium">
                      강렬한 피트 향 뒤에 숨겨진 말린 과일의 달콤함과 긴 여운이
                      매력적입니다. 오늘처럼 차분한 분위기에 깊은 대화를
                      나누거나 혼자만의 사색에 잠기기에 더할 나위 없는
                      선택입니다.
                    </p>
                  </div>

                  <div className="w-full">
                    <div className="border-t border-[rgba(74,55,40,0.25)] my-[0.375rem] md:my-[0.5rem] lg:my-[0.625rem]" />
                    <h2 className="text-[0.5rem] md:text-[0.5625rem] lg:text-[0.6875rem] font-bold text-stone-800 uppercase tracking-[0.14em] mb-[0.1875rem] md:mb-[0.25rem] lg:mb-[0.375rem]">
                      바텐더의 한마디
                    </h2>
                    <p className="text-[0.5625rem] md:text-[0.625rem] lg:text-[0.75rem] leading-relaxed italic text-stone-800 font-medium">
                      "천천히, 시간을 두고 즐겨보세요. 잔 속에서 피어나는 연기가
                      당신의 밤을 지켜줄 것입니다."
                    </p>
                  </div>

                  <div className="mt-[0.625rem] md:mt-[0.875rem] lg:mt-[1rem] w-full text-center">
                    <div className="border-t border-[rgba(74,55,40,0.25)] my-[0.375rem] md:my-[0.5rem] lg:my-[0.625rem]" />
                    <span className="text-[0.4375rem] md:text-[0.5rem] lg:text-[0.5625rem] tracking-[0.15em] font-bold text-stone-600 uppercase italic">
                      R-Whiskey Selection
                    </span>
                  </div>
                </article>
              </div>
              {/* =========================
          우측 설명
      ========================= */}
              <div className="flex flex-col justify-center h-full min-h-0">
                <div className="mb-[0.875rem] md:mb-[0.875rem] lg:mb-[1.5rem] text-center md:text-left">
                  <p className="text-[#ffb247]/80 text-[0.6875rem] md:text-[0.6875rem] lg:text-[0.875rem] uppercase tracking-[0.16em] md:tracking-[0.14em] lg:tracking-[0.2em] mb-[0.375rem] md:mb-[0.375rem] lg:mb-[0.5rem]">
                    Result Preview
                  </p>

                  <h4 className="text-[1.125rem] md:text-[1.25rem] lg:text-[2.5rem] font-bold text-white leading-tight mb-[0.5rem] md:mb-[0.5rem] lg:mb-[1rem]">
                    결과 화면을 통해
                    <br />
                    추천의 핵심 정보를 바로 확인할 수 있습니다
                  </h4>

                  <p className="text-white/70 leading-relaxed text-[0.6875rem] md:text-[0.75rem] lg:text-[1rem]">
                    결과 화면에서는 단순히 술 이름만 보여주는 것이 아니라,
                    추천된 이유와 특징, 필요한 정보들을 함께 제공합니다.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-[0.625rem] md:gap-[0.625rem] lg:gap-[1rem]">
                  <div className="rounded-[0.875rem] md:rounded-[0.875rem] lg:rounded-[1rem] border border-white/10 bg-[#1a140b]/40 p-[0.625rem] md:p-[0.75rem] lg:p-[1.25rem]">
                    <h5 className="text-white font-semibold mb-[0.25rem] text-[0.6875rem] md:text-[0.75rem] lg:text-[1rem]">
                      추천 정보 확인
                    </h5>
                    <p className="text-white/65 text-[0.5625rem] md:text-[0.625rem] lg:text-[0.875rem] leading-relaxed">
                      추천된 위스키나 칵테일의 이름과 핵심 특징을 확인할 수
                      있습니다.
                    </p>
                  </div>

                  <div className="rounded-[0.875rem] md:rounded-[0.875rem] lg:rounded-[1rem] border border-white/10 bg-[#1a140b]/40 p-[0.625rem] md:p-[0.75rem] lg:p-[1.25rem]">
                    <h5 className="text-white font-semibold mb-[0.25rem] text-[0.6875rem] md:text-[0.75rem] lg:text-[1rem]">
                      재료 / 풍미 확인
                    </h5>
                    <p className="text-white/65 text-[0.5625rem] md:text-[0.625rem] lg:text-[0.875rem] leading-relaxed">
                      칵테일은 재료를, 위스키는 풍미 포인트를 볼 수 있습니다.
                    </p>
                  </div>

                  <div className="rounded-[0.875rem] md:rounded-[0.875rem] lg:rounded-[1rem] border border-white/10 bg-[#1a140b]/40 p-[0.625rem] md:p-[0.75rem] lg:p-[1.25rem]">
                    <h5 className="text-white font-semibold mb-[0.25rem] text-[0.6875rem] md:text-[0.75rem] lg:text-[1rem]">
                      추천 이유 확인
                    </h5>
                    <p className="text-white/65 text-[0.5625rem] md:text-[0.625rem] lg:text-[0.875rem] leading-relaxed">
                      상황과 분위기에 맞춰 왜 이 결과가 나왔는지 설명합니다.
                    </p>
                  </div>

                  <div className="rounded-[0.875rem] md:rounded-[0.875rem] lg:rounded-[1rem] border border-white/10 bg-[#1a140b]/40 p-[0.625rem] md:p-[0.75rem] lg:p-[1.25rem]">
                    <h5 className="text-white font-semibold mb-[0.25rem] text-[0.6875rem] md:text-[0.75rem] lg:text-[1rem]">
                      다음 행동 연결
                    </h5>
                    <p className="text-white/65 text-[0.5625rem] md:text-[0.625rem] lg:text-[0.875rem] leading-relaxed">
                      다시 추천받기나 상세 확인으로 자연스럽게 이어집니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
