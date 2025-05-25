import { customSearchApi } from "@/api/google";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function AfterScreen(props: any) {
  const { setSwitchState, resultData, setResultData, setUserInput } = props;
  // 이미지 url
  const [image, setImage] = useState<string | null>(null);
  // 로딩 중인가?
  const [loading, setLoading] = useState<boolean>(false);
  // 이미지를 불러 왔는가?
  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);

  const searchWhiskey = async () => {
    setLoading(true);
    // setIsClicked(true);
    setIsImageLoad(false);

    try {
      const selectedWhiskey = resultData.cocktailName;
      const res = await customSearchApi(selectedWhiskey);
      setImage(res);
    } catch (err) {
      console.error("err : ", err);
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resultData?.cocktailName && resultData?.cocktailName != "") {
      searchWhiskey();
    }
  }, [resultData?.cocktailName]);

  useEffect(() => {
    console.log(resultData);
    return () => {};
  }, []);

  return (
    <div className="min-h-fit flex flex-col items-center justify-center my-12">
      <div className="w-[90%] max-w-[650px] mb-4">
        <button
          className="top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 
                   bg-black/30 text-white rounded-lg ring-1 ring-white/20 
                   shadow shadow-white/20 hover:bg-white/20 hover:ring-2 
                   hover:shadow-white/30 transition"
          onClick={() => setSwitchState(0)}
        >
          ← 뒤로가기
        </button>
      </div>
      <div className="bg-black/40 px-6 py-12 rounded-2xl shadow-lg text-white w-[90%] max-w-[650px] text-center">
        {loading ? (
          <div className="flex justify-center items-center w-[400px] h-[450px]">
            <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {!isImageLoad && image && (
              <div className="flex justify-center items-center w-[400px] h-[450px]">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <div className="relative w-[300px] h-[400px]">
              <Image
                src={image || "https://placehold.co/600x650"}
                alt="Whisky"
                fill={true}
                className={`rounded-lg transition-opacity duration-500 ${
                  isImageLoad ? "opacity-100" : "opacity-0"
                }`}
                unoptimized
                onLoad={() => setIsImageLoad(true)}
                style={{ objectFit: "cover" }}
              />
            </div>
            {isImageLoad && (
              <div className=" p-6 bg-black/40 rounded-lg text-white/70 w-[600px] space-y-4">
                <p className="text-lg font-bold text-white">추천 결과</p>

                <div>
                  <p className="font-semibold text-white">🍸 칵테일:</p>
                  <p>{resultData.cocktailName}</p>
                </div>

                <div>
                  <p className="font-semibold text-white">📌 준비물:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {resultData.checkList.map(
                      (value: string, index: number) => (
                        <li key={index}>{value}</li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white">🧪 제조 순서:</p>
                  <ul className="list-none space-y-1">
                    {resultData.method.map((value: string, index: number) => (
                      <li key={index}>
                        [{index + 1}단계] {value}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-white">🥨 추천 안주:</p>
                  <p>{resultData.foodName}</p>
                </div>

                <div>
                  <p className="font-semibold text-white">💡 추천 이유:</p>
                  <p>{resultData.pairingNote}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
