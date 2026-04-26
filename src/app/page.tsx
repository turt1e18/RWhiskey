import { redirect } from "next/navigation";

export default function RootPage() {
  // 실제 메인 서비스 페이지인 /main으로 리다이렉트
  redirect("/main");
}
