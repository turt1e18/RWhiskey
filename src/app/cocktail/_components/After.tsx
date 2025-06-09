import { useEffect, useState } from "react";
import Image from "next/image";

export default function AfterScreen(props: any) {
  const { setSwitchState, resultData } = props;
  // 이미지 url
  const [image, setImage] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  // 로딩 중인가?
  const [loading, setLoading] = useState<boolean>(false);
  // 이미지를 불러 왔는가?
  const [isImageLoad, setIsImageLoad] = useState<boolean>(false);

  const searchCocktail = async () => {
    setLoading(true);
    setIsImageLoad(false);

    try {
      const selectedWhiskey = resultData.cocktailName;
      const res = await fetch("/api/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ data: selectedWhiskey, type: 1 })
      });
      const jsonData = await res.json();
      if (jsonData && jsonData.length > 0) {
        setImage(jsonData);
        setImageIndex(0);
      } else {
        setIsImageLoad(true); // 이미지가 하나도 없을 때 바로 종료
      }
    } catch (err) {
      console.error("err : ", err);
      setIsImageLoad(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resultData?.cocktailName && resultData?.cocktailName != "") {
      searchCocktail();
    }
  }, [resultData?.cocktailName]);

  useEffect(() => {
    if (image.length === 0) return;

    const timer = setTimeout(() => {
      if (!isImageLoad) {
        // 아직 이미지 로드 안됐으면 다음 이미지로 교체
        if (imageIndex < image.length - 1) {
          setImageIndex((prev) => prev + 1);
        } else {
          // 마지막 이미지까지 다 돌았으면 로딩 중단
          setIsImageLoad(true);
        }
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [imageIndex, isImageLoad, image]);

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
          {loading || !isImageLoad ? (
            <div className="w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Image
              src={image[imageIndex] || "https://placehold.co/600x650"}
              alt="MIA Image"
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
              {resultData.checkList.map((value: string, index: number) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold">🧪 제조 순서</p>
            <ol className="list-decimal list-inside space-y-1">
              {resultData.method.map((value: string, index: number) => (
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
