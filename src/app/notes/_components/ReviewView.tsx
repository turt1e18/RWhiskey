"use client";

import { useState } from "react";
import { WhiskyEntry } from "../_data/mockData";
import { StarRating } from "./StarRating";
import { ArrowLeft, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  whisky: WhiskyEntry;
  onBack: () => void;
  onSubmit: (data: { flow: "A" | "B"; payload: Partial<WhiskyEntry> }) => void;
}

type Mode = "basic" | "free";

export const ReviewView = ({ whisky, onBack, onSubmit }: Props) => {
  const [mode, setMode] = useState<Mode>(whisky.formType || "basic");
  const [nose, setNose] = useState(whisky.nose || "");
  const [palate, setPalate] = useState(whisky.palate || "");
  const [finish, setFinish] = useState(whisky.finish || "");
  const [memo, setMemo] = useState(whisky.memo || "");
  const [rating, setRating] = useState(whisky.rating || 0);
  const [flow, setFlow] = useState<"A" | "B">(whisky.shared ? "A" : "B");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isRated = whisky.status === "평가완료";

  const handleSubmit = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const payload: Partial<WhiskyEntry> = {
      status: "평가완료",
      formType: mode,
      rating,
      // 양식에 따라 필드 선택적 포함
      ...(mode === "basic"
        ? { nose, palate, finish, memo: "" } // 기본 양식일 때 메모 비움
        : { memo, nose: "", palate: "", finish: "" }), // 자율 양식일 때 향/맛/여운 비움
    };
    setConfirmOpen(false);
    onSubmit({ flow, payload });
  };

  const displayName = whisky.whiskyName || (whisky as any).whiskeyName || (whisky as any).drinkName || (whisky as any).nameKo || whisky.cocktailName || "Unknown Item";
  const displayEnName = whisky.whiskyNameEn || (whisky as any).whiskeyNameEn || (whisky as any).drinkNameEn || (whisky as any).nameEn || (whisky.category === "cocktail" ? "Cocktail Recipe" : "");

  return (
    <div className="relative h-full flex flex-col text-[#3e2616]">
      <button
        onClick={onBack}
        className="absolute -top-2 -left-2 flex items-center gap-1 text-xs text-[#3e2616]/60 hover:text-[#3e2616]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> 목록
      </button>

      {/* 우측 상단 작은 원형 도장 */}
      {isRated && (
        <div className="pointer-events-none absolute -right-4 -top-6 md:-top-8">
          <div className="stamp-circle font-serif w-[155px] h-[155px] md:w-[180px] md:h-[180px] border-[4px] flex flex-col items-center justify-center">
            <span className="text-[8px] md:text-[10px] tracking-[0.2em] font-bold">TASTED</span>
            <span className="text-[7px] md:text-[8px] mt-2 tracking-widest font-medium">
              {whisky.ratedAt ?? ""}
            </span>
          </div>
        </div>
      )}

      <header className="mb-6 border-b-2 border-double border-[#3e2616]/40 pb-4 mt-6 pr-56">
        <p className="text-xs uppercase tracking-[0.3em] text-[#3e2616]/60 font-bold">
          {whisky.category === "whisky" ? "Whisky" : "Cocktail"} Tasting Note
        </p>
        <h2 className="font-serif text-3xl text-[#3e2616] mt-1 font-bold">{displayName}</h2>
      </header>

      {/* 모드 토글 */}
      <div className="inline-flex self-start rounded-sm border-2 border-[#3e2616] overflow-hidden mb-6 text-xs shadow-sm">
        {(["basic", "free"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-5 py-2 font-serif font-bold tracking-wider transition-colors ${
              mode === m ? "bg-[#3e2616] text-[#fdfbf7]" : "bg-transparent text-[#3e2616]"
            }`}
          >
            {m === "basic" ? "기본 양식" : "자율 양식"}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto pr-2 scrollbar-soft pb-4">
        {mode === "basic" ? (
          <>
            <Field label="향 (Nose)">
              <NoteArea
                value={nose}
                onChange={setNose}
                rows={3}
                maxRows={3}
                placeholder="첫 향에서 어떤 인상을 받으셨나요?"
              />
            </Field>
            <div className="border-b border-[#3e2616]/20" />
            <Field label="맛 (Palate)">
              <NoteArea
                value={palate}
                onChange={setPalate}
                rows={3}
                maxRows={3}
                placeholder="입안에서 펼쳐지는 맛을 적어 주세요."
              />
            </Field>
            <div className="border-b border-[#3e2616]/20" />
            <Field label="여운 (Finish)">
              <NoteArea
                value={finish}
                onChange={setFinish}
                rows={3}
                maxRows={3}
                placeholder="삼킨 뒤 남은 여운은 어떠셨나요?"
              />
            </Field>
          </>
        ) : (
          <Field label="시음 메모">
            <NoteArea
              value={memo}
              onChange={setMemo}
              rows={12}
              placeholder="자유롭게 오늘의 한 잔을 기록하세요…"
            />
          </Field>
        )}

        {/* 총점 별점 */}
        <div className="pt-6 mt-4 border-t-2 border-[#3e2616]/30">
          <p className="text-[12px] uppercase tracking-[0.25em] text-[#3e2616] mb-3 font-serif font-bold">
            총점
          </p>
          <StarRating value={rating} onChange={setRating} size={32} />
        </div>
      </div>

      {/* 하단 액션 */}
      <div className="mt-4 flex items-end justify-between border-t border-dotted border-[#3e2616]/40 pt-4">
        <div className="flex flex-col gap-2 text-xs text-[#3e2616]/70">
          <span className="uppercase tracking-widest">제출 방식</span>
          <div className="flex gap-4">
            <CustomRadio
              label="익명 제출"
              checked={flow === "A"}
              onSelect={() => setFlow("A")}
            />
            <CustomRadio
              label="개인 보관"
              checked={flow === "B"}
              onSelect={() => setFlow("B")}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-6 py-2.5 bg-[#3e2616] text-[#fdfbf7] font-serif tracking-wider text-sm rounded-sm hover:bg-[#3e2616]/90 transition-colors shadow-md"
        >
          평가 완료
        </button>
      </div>

      {/* 제출 확인 모달 */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#fdfbf7] border-[#3e2616]/30 text-[#3e2616] font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans text-2xl text-[#3e2616] font-bold">
              평가 완료
            </DialogTitle>
            <DialogDescription className="text-[#3e2616]/70 text-base pt-2 font-sans">
              오늘의 한 잔이 당신의 다이어리에 기록되었습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 bg-[#3e2616] text-[#fdfbf7] font-sans tracking-wider text-sm rounded-sm hover:bg-[#3e2616]/90 transition-colors shadow-md font-bold"
            >
              확인
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CustomRadio = ({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    className="flex items-center gap-2 group transition-colors hover:text-[#3e2616]"
  >
    <div
      className={`w-4 h-4 border border-[#3e2616]/50 rounded-[2px] flex items-center justify-center transition-all ${
        checked ? "bg-[#3e2616] border-[#3e2616]" : "bg-transparent group-hover:border-[#3e2616]"
      }`}
    >
      {checked && <Check className="w-3 h-3 text-[#fdfbf7] stroke-[3px]" />}
    </div>
    <span className={checked ? "text-[#3e2616] font-medium" : ""}>{label}</span>
  </button>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[12px] uppercase tracking-[0.25em] text-[#3e2616] mb-3 font-serif font-bold">
      {label}
    </p>
    {children}
  </div>
);

const NoteArea = ({
  value,
  onChange,
  rows = 3,
  maxRows,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  maxRows?: number;
  placeholder?: string;
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full resize-none bg-transparent outline-none px-1 py-2 text-[#3e2616] font-serif text-lg md:text-xl font-bold leading-relaxed placeholder:text-[#3e2616]/30 placeholder:font-normal"
    style={{
      height: maxRows ? `${maxRows * 32 + 16}px` : undefined,
      maxHeight: maxRows ? `${maxRows * 32 + 16}px` : undefined,
      overflowY: "auto",
    }}
  />
);
