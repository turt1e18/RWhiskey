"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AfterScreen from "../../_components/After";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { cocktailApi } from "@/api/whiskeyApi";
import { isLoginRequiredError } from "@/lib/userFacingError";
import { saveCocktailDraft } from "@/lib/cocktailDraft";
import type { CocktailDataInterface } from "@/type/CocktailDataInterface";
import type { CocktailRecommendationRequest, ExperienceLevel } from "@/type/CocktailInterface";

type Loaded = { data: CocktailDataInterface; level: ExperienceLevel; dislikes: string[]; draft: { request: CocktailRecommendationRequest; customBottle: string } };

/** 저장된 결과를 주소로 다시 연다(본인 결과만). */
export default function CocktailResultPage({ params }: { params: Promise<{ oid: string }> }) {
  const { oid: raw } = use(params);
  const oid = Number(raw);
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<"login" | "missing" | "retry" | null>(Number.isInteger(oid) && oid > 0 ? null : "missing");

  useEffect(() => {
    if (!Number.isInteger(oid) || oid <= 0) return;
    let alive = true;
    cocktailApi.getDetail(oid).then((d) => {
      if (!alive) return;
      setLoaded({
        data: {
          oid, cocktailName: d.cocktailName, baseSpirit: d.responseBaseSpirit, abv: d.abv, foodName: d.foodName,
          pairingNote: d.pairingNote, bartenderWord: d.bartenderWord ?? undefined,
          orderDate: d.orderDate, images: d.images ?? [], checkList: d.checkList ?? [], method: d.method ?? [], imageCredit: d.imageCredit ?? null,
        },
        level: (d.experienceLevel as ExperienceLevel) ?? "beginner",
        dislikes: d.dislikes ?? [],
        draft: toDraft(d),
      });
    }).catch((e) => {
      if (!alive) return;
      const status = (e as { status?: number }).status;
      setFailure(isLoginRequiredError(e) ? "login" : status === 400 || status === 404 ? "missing" : "retry");
    });
    return () => { alive = false; };
  }, [oid]);

  if (failure) {
    const text = failure === "login" ? "로그인하면 이 결과를 볼 수 있어요."
      : failure === "missing" ? "찾을 수 없는 추천 결과예요. 내 결과가 아니거나 삭제됐을 수 있어요."
      : "결과를 불러오지 못했어요. 잠시 뒤에 다시 시도해 주세요.";
    return (
      <div className="min-h-screen bg-[#1a120d] flex flex-col items-center justify-center gap-4 px-6 text-stone-200 text-sm">
        <p role="alert">{text}</p>
        {failure === "login" && <Link href="/login" className="min-h-11 flex items-center underline">로그인하기</Link>}
        {failure === "retry" && <button type="button" className="min-h-11 underline" onClick={() => location.reload()}>다시 시도</button>}
        <Link href="/cocktail" className="min-h-11 flex items-center underline">새 칵테일 추천받기</Link>
      </div>
    );
  }
  if (!loaded) {
    return <div className="min-h-screen bg-[#1a120d] flex items-center justify-center"><WhiskeyLoader /></div>;
  }
  return (
    <ResolvedResult
      loaded={loaded}
      onEdit={() => { saveCocktailDraft(loaded.draft); router.push("/cocktail"); }}
      onReset={() => router.push("/cocktail")}
    />
  );
}

/** 저장된 요청 조건을 주문서 입력으로 되돌린다. 알 수 없는 값은 기본값으로 둔다. */
function toDraft(d: Awaited<ReturnType<typeof cocktailApi.getDetail>>) {
  const level: ExperienceLevel = d.experienceLevel === "experienced" || d.experienceLevel === "home_bar" ? d.experienceLevel : "beginner";
  const custom = /^기타\((.*)\)$/.exec(d.requestBaseSpirit ?? "");
  return {
    request: {
      experienceLevel: level,
      isNonAlcoholic: !!d.isNonAlcoholic,
      preferredTaste: d.preferredTaste ?? [],
      carbonation: d.carbonation ?? null,
      dislikes: d.dislikes ?? [],
      currentMood: d.currentMood ?? "",
      baseSpirit: custom ? "기타(바틀지정)" : d.requestBaseSpirit || "상관없음",
    },
    customBottle: custom?.[1] ?? "",
  };
}

function ResolvedResult({ loaded, onEdit, onReset }: { loaded: Loaded; onEdit: () => void; onReset: () => void }) {
  // AfterScreen은 use(Promise)로 읽으므로 이미 채워진 약속을 한 번만 만들어 넘긴다.
  const [promise] = useState(() => Promise.resolve(loaded.data));
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a120d] flex items-center justify-center"><WhiskeyLoader /></div>}>
      <AfterScreen onEdit={onEdit} onReset={onReset} dataPromise={promise} experienceLevel={loaded.level} dislikes={loaded.dislikes} />
    </Suspense>
  );
}
