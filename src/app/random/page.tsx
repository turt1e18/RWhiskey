"use client";
import { randomTestImage } from "@/api/unsplash";
import { Whiskey } from "@/type/RandomInterface";
import { useState } from "react";

export default function MainScreen() {
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

  /**
   * 이미지 검색 후 이미지 url 불러오기
   */
  const searchWhiskey = async () => {
    setLoading(true);
    setIsClicked(true);
    setIsImageLoad(false);

    try {
      const randomData = await fetch("/whiskey_data.json");
      const allWhiskeys: Whiskey[] = await randomData.json();

      const filteredWhiskeys = allWhiskeys.filter(
        (item) =>
          typeof item.price === "number" &&
          !isNaN(item.price) &&
          item.price <= 100 &&
          item.price !== 0
      );

      // 데이터가 없으면 오류 처리
      if (filteredWhiskeys.length === 0) {
        throw new Error("No whiskey found in the selected price range.");
      }

      // 0 가격인 경우 "Unknown price"로 설정
      filteredWhiskeys.forEach((item) => {
        if (item.price === 0) {
          item.price = "Unknown price";
        }
      });

      // 랜덤으로 하나 선택
      const randomIndex = Math.floor(Math.random() * filteredWhiskeys.length);
      const selectedWhiskey = filteredWhiskeys[randomIndex];
      setWhiskey(selectedWhiskey);
      console.log(selectedWhiskey); // 선택된 whiskey 출력

      const res = await randomTestImage(whiskey?.name);
      setImage(res);
    } catch (err) {
      console.error("err : ", err);
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#000000]/60">
      {/* 상단 영역 */}
      <div className="flex flex-col justify-center items-center h-1/6">
        {/* 상단 아이콘 */}
        <div className="flex gap-4 mb-4">
          {["🏠", "🎲", "🌧️", "❤️"].map((icon, index) => {
            return (
              <button
                key={index}
                className="p-4 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                        hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                        transition duration-200 ease-in-out"
              >
                {icon}
              </button>
            );
          })}
        </div>

        {/* 랜덤 위스키 버튼 */}
        <button
          className="px-9 py-3 bg-black/20 text-white rounded-xl ring-1 ring-white/20 shadow-lg shadow-white/20 
                        hover:ring-4 hover:bg-white/20 hover:ring-white/30 hover:shadow-white/30 
                        transition duration-200 ease-in-out"
          onClick={() => {
            searchWhiskey();
          }}
        >
          Get Random Whiskey
        </button>
      </div>

      {/* 하단 영역 */}
      <div
        className={`${isClicked ? "flex" : "hidden"} justify-center items-start h-5/6 transition-all duration-300 `}
      >
        {/* 위스키 정보 영역 */}
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
              <img
                src={image || "https://placehold.co/600x650"}
                alt="Image is MIA"
                className={`w-[600px] h-[650px] object-cover rounded-lg mb-4 transition-opacity duration-500 ${
                  isImageLoad ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setIsImageLoad(true)} // 이미지 로드 완료 시 상태 변경
              />

              {/* 랜덤으로 불러온 위스키 정보 */}
              <h2 className="text-xl font-bold">{whiskey?.name}</h2>
              <p className="text-sm text-gray-400">
                {whiskey?.category} &nbsp;&nbsp; {whiskey?.currency}
                {whiskey?.price} &nbsp;&nbsp; {whiskey?.rating}/100
              </p>
              <p className="text-sm mt-2">{whiskey?.description}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
