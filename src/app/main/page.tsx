"use client";

import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";

export default function MainScreen() {
  return (
    <>
      {/* =========================
          상단 고정 네비게이션
          좌측 로고 / 우측 메뉴 구조
      ========================= */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          {/* 좌측 로고 영역 */}
          <div className="flex items-center gap-3">
            {/* 네비 전용 크기로 로고 축소 */}
            <RWhiskeyLogo className="w-[140px] md:w-[180px]" />
          </div>

          {/* 우측 네비게이션 메뉴 */}
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
              랜덤 위스키
            </a>
            <a
              href="#start"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              위스키 추천
            </a>
            <a
              href="#start"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              칵테일 추천
            </a>
          </div>
        </div>
      </nav>

      {/* =========================
          메인 화면
      ========================= */}
      <main className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth bg-[#1a140b] text-white">
        {/* =========================
            1. Hero Section
            중앙 로고 제거, 제목 중심 배치
        ========================= */}
        <section
          id="hero"
          className="snap-start relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* 배경 이미지 */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />

          {/* 배경 어둡게 처리 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#1a140b]" />

          {/* 중앙 포인트 광원 */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,178,71,0.15)_0%,transparent_60%)] pointer-events-none" />

          {/* 실제 콘텐츠 */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-5xl pt-24">
            {/* 메인 타이틀 */}
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#ffd384] via-white to-[#ffb247]">
                오늘의 위스키와 칵테일을
                <br />
                추천받아보세요
              </span>
            </h1>

            {/* 서브 문구 */}
            <p className="text-base md:text-xl text-white/75 font-light leading-relaxed mb-12">
              랜덤 추천부터 기분 기반 맞춤 추천까지,
              <br />
              당신에게 어울리는 한 잔을 찾아드립니다.
            </p>

            {/* 진입 버튼 영역 */}
            <div className="flex flex-col w-full max-w-[440px] gap-4">
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
              <MainRouterButton
                text="랜덤 위스키 추천"
                route={0}
                variant="ghost"
              />
            </div>
          </div>

          {/* 아래 이동 유도 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/50 text-3xl">
            ↓
          </div>
        </section>

        {/* =========================
            2. 서비스 소개 섹션
        ========================= */}
        <section
          id="intro"
          className="snap-start min-h-screen flex items-center bg-[#1a140b] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,178,71,0.05)_0%,transparent_50%)]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
              <h2 className="text-[#ffb247]/90 text-lg md:text-xl mb-3 tracking-[0.2em] uppercase italic">
                Overview
              </h2>
              <h3 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400">
                  어떤 서비스인가요?
                </span>
              </h3>
              <div className="h-1 w-20 bg-[#ffb247] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 랜덤 추천 카드 */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/40 to-[#1a140b] border border-white/10 shadow-2xl">
                <div className="w-16 h-16 bg-[#ffb247]/10 rounded-xl flex items-center justify-center mb-8 border border-[#ffb247]/20 text-4xl">
                  🎲
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  랜덤 위스키 추천
                </h4>
                <p className="text-slate-400 leading-relaxed font-light mb-4">
                  오늘의 위스키를 랜덤으로 추천합니다.
                </p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-sm text-slate-300 italic">
                    Glenfiddich 15년 - 부드러운 꿀 향과 오크의 조화
                  </p>
                </div>
              </div>

              {/* 맞춤 추천 카드 */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/60 to-[#1a140b] border border-[#ffb247]/20 shadow-[0_0_40px_rgba(255,178,71,0.05)]">
                <div className="w-16 h-16 bg-[#ffb247]/20 rounded-xl flex items-center justify-center mb-8 border border-[#ffb247]/40 text-4xl">
                  🌤️
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  맞춤 위스키 추천
                </h4>
                <p className="text-slate-300 leading-relaxed font-light mb-4">
                  기분과 상황에 어울리는 위스키를 찾아드립니다.
                </p>
                <div className="pt-4 border-t border-[#ffb247]/10">
                  <p className="text-xs text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-sm text-slate-300 italic">
                    Macallan 12년 - 셰리 오크의 풍부한 과일 향
                  </p>
                </div>
              </div>

              {/* 칵테일 추천 카드 */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-b from-[#2d2417]/40 to-[#1a140b] border border-white/10 shadow-2xl">
                <div className="w-16 h-16 bg-[#ffb247]/10 rounded-xl flex items-center justify-center mb-8 border border-[#ffb247]/20 text-4xl">
                  🍸
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  칵테일 추천
                </h4>
                <p className="text-slate-400 leading-relaxed font-light mb-4">
                  분위기에 맞는 칵테일과 레시피를 제안합니다.
                </p>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-[#ffb247]/70 uppercase tracking-widest mb-1">
                    Example
                  </p>
                  <p className="text-sm text-slate-300 italic">
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
          className="snap-start min-h-screen flex items-center bg-[#2d2417]/90 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a140b] via-transparent to-[#1a140b]" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
            <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
              <div>
                <h2 className="text-[#ffb247]/90 text-lg md:text-xl mb-3 tracking-[0.2em] uppercase italic">
                  Process
                </h2>
                <h3 className="text-3xl md:text-5xl font-bold text-white">
                  이용 방법
                </h3>
              </div>

              <p className="text-slate-300 max-w-md text-left md:text-right font-light text-lg leading-relaxed border-l-2 md:border-l-0 md:border-r-2 border-[#ffb247]/50 px-6">
                간단한 세 단계로 추천을 받아보세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-2xl mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  1
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  상황과 기분 선택
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-4">
                  오늘의 분위기나 선호하는 맛을 간단히 선택합니다.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-2xl mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  2
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  맞춤 정보 분석
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-4">
                  선택하신 정보를 바탕으로 당신을 위한 주류를 추천합니다.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] flex items-center justify-center font-black text-2xl mb-8 shadow-[0_0_30px_rgba(255,178,71,0.5)]">
                  3
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">
                  결과 확인
                </h4>
                <p className="text-slate-300 font-light leading-relaxed px-4">
                  위스키 이름, 특징, 추천 이유를 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            4. 결과 미리보기 섹션
        ========================= */}
        <section
          id="start"
          className="snap-start min-h-screen flex items-center bg-[#2d2417] relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ffb247]/20 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 text-center">
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-20">
              추천 결과 미리보기
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#1a140b]/40 border border-white/10 rounded-3xl p-8 text-left shadow-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-[#ffb247]/10 text-[#ffb247] text-[10px] uppercase font-bold tracking-widest mb-6">
                  Whiskey Choice
                </span>
                <h4 className="text-3xl font-bold text-white mb-2">
                  Macallan 12년
                </h4>
                <p className="text-[#ffb247]/90 font-medium mb-6">
                  바닐라와 건과일 향
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-10">
                  오늘 가볍게 즐기기 좋은 선택
                </p>
                <button className="w-full py-4 rounded-xl border border-[#ffb247]/40 text-[#ffb247] font-bold hover:bg-[#ffb247] hover:text-[#1a140b] transition-all duration-300">
                  이 추천 받기
                </button>
              </div>

              <div className="bg-[#1a140b]/60 border border-[#ffb247]/30 rounded-3xl p-8 text-left shadow-[0_0_50px_rgba(255,178,71,0.1)] scale-105 z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#ffb247] text-[#1a140b] text-[10px] uppercase font-bold tracking-widest mb-6">
                  Premium Cocktail
                </span>
                <h4 className="text-3xl font-bold text-white mb-2">
                  Old Fashioned
                </h4>
                <p className="text-[#ffb247]/90 font-medium mb-6">
                  버번 기반 클래식 칵테일
                </p>
                <p className="text-slate-300 text-sm leading-relaxed font-medium mb-10">
                  준비물: 버번, 설탕, 비터
                </p>
                <button className="w-full py-4 rounded-xl bg-gradient-to-br from-[#ffb247] to-[#d98b1e] text-[#1a140b] font-black shadow-lg transition-all duration-300">
                  이 추천 받기
                </button>
              </div>

              <div className="bg-[#1a140b]/40 border border-white/10 rounded-3xl p-8 text-left shadow-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-[#ffb247]/10 text-[#ffb247] text-[10px] uppercase font-bold tracking-widest mb-6">
                  Daily Random
                </span>
                <h4 className="text-3xl font-bold text-white mb-2">
                  Glenfiddich 18년
                </h4>
                <p className="text-[#ffb247]/90 font-medium mb-6">
                  사과와 오크의 깊은 풍미
                </p>
                <p className="text-slate-400 text-sm leading-relaxed mb-10">
                  특별한 순간을 위한 묵직한 한 잔
                </p>
                <button className="w-full py-4 rounded-xl border border-[#ffb247]/40 text-[#ffb247] font-bold hover:bg-[#ffb247] hover:text-[#1a140b] transition-all duration-300">
                  이 추천 받기
                </button>
              </div>
            </div>

            <footer className="mt-24 pb-8 text-slate-600 text-[10px] tracking-widest uppercase flex justify-center">
              <p>© 2024 R-Whiskey</p>
            </footer>
          </div>
        </section>
      </main>
    </>
  );
}
