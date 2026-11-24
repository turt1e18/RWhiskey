import type { Metadata } from "next";
import { PaperPage } from "@/components/PaperPage";

export const metadata: Metadata = { title: "이용약관" };

// shortcut: 서비스 실제 기능 기준의 초안이다. 운영 공개 전 법적 검토와 시행일 확정이 필요하다.
const H = "font-serif text-base font-bold mt-6 mb-2";
const P = "text-sm leading-relaxed";

export default function TermsPage() {
  return (
    <PaperPage title="이용약관" wide>
      <h2 className={H}>1. 서비스 내용</h2>
      <p className={P}>데일리 바텐더는 이용자가 고른 조건으로 위스키·칵테일을 추천하고, 시음 기록을 남기고 라운지에서 나눌 수 있게 하는 서비스입니다.</p>

      <h2 className={H}>2. 성인 이용과 음주</h2>
      <p className={P}>주류 정보를 다루므로 법정 음주 가능 연령 이상만 이용할 수 있습니다. 과음은 건강을 해칩니다. 운전 전이나 임신 중에는 마시지 마세요.</p>

      <h2 className={H}>3. AI 추천의 한계</h2>
      <p className={P}>추천과 설명 일부는 AI가 만든 것으로 틀리거나 실제 제품과 다를 수 있습니다. 가격·재고·도수·알레르기 성분은 구매나 음용 전에 직접 확인해 주세요.</p>

      <h2 className={H}>4. 계정</h2>
      <p className={P}>계정은 본인만 사용해야 하며 비밀번호 관리 책임은 이용자에게 있습니다. 추천은 하루 이용 횟수가 정해져 있습니다. 이용자는 언제든 탈퇴할 수 있습니다.</p>

      <h2 className={H}>5. 이용자가 올린 글</h2>
      <p className={P}>라운지에 공개한 글은 다른 이용자에게 작성자 이름 없이 보입니다. 타인의 권리를 침해하거나 법령에 어긋나는 글은 신고에 따라 숨기거나 지울 수 있습니다.</p>

      <h2 className={H}>6. 서비스 변경과 중단</h2>
      <p className={P}>서비스 내용은 바뀌거나 중단될 수 있으며, 중요한 변경은 서비스 화면으로 미리 알립니다.</p>

      <h2 className={H}>7. 시행일</h2>
      <p className={P}>시행일은 검토 후 확정해 이곳에 적습니다.</p>
    </PaperPage>
  );
}
