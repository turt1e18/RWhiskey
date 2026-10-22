"use client";

import { useId, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const inputStyle = "w-full rounded border border-stone-500/60 bg-white/70 py-2.5 text-sm font-normal text-stone-900 outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700 disabled:opacity-60";

export function PaperSelect({ label, value, options, onChange, disabled = false, hint, emptyLabel = "선택하지 않음" }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  hint?: string;
  emptyLabel?: string;
}) {
  const id = useId();
  return (
    <div className="block text-sm font-semibold">
      <label htmlFor={id}>{label}</label>
      <span className="relative mt-2 block">
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`${inputStyle} appearance-none pl-3 pr-9`}>
          <option value="">{emptyLabel}</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" size={17} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-stone-700" />
      </span>
      {hint && <span id={`${id}-hint`} className="mt-2 block text-xs font-normal leading-5 text-amber-900">{hint}</span>}
    </div>
  );
}

/** Decimal ABV input without browser number steppers. Empty means no restriction. */
export function PaperAbvInput({ label, value, onChange, unit = "ABV" }: {
  label: string; value: string; onChange: (value: string) => void; unit?: "ABV" | "PROOF";
}) {
  const id = useId();
  return (
    <div className="block text-sm font-semibold">
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} type="text" inputMode="decimal" maxLength={7}
        aria-describedby={`${id}-hint`} placeholder={unit === "ABV" ? "예: 46" : "예: 92"}
        onChange={(event) => {
          const next = event.target.value;
          if (/^\d{0,3}(\.\d{0,3})?$/.test(next) && (next === "" || next === "." || Number(next) <= (unit === "ABV" ? 100 : 200))) onChange(next);
        }} className={`${inputStyle} mt-2 px-3`} />
      <span id={`${id}-hint`} className="mt-1 block text-xs font-normal text-stone-600">{unit === "ABV" ? "0~100%" : "0~200 US Proof"} · 비워두어도 됩니다</span>
    </div>
  );
}

export function PaperDisclosure({ title, open, onToggle, children, count = 0 }: {
  title: string; open: boolean; onToggle: () => void; children: ReactNode; count?: number;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  return (
    <div className="mt-8 border-t border-[#4a3728]/25 pt-3">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={id}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4a3728]">
        <span>{title}{count > 0 && <span className="ml-2 text-xs font-normal">{count}개 선택</span>}</span>
        <ChevronDown aria-hidden="true" size={18} className={`shrink-0 ${reduceMotion ? "" : "transition-transform duration-200"} ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={id}><AnimatePresence initial={false}>
        {open && <motion.div key={id}
          initial={{ height: reduceMotion ? "auto" : 0, opacity: reduceMotion ? 1 : 0 }}
          animate={{ height: "auto", opacity: 1 }} exit={{ height: reduceMotion ? "auto" : 0, opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }} className="overflow-hidden">
          <div className="pb-1">{children}</div>
        </motion.div>}
      </AnimatePresence></div>
    </div>
  );
}

export function PaperReveal({ show, children }: { show: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return <AnimatePresence initial={false}>{show && <motion.div
    initial={{ height: reduceMotion ? "auto" : 0, opacity: reduceMotion ? 1 : 0 }}
    animate={{ height: "auto", opacity: 1 }} exit={{ height: reduceMotion ? "auto" : 0, opacity: 0 }}
    transition={{ duration: reduceMotion ? 0 : 0.2 }} className="overflow-hidden">{children}</motion.div>}
  </AnimatePresence>;
}
