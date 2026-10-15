"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import type { WhiskeyFeedbackReason, WhiskeyFeedbackSentiment } from "@/type/ApiInterface";
import { PaperReveal, PaperSelect } from "./PaperControls";

export default function ExpectationFeedback({ sentiment, reason, savedSentiment, loading, status, authExpired, onSentiment, onReason, onSave, comment, onComment }: {
  sentiment: WhiskeyFeedbackSentiment; reason: WhiskeyFeedbackReason;
  savedSentiment: WhiskeyFeedbackSentiment | null;
  loading: boolean; status: string | null; authExpired: boolean;
  onSentiment: (value: WhiskeyFeedbackSentiment) => void;
  onReason: (value: WhiskeyFeedbackReason) => void;
  onSave: () => void;
  comment: string;
  onComment: (value: string) => void;
}) {
  const neutral = sentiment === "NEUTRAL";
  return (
    <div className="mt-6 w-full max-w-md rounded-sm border border-[#4a3728] bg-[#efe2c9] p-6 text-stone-900">
      <h3 className="text-base font-bold">이 주문, 마음에 드세요?</h3>
      <p className="mt-2 text-sm leading-6 text-stone-700">아직 마시기 전, 추천을 보고 든 느낌을 남겨주세요.<br />실제로 마신 뒤의 후기와는 따로 받는 첫인상이에요.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {([{ value: "LIKE", label: "마셔보고 싶어요", Icon: ThumbsUp },
          { value: "DISLIKE", label: "이번엔 끌리지 않아요", Icon: ThumbsDown }] as const).map(({ value, label, Icon }) => (
          <button key={value} type="button" disabled={loading} aria-pressed={sentiment === value}
            onClick={() => onSentiment(sentiment === value ? "NEUTRAL" : value)}
            className={`flex min-h-14 flex-col items-center justify-center gap-2 rounded border px-2 py-3 text-xs font-semibold transition-colors disabled:opacity-60 ${sentiment === value
              ? "border-[#4a3728] bg-[#4a3728] text-white" : "border-[#4a3728]/40 bg-white/30 text-stone-800 hover:bg-white/60"}`}>
            <Icon aria-hidden="true" size={20} />{label}
          </button>
        ))}
      </div>
      <PaperReveal show={!neutral}>
        <div className="mt-5 border-t border-[#4a3728]/25 pt-4">
          <p className="mb-3 text-sm font-semibold">어떤 점이 그렇게 느껴졌나요?</p>
          <PaperSelect label="이유 (선택)" value={reason === "NONE" ? "" : reason} onChange={(value) => onReason((value || "NONE") as WhiskeyFeedbackReason)} disabled={loading}
            options={[{ value: "TASTE", label: "설명된 맛·향" }, { value: "PRICE", label: "가격" },
              { value: "AVAILABILITY", label: "구매하기 어려움" }, { value: "OTHER", label: "기타" }]} />
          {reason === "OTHER" && <label className="mt-4 block text-sm">더 들려주실 이야기 (선택)
            <textarea value={comment} onChange={(event) => onComment(event.target.value)} maxLength={500} disabled={loading}
              className="mt-2 min-h-24 w-full rounded border border-stone-500/60 bg-white/70 p-3 text-sm" />
            <span className="mt-1 block text-right text-xs text-stone-600">{comment.length}/500</span>
          </label>}
        </div>
      </PaperReveal>
      {neutral && savedSentiment !== null && savedSentiment !== "NEUTRAL" && <p role="status" className="mt-3 text-xs leading-5 text-stone-700">
        선택을 해제했습니다. 저장된 반응은 아래 버튼을 누르면 중립 반응으로 수정됩니다.
      </p>}
      <button type="button" onClick={onSave} disabled={loading || (neutral && (savedSentiment === null || savedSentiment === "NEUTRAL"))}
        className="mt-5 min-h-11 w-full bg-[#111] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#4a3728] disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "감상 저장 중…" : neutral && savedSentiment === "NEUTRAL" ? "중립 반응 저장됨" : neutral && savedSentiment !== null ? "중립 반응으로 저장" : "이 감상 남기기"}
      </button>
      {neutral && savedSentiment === null && <p className="mt-2 text-center text-xs text-stone-600">지금은 선택하지 않고 넘어가도 괜찮아요.</p>}
      {status && <div role="status" className="mt-3 text-sm leading-6"><p>{status}</p>
        {authExpired && <Link href="/login" className="mt-2 inline-block font-semibold underline">다시 로그인</Link>}
      </div>}
    </div>
  );
}
