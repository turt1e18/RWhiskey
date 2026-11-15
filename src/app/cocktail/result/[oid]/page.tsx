"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AfterScreen from "../../_components/After";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { cocktailApi } from "@/api/whiskeyApi";
import { isLoginRequiredError } from "@/lib/userFacingError";
import type { CocktailDataInterface } from "@/type/CocktailDataInterface";
import type { ExperienceLevel } from "@/type/CocktailInterface";

type Loaded = { data: CocktailDataInterface; level: ExperienceLevel; dislikes: string[] };

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
          images: d.images ?? [], checkList: d.checkList ?? [], method: d.method ?? [], imageCredit: d.imageCredit ?? null,
        },
        level: (d.experienceLevel as ExperienceLevel) ?? "beginner",
        dislikes: d.dislikes ?? [],
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
    <ResolvedResult loaded={loaded} onLeave={() => router.push("/cocktail")} />
  );
}

function ResolvedResult({ loaded, onLeave }: { loaded: Loaded; onLeave: () => void }) {
  // AfterScreen은 use(Promise)로 읽으므로 이미 채워진 약속을 한 번만 만들어 넘긴다.
  const [promise] = useState(() => Promise.resolve(loaded.data));
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a120d] flex items-center justify-center"><WhiskeyLoader /></div>}>
      <AfterScreen onEdit={onLeave} onReset={onLeave} dataPromise={promise} experienceLevel={loaded.level} dislikes={loaded.dislikes} />
    </Suspense>
  );
}
