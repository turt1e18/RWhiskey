"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cocktailApi } from "@/api/whiskeyApi";
import { isLoginRequiredError, LOGIN_REQUIRED_MESSAGE } from "@/lib/userFacingError";
import type { CocktailFeedback } from "@/type/ApiInterface";

const REASONS: { value: CocktailFeedback["reason"]; label: string }[] = [
  { value: "WRONG_RECIPE", label: "재료·레시피가 이상해요" },
  { value: "ALLERGEN_INCLUDED", label: "기피 재료가 들어 있어요" },
  { value: "TASTE", label: "취향과 달라요" },
  { value: "OTHER", label: "기타" },
];

/** 결과에 대한 반응을 남긴다. 결과당 한 건이며 다시 고르면 덮어쓴다. */
export default function CocktailFeedbackPanel({ oid }: { oid: number }) {
  const [saved, setSaved] = useState<CocktailFeedback | null>(null);
  const [picking, setPicking] = useState(false);
  const [reason, setReason] = useState<CocktailFeedback["reason"] | "">("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    cocktailApi.getFeedback(oid).then((f) => alive && setSaved(f)).catch(() => {});
    return () => { alive = false; };
  }, [oid]);

  const send = async (body: CocktailFeedback) => {
    setBusy(true);
    setError(null);
    try {
      setSaved(await cocktailApi.putFeedback(oid, body));
      setPicking(false);
    } catch (e) {
      setError(isLoginRequiredError(e) ? LOGIN_REQUIRED_MESSAGE : "의견을 저장하지 못했어요. 잠시 뒤에 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const btn = "min-h-11 px-3 rounded border border-[#4a3728]/40 text-xs font-bold text-stone-800 bg-white/30 disabled:opacity-50";
  return (
    <section aria-label="이 추천에 대한 의견" className="w-full max-w-md mt-6 px-2 text-stone-300 text-xs">
      {saved && !picking ? (
        <p role="status">
          {saved.sentiment === "LIKE" ? "마음에 든다고 남겼어요." : "문제가 있다고 남겼어요."}{" "}
          <button type="button" className="underline min-h-11" onClick={() => setPicking(true)}>다시 남기기</button>
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span>이 추천은 어땠나요?</span>
          <button type="button" className={btn} disabled={busy} onClick={() => send({ sentiment: "LIKE", reason: "NONE" })}>👍 좋아요</button>
          <button type="button" className={btn} disabled={busy} aria-expanded={picking} onClick={() => setPicking(true)}>👎 문제가 있어요</button>
        </div>
      )}
      {picking && (
        <fieldset className="mt-3 flex flex-col gap-2" disabled={busy}>
          <legend className="sr-only">문제 종류</legend>
          {REASONS.map((r) => (
            <label key={r.value} className="flex min-h-11 items-center gap-2">
              <input type="radio" name="cocktail-feedback-reason" checked={reason === r.value} onChange={() => setReason(r.value)} />
              {r.label}
            </label>
          ))}
          {reason === "OTHER" && (
            <textarea aria-label="자세한 내용" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full rounded bg-white/10 p-2 text-stone-100" rows={3} />
          )}
          <button type="button" className={btn + " self-start"} disabled={!reason || busy}
            onClick={() => send({ sentiment: "DISLIKE", reason: reason as CocktailFeedback["reason"], comment: reason === "OTHER" ? comment : null })}>
            의견 보내기
          </button>
        </fieldset>
      )}
      {error && <p role="alert" className="mt-2 text-red-300">{error}</p>}
      <p className="mt-3 text-stone-500">
        이 결과는 <Link href={`/cocktail/result/${oid}`} className="inline-flex min-h-11 items-center underline">/cocktail/result/{oid}</Link> 에서 다시 볼 수 있어요.
      </p>
    </section>
  );
}
