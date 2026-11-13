"use client";

import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

const tabs = [
  {
    id: "whiskey",
    label: "위스키",
    href: "/mood/verified",
    cta: "위스키 주문서 열기",
    steps: [
      ["경험 단계 고르기", "초심자 · 중급 · 상급 중 하나를 골라요."],
      ["취향 고르기", "연기 향이 괜찮은지, 끌리는 향을 골라요. 원하면 국가 · 종류 · 숙성 통으로 더 좁힐 수 있어요."],
      ["주문하고 결과 보기", "오늘의 한 잔과 바텐더의 한마디, 함께 즐겨볼 안주를 받아요."]
    ]
  },
  {
    id: "cocktail",
    label: "칵테일",
    href: "/cocktail",
    cta: "칵테일 주문서 열기",
    steps: [
      ["경험 고르기", "입문자 · 경험자 · 홈바 중 하나를 골라요."],
      ["취향 고르기", "무알콜 여부, 기주, 좋아하는 맛, 탄산, 피하고 싶은 재료를 골라요."],
      ["기분을 남기고 결과 보기", "재료와 만드는 순서, 도수, 어울리는 안주까지 받아요."]
    ]
  }
] as const;

/** 이용 방법: 실제 주문서와 같은 종이 카드 위에 위스키·칵테일 절차를 탭으로 보여준다. */
export default function HowToOrder() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (active + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="relative w-full max-w-[34rem] rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:p-7">
      <div className="pointer-events-none absolute inset-2 border border-[#4a3728]/20" />
      <div role="tablist" aria-label="추천 종류" onKeyDown={onKeyDown} className="relative flex border-b border-[#4a3728]/30">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => { tabRefs.current[index] = node; }}
            id={`howto-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={active === index}
            aria-controls={`howto-panel-${tab.id}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            className={`-mb-px min-h-11 flex-1 border-b-2 px-4 text-base font-bold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[#4a3728] ${
              active === index ? "border-[#2d2017] text-[#2d2017]" : "border-transparent text-stone-600 hover:text-[#2d2017]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 두 탭을 한 칸에 겹쳐 더 긴 쪽 높이로 고정한다. 탭을 바꿔도 snap 위치가 흔들리지 않는다. */}
      <div className="relative grid">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            id={`howto-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`howto-tab-${tab.id}`}
            className={`col-start-1 row-start-1 flex flex-col ${active === index ? "" : "invisible"}`}
          >
            <ol className="mt-5 space-y-4">
              {tab.steps.map(([title, text], step) => (
                <li key={title} className="flex gap-4">
                  <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#4a3728] text-sm font-bold text-[#4a3728]">
                    {step + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#2d2017]">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-700 break-keep">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href={tab.href}
              className="mt-6 flex min-h-12 w-full items-center justify-center bg-[#111] px-5 text-sm font-bold tracking-[0.12em] text-white transition-colors hover:bg-[#2d2017] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a3728]"
            >
              {tab.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
