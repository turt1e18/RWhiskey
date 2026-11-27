"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ApiResponseError } from "@/api/apiClient";
import { userAccountApi } from "@/api/whiskeyApi";
import { PaperPage } from "@/components/PaperPage";
import { useAuthStore } from "@/store/authStore";

type Failure = { message: string; relogin?: boolean };

export default function WithdrawPage() {
  const { isAuthenticated, logout } = useAuthStore();
  const [pw, setPw] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw || !confirmed || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await userAccountApi.withdraw(pw);
      // 완료 화면을 먼저 세운 뒤 로그인 상태를 지운다(비로그인 안내로 깜빡이지 않게)
      setDone(true);
      await logout();
    } catch (err) {
      if (err instanceof ApiResponseError && err.status === 400) {
        setFailure({ message: "비밀번호가 올바르지 않아요. 다시 입력해 주세요." });
        setPw("");
        pwRef.current?.focus();
      } else if (err instanceof ApiResponseError && (err.status === 401 || err.status === 403)) {
        setFailure({ message: "로그인이 풀렸어요. 다시 로그인한 뒤 탈퇴해 주세요.", relogin: true });
      } else {
        setFailure({ message: "지금은 탈퇴를 처리할 수 없어요. 잠시 뒤에 다시 시도해 주세요." });
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <PaperPage title="탈퇴가 끝났어요">
        <p role="status" className="text-sm leading-relaxed">그동안 이용해 주셔서 고마워요. 계정 정보는 알아볼 수 없게 바꿨고 모든 기기에서 로그아웃됐어요. 이용 기록은 30일 뒤에 지워져요.</p>
        <Link href="/main" className="btn-stamp mt-6 inline-flex min-h-11 w-full items-center justify-center font-semibold">메인으로</Link>
      </PaperPage>
    );
  }

  return (
    <PaperPage title="회원 탈퇴">
      {!isAuthenticated ? (
        <div className="text-sm leading-relaxed">
          <p>탈퇴하려면 먼저 로그인해 주세요.</p>
          <Link href="/login" className="btn-stamp mt-4 inline-flex min-h-11 w-full items-center justify-center font-semibold">로그인</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="text-sm leading-relaxed space-y-2">
            <p>탈퇴하면 아래처럼 처리되고, <strong>되돌릴 수 없어요.</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>이메일·닉네임·비밀번호는 바로 알아볼 수 없게 바뀌어요. 이 계정으로는 다시 로그인할 수 없어요.</li>
              <li>라운지에 공개한 글과 노트는 바로 다른 사람에게 보이지 않아요.</li>
              <li>확인 중인 &lsquo;내가 알려준 정보&rsquo;는 취소돼요.</li>
              <li>시음 기록·노트·추천 기록 같은 이용 기록은 부정 이용과 분쟁 대응을 위해 <strong>30일 동안 보관한 뒤 지워요.</strong> 그동안에도 다시 열어 볼 수는 없어요.</li>
              <li>알려주신 정보 중 위스키 정보에 이미 반영된 값(도수 등)은 남고, 직접 쓰신 메모·출처는 30일 뒤 함께 지워요.</li>
              <li>모든 기기에서 로그아웃돼요.</li>
              <li>같은 이메일로 새로 가입할 수 있지만, 지금 기록은 이어지지 않아요.</li>
            </ul>
            <p className="text-xs">
              자세한 처리 기준은{" "}
              <Link href="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-2">개인정보처리방침</Link>
              에 있어요.
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="withdraw-pw" className="label-style">비밀번호 확인</label>
            <input id="withdraw-pw" ref={pwRef} type="password" className="input-dotted" autoComplete="current-password"
              value={pw} onChange={(e) => setPw(e.target.value)} required
              aria-invalid={failure && !failure.relogin ? true : undefined} aria-describedby={failure ? "withdraw-error" : undefined} />
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm cursor-pointer">
            <input type="checkbox" className="w-5 h-5 shrink-0 accent-[#3E2A1E]" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            위 내용을 확인했고 탈퇴에 동의해요.
          </label>
          {failure && (
            <div id="withdraw-error" role="alert" className="text-red-700 text-sm text-center">
              <p>{failure.message}</p>
              {failure.relogin && <Link href="/login" className="inline-flex min-h-11 items-center font-bold underline underline-offset-2">로그인하러 가기</Link>}
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button type="submit" disabled={!pw || !confirmed || busy} aria-describedby="withdraw-hint"
              className="btn-stamp inline-flex min-h-11 items-center justify-center font-semibold disabled:opacity-50" style={{ color: "#8B1E1E" }}>
              {busy ? "처리 중…" : "탈퇴하기"}
            </button>
            {(!pw || !confirmed) && <p id="withdraw-hint" className="text-center text-xs">비밀번호를 입력하고 동의에 체크하면 누를 수 있어요.</p>}
          </div>
          <Link href="/main" className="inline-flex min-h-11 items-center justify-center text-sm underline underline-offset-2">탈퇴하지 않고 돌아가기</Link>
        </form>
      )}
    </PaperPage>
  );
}
