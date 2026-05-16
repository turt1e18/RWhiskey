"use client";

import { HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Props {
  parentView?: string;
}

/**
 * 바텐더의 가이드북
 */
export const HelpGuide = ({ parentView }: Props) => {
  const [open, setOpen] = useState(false);

  // 상위 뷰가 바뀔 때 가이드를 자동으로 닫음 (Persistence 문제 해결)
  useEffect(() => {
    setOpen(false);
  }, [parentView]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="도움말 열기"
          className="btn-stamp absolute top-3 right-3 md:top-4 md:right-4 z-20 aspect-square text-xs !border flex items-center justify-center !p-0 !min-w-0 !min-h-0 !rounded-none"
          style={{ width: '25px', height: '25px' }}
        >
          <span 
            className="font-serif font-black leading-none"
            style={{ textShadow: "0.5px 0 0 currentColor, -0.5px 0 0 currentColor" }}
          >
            ?
          </span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="paper-block !bg-[#fdfbf7] border-l-2 border-[#3e2616]/30 w-full sm:max-w-md md:max-w-lg p-0 notes-font-all"
      >
        <div className="px-7 py-8 md:px-9 md:py-10 text-[#3e2616]">
          <SheetHeader className="mb-6 border-b border-[#3e2616]/20 pb-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] opacity-60">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bartender's Guide</span>
            </div>
            <SheetTitle className="font-serif text-3xl text-[#3e2616]">
              바텐더의 가이드북
            </SheetTitle>
            <SheetDescription className="font-serif italic text-[#3e2616]/70">
              처음 잔을 드신 분들을 위한 짧은 안내서입니다.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-7 font-serif leading-relaxed text-[15px] text-[#3e2616]/90">
            <Section
              index="01"
              title="오더 시트 화면 안내"
              body="좌측의 가죽 커버는 당신이 선택한 위스키의 추천 맥락(날씨, 기분 등)을 기억하는 공간입니다. 우측의 종이 시트에서 당신의 기록을 관리하세요."
            />

            <Section
              index="02"
              title="테이스팅 노트 작성법"
            >
              <div className="mb-4">
                <p className="mb-3 font-semibold text-[#c9a14a]">기본 양식 —</p>
                <ul className="space-y-2 pl-1">
                  <li>
                    <span className="font-bold border-b border-[#3e2616]/30 mr-2">향 (Nose)</span>
                    <br />
                    <span className="text-sm opacity-80">잔에서 피어오르는 첫 내음을 기록하세요.</span>
                  </li>
                  <li>
                    <span className="font-bold border-b border-[#3e2616]/30 mr-2">맛 (Palate)</span>
                    <br />
                    <span className="text-sm opacity-80">혀에 닿았을 때 느껴지는 풍미와 질감을 적어보세요.</span>
                  </li>
                  <li>
                    <span className="font-bold border-b border-[#3e2616]/30 mr-2">여운 (Finish)</span>
                    <br />
                    <span className="text-sm opacity-80">삼킨 후 목구멍과 코끝에 남는 잔향을 자유롭게 남기세요.</span>
                  </li>
                </ul>
              </div>
              <p>
                <span className="font-semibold text-[#c9a14a]">자율 양식 — </span>
                형식에 얽매이고 싶지 않다면 한 편의 일기처럼 그날의 감상과 위스키의 느낌을 줄글로 남겨보세요.
              </p>
            </Section>

            <Section index="03" title="제출 및 보관 방식">
              <p className="mb-2">
                <span className="font-semibold">개인 보관 — </span>
                나만의 다이어리에 조용히 기록을 남깁니다. 언제든 다시 열어볼 수 있습니다.
              </p>
              <p>
                <span className="font-semibold">익명 제출 — </span>
                바(Bar)의 다른 손님들과 감상을 공유합니다. 내 기록이 게시판에 익명으로 걸리게 됩니다.
              </p>
            </Section>

            <Section
              index="04"
              title="라운지 (게시판) 이용법"
              body="라운지는 이 바를 다녀간 사람들의 기록이 남겨진 코르크 보드입니다. 마음에 드는 타인의 테이스팅 노트를 발견했다면, 하단의 '글렌캐런 잔'을 눌러 조용히 건배(추천)를 건네보세요."
            />
          </div>

          <div className="mt-10 pt-5 border-t border-[#3e2616]/20 text-[11px] uppercase tracking-[0.4em] text-[#3e2616]/50 text-center">
            — Sláinte —
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Section = ({
  index,
  title,
  body,
  children,
}: {
  index: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) => (
  <section>
    <div className="flex items-baseline gap-3 mb-2">
      <span className="text-[11px] tracking-[0.3em] text-[#3e2616]/50">{index}</span>
      <h3 className="font-serif text-xl text-[#3e2616]">{title}</h3>
    </div>
    <div className="pl-9 border-l border-dashed border-[#3e2616]/20">
      {body && <p>{body}</p>}
      {children}
    </div>
  </section>
);
