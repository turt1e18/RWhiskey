"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import BeforeScreen from "./_components/Before";
import AfterScreen from "./_components/After";
import WhiskeyLoader from "@/components/WhiskeyLoader";
import { CocktailRecommendationRequest } from "@/type/CocktailInterface";

export default function CocktailScreen() {
  const [screenState, setScreenState] = useState(0);
  
  // 새로운 인터페이스를 따르는 초기 상태 설정
  const [request, setRequest] = useState<CocktailRecommendationRequest>({
    experienceLevel: 'beginner',
    isNonAlcoholic: false,
    preferredTaste: [],
    carbonation: false,
    dislikes: [],
    currentMood: "",
    baseSpirit: "상관없음"
  });

  const [imRich, setImRich] = useState(false);
  // 통합 데이터를 가져오는 Promise를 저장
  const [dataPromise, setDataPromise] = useState<Promise<any> | null>(null);

  const router = useRouter();

  const switchScreen = () => {
    switch (screenState) {
      case 0:
        return (
          <BeforeScreen
            request={request}
            setRequest={setRequest}
            imRich={imRich}
            setImRich={setImRich}
            setDataPromise={setDataPromise}
            setSwitchState={setScreenState}
          />
        );
      case 1:
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center my-12 px-4 h-[60vh]">
                <WhiskeyLoader />
              </div>
            }
          >
            {dataPromise && (
              <AfterScreen
                setSwitchState={setScreenState}
                dataPromise={dataPromise}
                experienceLevel={request.experienceLevel}
              />
            )}
          </Suspense>
        );
      default:
        break;
    }
  };

  // 뒤로가기 리셋 이벤트
  useEffect(() => {
    if (screenState === 0 && dataPromise !== null) {
      setRequest({
        experienceLevel: 'beginner',
        isNonAlcoholic: false,
        preferredTaste: [],
        carbonation: false,
        dislikes: [],
        currentMood: "",
        baseSpirit: "상관없음"
      });
      setDataPromise(null);
    }
  }, [screenState, dataPromise]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a120d] py-8 overflow-x-hidden [scrollbar-gutter:stable]">
      {switchScreen()}
    </div>
  );
}
