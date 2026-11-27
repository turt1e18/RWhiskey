import type { Metadata } from "next";
import { PaperPage } from "@/components/PaperPage";

export const metadata: Metadata = { title: "개인정보처리방침" };

// shortcut: 코드에서 확인한 실제 처리 기준의 초안이다. 운영 공개 전 법적 검토와 시행일·문의처 확정이 필요하다.
const H = "font-serif text-base font-bold mt-6 mb-2";
const P = "text-sm leading-relaxed";

export default function PrivacyPage() {
  return (
    <PaperPage title="개인정보처리방침" wide>
      <p className={P}>데일리 바텐더(R-Whiskey, 이하 &lsquo;서비스&rsquo;)는 이용자의 개인정보를 아래와 같이 처리합니다.</p>

      <h2 className={H}>1. 수집하는 항목과 목적</h2>
      <ul className={`${P} list-disc pl-5 space-y-1`}>
        <li><strong>회원가입(필수):</strong> 이메일 주소, 비밀번호(복원할 수 없는 형태로 암호화해 저장), 닉네임 — 본인 확인, 로그인, 계정 관리</li>
        <li><strong>서비스 이용 중 입력:</strong> 추천 요청 조건(기분, 취향, 메모 등), 시음 기록·노트, 좋아요·북마크·신고 — 추천과 기록 기능 제공</li>
        <li><strong>위스키 정보 알려주기:</strong> 알려준 항목과 내용, 출처 종류·출처 주소, 덧붙인 말, 추가 정보 요청에 대한 답변 — 위스키 정보 확인과 반영</li>
        <li><strong>자동 생성:</strong> 로그인 유지를 위한 세션 쿠키, 서버 접속 기록(호스팅 업체 기록 포함) — 보안과 장애 대응</li>
        <li><strong>자동 생성(일시):</strong> 접속 IP 주소 — 로그인·인증 코드 시도 횟수 제한. 15분~24시간 뒤 자동으로 지워집니다.</li>
      </ul>
      <p className={`${P} mt-2`}>가입 화면의 선택 동의 항목(연령대·성별 등)은 현재 수집하지 않습니다.</p>

      <h2 className={H}>2. 보유 기간과 파기</h2>
      <ul className={`${P} list-disc pl-5 space-y-1`}>
        <li>회원 탈퇴 시 이메일·닉네임·비밀번호를 즉시 식별할 수 없는 값으로 바꾸고, 공개했던 글과 노트는 다른 이용자에게 보이지 않게 하며, 확인 중인 정보 제보는 취소합니다.</li>
        <li>시음 기록·노트, 추천 요청과 결과, 피드백, 취향 정보, 좋아요·북마크·신고 등 이용 기록은 부정 이용 방지와 분쟁 대응을 위해 탈퇴일로부터 30일 동안 보관한 뒤 지웁니다. 이 기간에는 서비스에서 열람할 수 없습니다.</li>
        <li>위스키 정보 제보는 위스키 정보에 반영된 사실 값(도수 등)과 운영자 처리 이력을 남기고, 이용자가 쓴 내용·덧붙인 말·출처 주소·답변은 탈퇴 30일 뒤 함께 지웁니다.</li>
        <li>필수 동의 일시와 약관 버전은 동의 증빙을 위해 식별 정보를 지운 계정 기록과 함께 보관합니다.</li>
        <li>이메일 인증 코드는 5분, 인증 완료 표시는 30분 뒤 자동으로 지워집니다.</li>
        <li>관계 법령이 보존을 요구하는 기록은 그 기간 동안만 보관합니다.</li>
      </ul>

      <h2 className={H}>3. 처리 위탁과 국외 이전</h2>
      <p className={P}>서비스 운영을 위해 아래 업체에 처리를 맡깁니다. 업체 서버가 국외(주로 미국)에 있어 정보가 국외로 전송될 수 있습니다.</p>
      <ul className={`${P} list-disc pl-5 space-y-1 mt-2`}>
        <li><strong>Google (Gemini API):</strong> 추천 요청 조건 — AI 추천 생성. 이메일·닉네임은 보내지 않습니다.</li>
        <li><strong>Google (검색 API):</strong> 추천된 위스키·칵테일 이름 — 사진 검색</li>
        <li><strong>Resend:</strong> 이메일 주소 — 인증 코드 메일 발송</li>
        <li><strong>Vercel, Railway:</strong> 화면·서버·데이터베이스 호스팅</li>
        <li><strong>Slack:</strong> 서버 오류 알림(개인정보를 담지 않는 오류 번호만 전송)</li>
      </ul>

      <h2 className={H}>4. 이용자의 권리</h2>
      <p className={P}>이용자는 언제든 메인 화면의 &lsquo;회원 탈퇴&rsquo;에서 탈퇴해 개인정보 처리를 멈출 수 있습니다. 열람·정정·삭제 요청은 아래 문의처로 할 수 있습니다.</p>

      <h2 className={H}>5. 안전성 확보 조치</h2>
      <p className={P}>비밀번호 암호화 저장, 전송 구간 암호화(HTTPS), 로그인·인증 시도 횟수 제한, 비밀번호 변경 시 다른 기기 로그아웃을 적용합니다.</p>

      <h2 className={H}>6. 문의처와 시행일</h2>
      <p className={P}>개인정보 보호 책임자와 문의처, 시행일은 검토 후 확정해 이곳에 적습니다.</p>
    </PaperPage>
  );
}
