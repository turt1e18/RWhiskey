"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import WhiskeyLoader from "@/components/WhiskeyLoader";

export default function WhiskeyLoadingOverlay({ active, messages }: {
  active: boolean;
  messages: readonly string[];
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();

  useEffect(() => {
    if (!active || !overlayRef.current) return;
    const overlay = overlayRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== overlay)
      .map((element) => ({ element, inert: element.inert }));

    background.forEach(({ element }) => { element.inert = true; });
    document.body.style.overflow = "hidden";
    overlay.focus({ preventScroll: true });

    return () => {
      background.forEach(({ element, inert }) => { element.inert = inert; });
      document.body.style.overflow = previousOverflow;
      // Do not replace focus already moved to the completed recommendation.
      if ((document.activeElement === document.body || overlay.contains(document.activeElement)) &&
          previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [active]);

  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <div ref={overlayRef} role="dialog" aria-modal="true" aria-label="위스키 추천 준비 중"
      aria-describedby={descriptionId} tabIndex={-1}
      onKeyDown={(event) => { if (event.key === "Tab") event.preventDefault(); }}
      className="fixed inset-0 z-[2147483647] flex overflow-y-auto bg-black/60 px-6 py-8 backdrop-blur-sm">
      <div className="m-auto w-full max-w-sm shrink-0 px-4 py-6 text-center text-stone-100">
        <p id={descriptionId} className="text-sm leading-6">주문에 맞는 한 잔을 준비하고 있어요</p>
        <WhiskeyLoader messages={messages} />
      </div>
    </div>,
    document.body,
  );
}
