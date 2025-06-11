import { MainRouter } from "@/type/MainInterface";
import { useRouter } from "next/navigation";

export default function MainRouterButton(props: MainRouter) {
  const router = useRouter();

  function routePage(route: number) {
    if (route === 0) router.push("/random");
    else if (route === 1) router.push("/mood");
    else router.push("/cocktail");
  }

  return (
    <div
      className={
        "max-w-[440px] w-full border border-white text-white inline-flex items-center bg-[#000000]/40 hover:bg-[#000000]/65 focus:outline-none rounded-lg justify-center text-center cursor-pointer " +
        // 모바일(기본): py-3, text-sm(14px)
        "py-3 text-sm " +
        // PC(md 이상): 기존 스타일인 py-3.5, text-base(16px)
        "md:py-3.5 md:text-base font-medium"
      }
      onClick={() => {
        routePage(props.route);
      }}
    >
      {props.text}
    </div>
  );
}
