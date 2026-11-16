"use client";

import { useEffect, useState, Suspense } from "react";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { cocktailLoadingMessages } from "./_components/cocktailLoadingMessages";
import { CocktailRecommendationRequest } from "@/type/CocktailInterface";
import { takeCocktailDraft } from "@/lib/cocktailDraft";
import { recommendationErrorMessage } from "@/lib/userFacingError";
import { runRecommendation } from "./_components/runRecommendation";
import type { CocktailDataInterface } from "@/type/CocktailDataInterface";

const INITIAL_REQUEST: CocktailRecommendationRequest = {
  experienceLevel: 'beginner',
  isNonAlcoholic: false,
  preferredTaste: [],
  carbonation: null,
  dislikes: [],
  currentMood: "",
  baseSpirit: "상관없음",
  strength: "light"
};

export default function CocktailScreen() {
  const [screenState, setScreenState] = useState(0);
  const [request, setRequest] = useState<CocktailRecommendationRequest>(INITIAL_REQUEST);
  const [customBottle, setCustomBottle] = useState("");
  // 통합 데이터를 가져오는 Promise를 저장
  const [dataPromise, setDataPromise] = useState<Promise<CocktailDataInterface> | null>(null);
  // "다른 한 잔": 이미 보여 준 레시피 id와 진행 상태. 주문서로 돌아가면 비운다.
  const [shown, setShown] = useState<number[]>([]);
  const [another, setAnother] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  const requestAnother = async () => {
    if (!dataPromise || another.busy) return;
    setAnother({ busy: true, error: null });
    try {
      const current = await dataPromise;
      const ids = current.cocktailId != null ? [...new Set([...shown, current.cocktailId])] : shown;
      const next = await runRecommendation(request, customBottle, ids);
      setShown(ids);
      setDataPromise(Promise.resolve(next));
      setAnother({ busy: false, error: null });
    } catch (e) {
      setAnother({ busy: false, error: recommendationErrorMessage(e) });
    }
  };

  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return (
          <BeforeScreen
            request={request}
            setRequest={setRequest}
            customBottle={customBottle}
            setCustomBottle={setCustomBottle}
            setDataPromise={setDataPromise}
            setSwitchState={setScreenState}
          />
        );
      case 1:
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center my-12 px-4 h-[60vh]">
                <WhiskeyLoader messages={cocktailLoadingMessages} />
              </div>
            }
          >
            {dataPromise && another.busy && <WhiskeyLoader messages={cocktailLoadingMessages} />}
            {dataPromise && !another.busy && (
              <AfterScreen
                onEdit={() => { setShown([]); setAnother({ busy: false, error: null }); setScreenState(0); }}
                onAnother={requestAnother}
                anotherError={another.error}
                onReset={() => {
                  setRequest(INITIAL_REQUEST);
                  setCustomBottle("");
                  setDataPromise(null);
                  setShown([]);
                  setAnother({ busy: false, error: null });
                  setScreenState(0);
                }}
                dataPromise={dataPromise}
                experienceLevel={request.experienceLevel}
                dislikes={request.dislikes}
              />
            )}
          </Suspense>
        );
      default:
        break;
    }
  };

  // 로그인하러 다녀온 경우 맡겨 둔 주문서를 되돌린다.
  useEffect(() => {
    const draft = takeCocktailDraft();
    if (!draft) return;
    setRequest(draft.request);
    setCustomBottle(draft.customBottle);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a120d] py-8 overflow-x-hidden [scrollbar-gutter:stable]">
      {switchScreen()}
    </div>
  );
}
