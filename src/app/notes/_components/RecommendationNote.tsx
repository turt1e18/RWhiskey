"use client";

import { useEffect, useState } from "react";
import { whiskeyV3Api } from "@/api/whiskeyV3Api";
import { displayExpression } from "@/lib/recommendations/aiPresentation";
import { collectedBodyHidden } from "@/lib/recommendations/collectedCandidate";
import { useCollectedLease } from "@/lib/recommendations/useCollectedLease";
import { toAiSuggestion, type AiSuggestionCard } from "@/lib/recommendations/v3Contract";
import { whiskeyResultInformation } from "@/lib/recommendations/whiskeyResultInformation";

type State = { kind: "loading" } | { kind: "ready"; card: AiSuggestionCard } | { kind: "unavailable" };

/**
 * 사이트에서 추천받은 위스키의 추천 내용(기본 정보·바텐더 설명·곁들이면 좋은 것·마시는 방법)을 시음 기록 왼쪽 면에 보여 준다.
 * 이미 있는 추천 조회(GET /api/recommendations/v3/operations/{id})를 그대로 쓰고, 수집 출처 본문 노출 제한(만료·제한)을 따른다.
 */
export function RecommendationNote({ operationId, paper = false }: { operationId: string; paper?: boolean }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  useEffect(() => {
    let active = true;
    setState({ kind: "loading" });
    void whiskeyV3Api.byId(operationId)
      .then((response) => {
        const card = toAiSuggestion(response);
        if (active) setState(card ? { kind: "ready", card } : { kind: "unavailable" });
      })
      .catch(() => { if (active) setState({ kind: "unavailable" }); });
    return () => { active = false; };
  }, [operationId]);
  const leaseNow = useCollectedLease(state.kind === "ready" ? state.card.candidateOrigin : null);

  // 가죽(어두운 바탕)과 종이(밝은 바탕) 모두에서 4.5:1 이상이 되도록 본문은 거의 불투명하게 둔다.
  const tone = paper
    ? { rule: "border-[#3e2616]/25", head: "text-[#3e2616]/75", body: "text-[#3e2616]", dim: "text-[#3e2616]/75", box: "bg-[#3e2616]/[0.07]" }
    : { rule: "border-[#c9a14a]/30", head: "text-[#fdfbf7]/75", body: "text-[#fdfbf7]", dim: "text-[#fdfbf7]/75", box: "bg-black/25" };
  const hidden = state.kind === "ready" && collectedBodyHidden(state.card, leaseNow);
  const card = state.kind === "ready" && !hidden ? state.card : null;
  const facts = card ? whiskeyResultInformation(card, leaseNow).basic : [];
  const heading = `font-serif text-xs uppercase tracking-[0.25em] ${tone.head}`;

  return (
    <section aria-label="추천받은 내용" className={`mt-6 border-t pt-4 ${tone.rule}`}>
      <p className={heading}>Recommended</p>
      {state.kind === "loading" && <p role="status" className={`mt-2 text-sm ${tone.body}`}>추천 내용을 불러오는 중…</p>}
      {(state.kind === "unavailable" || hidden) && (
        <p className={`mt-2 text-sm leading-6 ${tone.body}`}>{hidden ? "이 추천의 설명은 지금 볼 수 없어요." : "추천 내용을 불러오지 못했어요."}</p>
      )}
      {card && (
        <div className={`mt-2 ${tone.body}`}>
          <p className="break-keep font-serif text-lg leading-snug">{card.identity.brand} {displayExpression(card.identity.expression)}</p>

          {facts.length > 0 && (
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.field} className="min-w-0">
                  <dt className={`text-xs ${tone.dim}`}>{fact.label}</dt>
                  <dd className="mt-0.5 break-words leading-6">{fact.value}{fact.kind === "AI" && <span className={`ml-1 text-xs ${tone.dim}`}>(참고)</span>}</dd>
                </div>
              ))}
            </dl>
          )}

          {card.presentation.summary.slice(0, 2).map((line, index) => (
            <p key={index} className="mt-3 text-[15px] leading-7">{line}</p>
          ))}

          {card.presentation.pairings.length > 0 && (
            <div className={`mt-4 rounded-sm p-3 ${tone.box}`}>
              <p className={heading}>곁들이면 좋아요</p>
              <ul className="mt-2 space-y-2">
                {card.presentation.pairings.slice(0, 3).map((pairing) => (
                  <li key={pairing.food} className="text-[15px] leading-7">
                    <span className="font-bold">{pairing.food}</span>
                    <span className={`block text-sm leading-6 ${tone.dim}`}>{pairing.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {card.servingSuggestion && (
            <div className={`mt-4 rounded-sm p-3 ${tone.box}`}>
              <p className={heading}>이렇게 마셔 보세요</p>
              <p className="mt-2 text-[15px] leading-7">{card.servingSuggestion}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
