import { gemini } from "@/api/google";

export default function BeforeScreen(props: any) {
  const { userInput, setUserInput, setResultData, setSwitchState } = props;

  const recommendation = {
    cocktailName: "진토닉",
    checkList: [
      "드라이 진 1.5oz (약 45ml)",
      "토닉 워터 4oz (약 120ml)",
      "레몬 또는 라임 웨지 1개 (장식용)",
      "얼음"
    ],
    method: [
      "하이볼 잔에 얼음을 가득 채웁니다.",
      "진을 잔에 따릅니다.",
      "토닉 워터를 부드럽게 붓고 가볍게 저어줍니다.",
      "레몬 또는 라임 웨지로 장식합니다."
    ],
    foodName: "치즈 스틱 또는 간단한 견과류",
    pairingNote:
      "나른하고 피곤한 날, 시원하고 상큼한 진토닉은 기분 전환에 최고입니다. 최소한의 재료로 쉽게 만들 수 있어 자취생에게 안성맞춤이며, 치즈 스틱이나 견과류처럼 가볍고 바삭한 안주와 곁들이면 더욱 좋습니다. 진토닉의 깔끔한 맛이 안주의 기름진 맛을 잡아주어 조화롭습니다."
  };

  async function callGemini(data: string) {
    await gemini(data, 1)
      .then((res) => {
        if (res != undefined) {
          setResultData(res);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setSwitchState(1);
      });
  }

  return (
    <div className="flex flex-col justify-center items-center w-screen h-5/6 mt-1">
      <div className="flex flex-col gap-6 text-white w-[600px]">
        <p className="text-lg font-bold">칵테일 추천 예시</p>
        <p className="text-sm text-gray-400 bg-black/40 p-4 rounded-lg">
          "오늘은 조금 나른하고 피곤한데 심지어 날씨는 흐려."
        </p>
        <div className=" p-6 bg-black/40 rounded-lg text-white/70 w-[600px] space-y-4">
          <p className="text-lg font-bold text-white">추천 결과</p>

          <div>
            <p className="font-semibold text-white">🍸 칵테일:</p>
            <p>{recommendation.cocktailName}</p>
          </div>

          <div>
            <p className="font-semibold text-white">📌 준비물:</p>
            <ul className="list-disc list-inside space-y-1">
              {recommendation.checkList.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">🧪 제조 순서:</p>
            <ul className="list-none space-y-1">
              {recommendation.method.map((value, index) => (
                <li key={index}>
                  [{index + 1}단계] {value}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white">🥨 추천 안주:</p>
            <p>{recommendation.foodName}</p>
          </div>

          <div>
            <p className="font-semibold text-white">💡 추천 이유:</p>
            <p>{recommendation.pairingNote}</p>
          </div>
        </div>
        <textarea
          className=" p-4 bg-black/30 rounded-lg text-white/70 w-full h-[200px] resize-none"
          placeholder="오늘의 날씨, 기분, 시간대를 자유롭게 입력하세요..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
      </div>

      <button
        className="mt-8 p-3 bg-[#000000]/60 text-white rounded-lg hover:bg-blue-500 transition-colors"
        onClick={() => {
          if (userInput.length != 0) {
            callGemini(userInput);
          } else {
            alert("내용을 입력해주세요.");
          }
        }}
      >
        칵테일 추천 받으러 가기
      </button>
    </div>
  );
}
