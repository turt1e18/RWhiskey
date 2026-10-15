"use client";
import { useState } from "react";
import type { WhiskeyAroma, WhiskeyProfile, WhiskeyTastePreference, WhiskeyBodyPreference } from "@/type/ApiInterface";
import { PaperDisclosure, PaperSelect } from "./PaperControls";
export const aromaOptions: { value: WhiskeyAroma; label: string }[] = [
  { value: "VANILLA_CARAMEL", label: "바닐라·캐러멜" }, { value: "FRESH_FRUIT", label: "과일·감귤" },
  { value: "DRIED_FRUIT", label: "건포도·말린 과일" }, { value: "FLORAL_HERBAL", label: "꽃·허브" },
  { value: "CEREAL_NUTTY", label: "곡물·견과" }, { value: "ROASTED_COCOA", label: "커피·초콜릿" },
  { value: "WOODY_SPICY", label: "나무·향신료" },
];
export default function WhiskeyTasteFields({ profile, onChange }: { profile: WhiskeyProfile; onChange: (value: WhiskeyProfile) => void }) {
  const [open, setOpen] = useState(false);
  const selected = profile.aromaPreferences ?? [];
  const max = profile.experienceLevel === "BEGINNER" ? 2 : 4;
  return <div className="mt-5">
    <fieldset>
      <legend className="text-sm font-semibold">어떤 향이 끌리나요? (선택)</legend>
      <p className="mt-2 text-xs leading-5 text-stone-600">최대 {max}개를 골라주세요. 잘 모르겠으면 고르지 않아도 됩니다.</p>
      <div className="mt-3 flex flex-wrap gap-2">{aromaOptions.map(({ value, label }) => {
        const active = selected.includes(value);
        return <button key={value} type="button" aria-pressed={active} disabled={!active && selected.length >= max}
          onClick={() => onChange({ ...profile, preferredFlavor: "UNKNOWN", aromaPreferences: active ? selected.filter((item) => item !== value) : [...selected, value] })}
          className={`min-h-11 rounded-full border px-3 py-2 text-xs transition-colors disabled:opacity-45 ${active ? "border-[#4a3728] bg-[#4a3728] text-white" : "border-[#4a3728]/35 bg-white/25 text-stone-800"}`}>{label}</button>;
      })}</div>
      <p role="status" className="mt-2 text-xs leading-5 text-stone-600">{selected.length >= max ? `${max}개를 골랐어요. 다른 향을 고르려면 하나를 해제해 주세요.` : `${selected.length}개 선택`}</p>
    </fieldset>
    <PaperDisclosure title="맛과 질감도 알려주기 (선택)" open={open} onToggle={() => setOpen(!open)}>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <PaperSelect label="끌리는 맛" value={profile.tastePreference === "UNKNOWN" ? "" : profile.tastePreference ?? ""}
          onChange={(value) => onChange({ ...profile, tastePreference: (value || "UNKNOWN") as WhiskeyTastePreference })}
          options={[{ value: "SWEET", label: "달콤한 맛" }, { value: "DRY", label: "덜 달고 담백한 맛" },
            { value: "BITTER", label: "쌉쌀한 맛" }, { value: "SOUR", label: "산뜻한 산미" },
            { value: "SALTY", label: "짭짤한 인상" }, { value: "UMAMI", label: "감칠맛" }]} />
        <PaperSelect label="입안에서 느껴지는 질감" value={profile.bodyPreference === "UNKNOWN" ? "" : profile.bodyPreference ?? ""}
          onChange={(value) => onChange({ ...profile, bodyPreference: (value || "UNKNOWN") as WhiskeyBodyPreference })}
          options={[{ value: "LIGHT", label: "가볍고 산뜻한 느낌" }, { value: "FULL", label: "묵직하고 풍성한 느낌" }]} />
      </div>
      <p className="mt-3 text-xs leading-5 text-stone-600">향과 입안의 맛은 다를 수 있어요.<br />이 선택은 취향을 참고하며, 정보가 부족하면 다른 병을 제안할 수 있어요.</p>
    </PaperDisclosure>
  </div>;
}
