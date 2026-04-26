"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/api/whiskeyApi";

interface PasswordResetFormProps {
  onBack: () => void;
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // 이메일 주소 수정 시 인증 상태 초기화
  useEffect(() => {
    if (isEmailVerified || isCodeSent) {
      setIsEmailVerified(false);
      setIsCodeSent(false);
      setVerificationCode("");
      setError("");
    }
  }, [email]);

  // 이메일 인증 코드 발송
  const handleSendCode = async () => {
    if (!email) {
      setError("연락처를 입력해주세요.");
      return;
    }
    setError("");
    setIsSendingCode(true);
    try {
      await authApi.sendVerificationCode(email);
      setIsCodeSent(true);
      alert("인증 코드가 발송되었습니다.");
    } catch (err: any) {
      setError(err.message || "코드 발송에 실패했습니다.");
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError("인증 코드를 입력해주세요.");
      return;
    }
    setError("");
    setIsVerifyingCode(true);
    try {
      const response = await authApi.verifyCode(email, verificationCode);
      if (response.success) {
        setIsEmailVerified(true);
        alert("이메일 인증이 완료되었습니다.");
      } else {
        setError(response.message || "인증 코드가 일치하지 않습니다.");
      }
    } catch (err: any) {
      setError(err.message || "인증 확인 중 오류가 발생했습니다.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authApi.resetPassword(email, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    isEmailVerified &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword;

  return (
    <div className="flex flex-col gap-8">
      {/* Header with back button */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="이전으로"
          className="flex-shrink-0 text-xl transition-colors duration-150 pt-0.5"
          style={{ color: "#3E2A1E" }}
        >
          ←
        </button>
        <div className="flex-1">
          <h1
            className="font-parisienne text-4xl font-bold tracking-tight mb-1"
            style={{ color: "#3E2A1E" }}
          >
            Amendment of Registry
          </h1>
          <h2
            className="text-sm font-bold tracking-[0.2em]"
            style={{ color: "#5C4A39" }}
          >
            비밀번호 재설정
          </h2>
        </div>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-7" onSubmit={handleReset}>
        {/* Email field + Send Code Button */}
        <div className="flex flex-col gap-2">
          <label htmlFor="reset-email" className="label-style">
            등록된 연락처
          </label>
          <div className="flex gap-2 items-end">
            <input
              id="reset-email"
              type="email"
              className="input-dotted flex-1"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || isEmailVerified}
              className="btn-stamp text-xs whitespace-nowrap disabled:opacity-50"
              style={{ color: "#3E2A1E", padding: "0.4rem 0.8rem" }}
            >
              {isCodeSent && !isEmailVerified ? "재발송" : "인증 요청"}
            </button>
          </div>
        </div>

        {/* Verification Code field + Verify Button */}
        {isCodeSent && !isEmailVerified && (
          <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label htmlFor="verification-code" className="label-style">
              인증 코드
            </label>
            <div className="flex gap-2 items-end">
              <input
                id="verification-code"
                type="text"
                className="input-dotted flex-1"
                placeholder="코드 6자리"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={isVerifyingCode}
                className="btn-stamp text-xs whitespace-nowrap disabled:opacity-50"
                style={{ color: "#3E2A1E", padding: "0.4rem 0.8rem" }}
              >
                {isVerifyingCode ? "확인 중" : "확인"}
              </button>
            </div>
          </div>
        )}

        {isEmailVerified && (
          <>
            <p className="text-green-700 text-xs font-bold -mb-2">
              ✓ 본인 인증이 완료되었습니다.
            </p>

            {/* New Password field */}
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="new-password" className="label-style">
                새 비밀번호
              </label>
              <input
                id="new-password"
                type="password"
                className="input-dotted"
                placeholder="최소 8자 이상"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm Password field */}
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="confirm-password" className="label-style">
                새 비밀번호 확인
              </label>
              <input
                id="confirm-password"
                type="password"
                className="input-dotted"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-xs text-center">{error}</p>}

        {success && (
          <p className="text-green-700 text-xs text-center font-bold">
            비밀번호가 성공적으로 재설정되었습니다. 잠시 후 이동합니다.
          </p>
        )}

        {/* Signature preview section */}
        <div
          className="flex flex-col gap-3 pt-4 border-t border-dashed"
          style={{ borderColor: "#BFAD98" }}
        >
          <p className="label-style">수정 사항 확인</p>
          <div className="flex justify-end pr-3">
            <span
              className="text-4xl font-kyobo"
              style={{ color: "#3E2A1E", opacity: isEmailVerified ? 1 : 0.4 }}
            >
              Approved
            </span>
          </div>
          <div className="w-full h-px" style={{ background: "#BFAD98" }} />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || success || !isFormValid}
          className="btn-stamp mt-2 font-semibold disabled:opacity-50"
          style={{ color: "#3E2A1E" }}
        >
          {isLoading ? "변경 중..." : "변경 사항 서명하기"}
        </button>
      </form>
    </div>
  );
}
