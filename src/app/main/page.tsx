"use client";

import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "@/lib/useDialogFocus";
import RWhiskeyLogo from "./_components/LogoText";
import MainRouterButton from "./_components/MainRouterButton";
import NoticeModal from "./_components/NoticeModal";
import HowToOrder from "./_components/HowToOrder";
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
  const drawerRef = useDialogFocus<HTMLDivElement>(isMenuOpen, () => setIsMenuOpen(false));
  const mainRef = useRef<HTMLElement>(null);

  // 768px 이상에서는 <main>이 스크롤 컨테이너라, 초점이 그 밖(body·상단 메뉴)에 있으면
  // PageDown·Space 같은 키가 화면을 넘기지 못한다. 스크롤 키를 누르는 순간 초점을 <main>으로 옮긴다.
  useEffect(() => {
    const scrollKeys = new Set(["PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End", " "]);
    const onKeyDown = (event: KeyboardEvent) => {
      const main = mainRef.current;
      const active = document.activeElement as HTMLElement | null;
      if (!main || !scrollKeys.has(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (active && main.contains(active)) return;
      // 모달·서랍 안, 입력 칸에서는 키를 그대로 둔다. Space는 버튼을 누르는 키이므로 버튼에서도 그대로 둔다.
      if (active?.closest('[role="dialog"], input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === " " && active?.closest("button")) return;
      main.focus({ preventScroll: true });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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
          <div className="hidden lg:flex items-center gap-8">
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
              href="#result"
              className="text-sm font-medium text-white/80 hover:text-[#ffb247] transition-colors"
            >
              결과 미리보기
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
            className="flex lg:hidden flex-col items-center justify-center gap-1.5 min-h-11 min-w-11 z-[60]"
            aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isMenuOpen}
            aria-controls="main-drawer"
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
        className={`fixed inset-0 z-[55] ${
          // 열 때는 즉시 보이게 해야 서랍 안으로 포커스를 옮길 수 있다. 닫을 때만 슬라이드가 끝난 뒤 숨긴다.
          isMenuOpen ? "visible" : "invisible transition-all duration-300 delay-300"
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
          id="main-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="메뉴"
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
              href="#result"
              onClick={() => setIsMenuOpen(false)}
              className="text-xl font-medium text-white/90 hover:text-[#ffb247]"
            >
              결과 미리보기
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
      <main ref={mainRef} tabIndex={-1} className="rw-scrollbar outline-none min-h-screen overflow-y-auto bg-[#1a140b] text-white md:h-screen md:snap-y md:snap-mandatory md:scroll-smooth">
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
              내 경험과 취향에 맞춘 추천으로,
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
            </div>
          </div>

          {/* 아래 이동 유도 - 모바일 숨김 */}
          <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce text-white/50 text-3xl">
            ↓
          </div>
        </section>

        {/* =========================
            2. 서비스 소개: 경험에 맞춘 주문서
        ========================= */}
        <section
          id="intro"
          aria-labelledby="intro-title"
          className="relative overflow-hidden px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:pt-28 md:pb-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,178,71,0.06)_0%,transparent_50%)]" />

          <div className="relative z-10 w-full max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <h2 id="intro-title" className="text-[1.75rem] sm:text-[2rem] md:text-[2.75rem] font-bold leading-tight text-white break-keep">
                바텐더에게 묻듯,
                <br />
                내 경험에 맞게
              </h2>
              {/* 문장마다 줄을 나누고, 좁은 화면에서는 각 문장의 줄 길이를 고르게 맞춘다. */}
              <p className="mt-4 text-base md:text-lg leading-relaxed text-white/75 break-keep">
                <span className="block text-balance">위스키가 처음이어도, 이미 좋아하는 병이 있어도 괜찮아요.</span>
                <span className="block text-balance">아는 만큼만 고르면 오늘 어울리는 한 잔과 그 이유를 알려드려요.</span>
              </p>
            </div>

            <ul className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-3 border-y border-[#ffb247]/20 md:divide-x divide-y md:divide-y-0 divide-[#ffb247]/20">
              {[
                ["처음이라면", "연기 향이 괜찮은지와 끌리는 향 두 가지만 고르면 돼요. 잘 모르겠다면 그대로 추천받아도 괜찮아요."],
                ["조금 마셔봤다면", "아는 취향만 고르고, 원하면 생산 국가 · 위스키 종류 · 숙성 통으로 더 좁혀요."],
                ["잘 안다면", "독립 병입 · 올드바틀까지 후보에 넣고, 도수를 ABV나 Proof로 정할 수 있어요."]
              ].map(([title, text], index) => (
                <li key={title} className="py-6 md:px-8 md:py-8 first:md:pl-0 last:md:pr-0">
                  <div aria-hidden="true" className="flex gap-1.5">
                    {[0, 1, 2].map((dot) => (
                      <span key={dot} className={`h-2 w-2 rounded-full ${dot <= index ? "bg-[#ffb247]" : "bg-[#ffb247]/20"}`} />
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl md:text-2xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-[0.9375rem] md:text-base leading-relaxed text-white/70 break-keep">{text}</p>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-[0.9375rem] text-white/60 break-keep">
              칵테일도 입문자 · 경험자 · 홈바 중에서 내 경험을 고르고 시작해요.
            </p>
          </div>
        </section>

        {/* =========================
            3. 이용 방법: 위스키 | 칵테일 탭
        ========================= */}
        <section
          id="how-to"
          aria-labelledby="how-to-title"
          className="relative overflow-hidden px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:pt-28 md:pb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a140b] via-transparent to-[#1a140b]" />

          <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div>
              <h2 id="how-to-title" className="text-[1.75rem] sm:text-[2rem] md:text-[2.75rem] font-bold leading-tight text-white break-keep">
                세 번 고르면
                <br />
                주문 완료
              </h2>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-white/75 break-keep">
                모르는 항목은 비워둬도 추천받을 수 있어요.
              </p>
              <div className="mt-6 space-y-2 text-[0.9375rem] leading-relaxed text-white/65 break-keep">
                <p>추천은 로그인한 뒤에 받을 수 있어요.</p>
                <p>위스키 추천은 결과가 저장될 때 추천 횟수를 1회 사용하고, 실패한 주문은 차감하지 않아요.</p>
              </div>
              {!isAuthenticated && (
                <a
                  href="/login"
                  className="mt-5 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-[#ffb247] underline underline-offset-4 hover:text-[#ffc266]"
                >
                  먼저 로그인하기
                </a>
              )}
            </div>

            <div className="flex justify-center md:justify-end">
              <HowToOrder />
            </div>
          </div>
        </section>

        {/* =========================
            4. 결과 미리보기: 실제 결과 카드와 같은 항목
        ========================= */}
        <section
          id="result"
          aria-labelledby="result-title"
          className="relative overflow-hidden bg-[#2d2417] px-4 py-16 sm:px-6 md:min-h-screen md:snap-start md:flex md:items-center md:px-6 md:pt-28 md:pb-10"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,178,71,0.2),transparent_70%)]" />

          <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-center">
            {/* 샘플 카드: 실제 /mood/verified 결과의 항목 순서를 따른다 */}
            <article
              aria-label="추천 결과 카드 예시"
              className="relative mx-auto w-full max-w-[18rem] lg:max-w-[20rem] px-5 py-5 flex flex-col items-center bg-[#e5d5b7] text-stone-900 border border-[#4a3728] rounded-[0.125rem] shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_10px_rgba(0,0,0,0.3)]"
            >
              <div className="w-full flex justify-between text-xs font-bold tracking-[0.15em] text-stone-700 italic">
                <span>SAMPLE</span>
                <span>R-WHISKEY</span>
              </div>
              <p className="mt-3 border border-[#4a3728] px-2.5 py-0.5 text-xs font-bold tracking-[0.2em] text-[#4a3728]">
                오늘의 추천
              </p>
              <div className="mt-3 w-full h-[6.5rem] lg:h-[7.5rem] flex items-center justify-center overflow-hidden">
                <img
                  alt=""
                  className="max-h-full object-contain"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYKP5t3Gq3nsLh5zVKaC4O0xCsaZlMlgRPphdkfsPYCu_C7d6UKnbVv08o7FUoKrMfQPcN8U5EF9Iox9wxQy3NtU1yHyIkgyDcrXFK4kzv7CDcXu8M7-LwUHOE-a3rnhiwMXYzvAyziYjjBoNP0pYH3_wu46advcvc0p_OHsRler7y91mPaLpLcZ5o9Rgs8aAZJ0c6rxYinNBKfHZtmlcoAMEirnrxRfv84ZFVF3QpSLX34OoUkTM10eHu3K6oq9j0DZhRyeQZl2-T"
                />
              </div>
              <p className="mt-3 font-serif text-2xl font-semibold leading-tight text-black">라가불린 16년</p>
              <p className="mt-1 text-xs tracking-[0.08em] text-stone-700">싱글 몰트 · 스코틀랜드 아일라</p>

              {[
                ["바텐더의 한마디", "모닥불 같은 연기 뒤로 말린 과일의 단맛이 길게 남아요. 천천히 한 모금씩 즐겨보세요."],
                ["이 병을 조금 더 알아보면", "세부 산지 아일라 · 숙성 16년 · 도수 43%"],
                ["함께 즐겨볼 안주", "훈제 연어, 다크 초콜릿 한 조각"]
              ].map(([label, text]) => (
                <div key={label} className="w-full mt-3 pt-2.5 border-t border-[rgba(74,55,40,0.25)]">
                  <p className="text-xs font-bold tracking-[0.1em] text-stone-800">{label}</p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-black break-keep">{text}</p>
                </div>
              ))}
            </article>

            <div>
              <h2 id="result-title" className="text-[1.75rem] sm:text-[2rem] md:text-[2.75rem] font-bold leading-tight text-white break-keep">
                이름보다
                <br />
                이유를 드려요
              </h2>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-white/75 break-keep">
                추천 결과는 주문서처럼 한 장의 카드로 받아요.
              </p>

              <dl className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  ["왜 이 잔인지", "바텐더의 한마디로 이 병을 고른 이유를 설명해요."],
                  ["병을 조금 더", "산지 · 숙성 통 · 도수 같은 정보를 출처 링크와 함께 보여줘요. 아직 확인 중인 정보도 있어 참고용으로 봐 주세요."],
                  ["곁들일 안주", "풍미에 맞춘 제안이에요. 알레르기는 꼭 확인해 주세요."],
                  ["내 시음 노트로", "마신 뒤 기록을 남기면 나중에 다시 찾아볼 수 있어요."]
                ].map(([term, text]) => (
                  <div key={term} className="border-t border-white/15 pt-4">
                    <dt className="text-base md:text-lg font-bold text-white">{term}</dt>
                    <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/70 break-keep">{text}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-[0.9375rem] text-white/60 break-keep">
                칵테일은 필요한 재료와 만드는 순서까지 받아요.
              </p>
            </div>
          </div>
        </section>

        {/* =========================
            5. 마무리: 다시 시작
        ========================= */}
        <section
          id="start"
          aria-labelledby="start-title"
          className="relative overflow-hidden px-4 py-20 sm:px-6 md:min-h-screen md:snap-start md:flex md:flex-col md:justify-center md:px-6 md:pt-28 md:pb-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,178,71,0.12)_0%,transparent_60%)] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center w-full max-w-5xl mx-auto md:flex-1 md:justify-center">
            <h2 id="start-title" className="text-[1.75rem] sm:text-[2rem] md:text-[2.75rem] font-bold leading-tight text-white break-keep">
              오늘의 한 잔,
              <br />
              지금 주문해 보세요
            </h2>
            <p className="mt-4 mb-8 md:mb-10 text-base md:text-lg leading-relaxed text-white/75 break-keep">
              몇 가지만 고르면 바텐더가 골라드려요.
            </p>

            <div className="flex flex-col w-full max-w-[27.5rem] gap-3 md:gap-4">
              <MainRouterButton text="위스키 추천 받기" route={1} variant="primary" />
              <MainRouterButton text="칵테일 추천 받기" route={2} variant="secondary" />
            </div>

            {isAuthenticated ? (
              <a href="/notes" className="mt-6 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-white/80 underline underline-offset-4 hover:text-[#ffb247]">
                내 시음 노트 보기
              </a>
            ) : (
              <a href="/login" className="mt-6 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-white/80 underline underline-offset-4 hover:text-[#ffb247]">
                계정이 있다면 로그인
              </a>
            )}
          </div>

          <p className="relative z-10 mt-12 md:mt-0 text-center text-sm text-white/50">
            과도한 음주는 건강에 해로울 수 있습니다.
          </p>
        </section>
      </main>
    </>
  );
}
