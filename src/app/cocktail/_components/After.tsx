"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { CocktailDataInterface } from "@/type/CocktailDataInterface"; // Import the shared interface

// Use the imported interface
// Define the props interface for AfterScreen
interface AfterScreenProps {
  setSwitchState: (state: number) => void;
  dataPromise: Promise<CocktailDataInterface>; // Use the shared type
}

export default function AfterScreen(props: AfterScreenProps) {
  const { setSwitchState, dataPromise } = props;

  // 전달받은 Promise가 resolve될 때까지 Suspense 트리거
  const resultData = use(dataPromise);

  const images = resultData.images || [];
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);

  useEffect(() => {
    if (images.length === 0) return;

    const timer = setTimeout(() => {
      if (!isImageLoad) {
        if (imageIndex < images.length - 1) {
          setImageIndex((prev) => prev + 1);
        } else {
          setIsImageLoad(true);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [imageIndex, isImageLoad, images]);

  return (
    <div className="flex flex-col items-center justify-center my-12 px-4">
      <div className="w-full max-w-[800px] mb-4">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-black/30 text-white rounded-lg ring-1 ring-white/20 
                 shadow hover:bg-white/20 hover:ring-2 transition"
          onClick={() => setSwitchState(0)}
        >
          ← 뒤로가기
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 bg-black/40 p-6 rounded-2xl shadow-lg text-white w-full max-w-[800px]">
        {/* 이미지 섹션 */}
        <div className="relative w-full md:w-1/2 h-[400px] flex justify-center items-center">
          {images.length === 0 ? (
            <div className="text-gray-400">이미지를 찾을 수 없습니다.</div>
          ) : (
            <Image
              src={images[imageIndex] || "https://placehold.co/600x650"}
              alt="Cocktail Image"
              fill
              className={`rounded-lg transition-opacity duration-500 ${isImageLoad ? "opacity-100" : "opacity-0"}`}
              unoptimized
              onLoad={() => setIsImageLoad(true)}
              style={{ objectFit: "cover" }}
            />
          )}
        </div>

        {/* 정보 섹션 */}
        <div className="flex flex-col w-full md:w-1/2 text-white/90 space-y-4">
          <h2 className="text-xl font-bold text-white text-center md:text-left">
            🍸 {resultData.cocktailName}
          </h2>

          <div>
            <p className="font-semibold">📌 준비물</p>
            <ul className="list-disc list-inside space-y-1">
              {resultData.checkList?.map((value: string, index: number) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold">🧪 제조 순서</p>
            <ol className="list-decimal list-inside space-y-1">
              {resultData.method?.map((value: string, index: number) => (
                <li key={index}>{value}</li>
              ))}
            </ol>
          </div>

          <div>
            <p className="font-semibold">🥨 추천 안주</p>
            <p>{resultData.foodName}</p>
          </div>

          <div>
            <p className="font-semibold">💡 추천 이유</p>
            <p>{resultData.pairingNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
