import WhiskeyLoader from "@/components/WhiskeyLoader";

export default function Loading() {
  // 전체 화면 중앙 정렬을 위한 래퍼 컨테이너
  return (
    <div className="flex h-screen w-full items-center justify-center bg-transparent">
      <WhiskeyLoader />
    </div>
  );
}
