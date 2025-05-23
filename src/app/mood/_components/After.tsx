/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { customSearchApi } from "@/api/google";
import { Whiskey } from "@/type/RandomInterface";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AfterScreen(props: any) {
  const { setSwitchState, resultData, setResultData, setUserInput } = props;

  // 기능을 클릭했는가?
  const [isClicked, setIsClicked] = useState<boolean>(false);
  // 이미지 url
  const [image, setImage] = useState<string | null>(null);
  // 로딩 중인가?
  const [loading, setLoading] = useState<boolean>(false);
  // 이미지를 불러 왔는가?
  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);
  // 랜덤으로 불러온 위스키 정보
  const [whiskey, setWhiskey] = useState<Whiskey | null>(null);

  const searchWhiskey = async () => {
    setLoading(true);
    setIsClicked(true);
    setIsImageLoad(false);

    try {
      // 데이터가 없으면 오류 처리
      if (resultData.whiskyName.length === 0) {
        throw new Error("No whiskey found in the selected price range.");
      }

      // 값이 온 사람
      const selectedWhiskey = resultData.whiskyName;
      setWhiskey(selectedWhiskey);
      console.log(selectedWhiskey); // 선택된 whiskey 출력
      const res = await customSearchApi(selectedWhiskey?.name);
      setImage(res);
    } catch (err) {
      console.error("err : ", err);
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchWhiskey();
    return () => {};
  }, [resultData.whiskyName]);

  return (
    <div className="bg-black/40 px-6 py-12 rounded-2xl shadow-lg text-white w-[90%] max-w-[650px] text-center">
      {loading ? (
        // 로딩 동글이
        <div className="flex justify-center items-center w-[600px] h-[650px]">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* 이미지 불러올 때 까지 동글이 유지 */}
          {!isImageLoad && image && (
            <div className="flex justify-center items-center w-[600px] h-[650px]">
              <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {/* 검색된 위스키 이미지 */}
          <div className="relative w-full aspect-[600/650] max-w-full mx-auto">
            <Image
              src={image || "https://placehold.co/600x650"}
              alt="Image is MIA"
              fill={true}
              unoptimized
              className={`rounded-lg mb-4 transition-opacity duration-500 ${
                isImageLoad ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setIsImageLoad(true)}
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="pt-5">
            {/* 랜덤으로 불러온 위스키 정보 */}
            <h2 className="text-xl font-bold">{resultData?.whiskyName}</h2>
            <p className="text-sm text-gray-400">{resultData?.foodName}</p>
            <p className="text-sm mt-2">{resultData?.pairingNote}</p>
          </div>
        </>
      )}
    </div>
  );
}
