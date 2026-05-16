"use client"

import { useState } from "react"
import { authApi } from "@/api/whiskeyApi"

interface SignupFormProps {
  onBack: () => void
}

export default function SignupForm({ onBack }: SignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // 이메일 인증 코드 발송
  const handleSendCode = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.")
      return
    }
    setError("")
    setIsSendingCode(true)
    try {
      await authApi.sendVerificationCode(email)
      setIsCodeSent(true)
      alert("인증 코드가 발송되었습니다.")
    } catch (err: any) {
      setError(err.message || "코드 발송에 실패했습니다.")
    } finally {
      setIsSendingCode(false)
    }
  }

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError("인증 코드를 입력해주세요.")
      return
    }
    setError("")
    setIsVerifyingCode(true)
    try {
      const response = await authApi.verifyCode(email, verificationCode)
      if (response.success) {
        setIsEmailVerified(true)
        alert("이메일 인증이 완료되었습니다.")
      } else {
        setError(response.message || "인증 코드가 일치하지 않습니다.")
      }
    } catch (err: any) {
      setError(err.message || "인증 확인 중 오류가 발생했습니다.")
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEmailVerified) {
      setError("이메일 인증을 먼저 완료해주세요.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      await authApi.signup({ name, email, pw: password })
      setSuccess(true)
      setTimeout(() => {
        onBack()
      }, 2000)
    } catch (err: any) {
      setError(err.message || "명부 등록 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

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
          <h2 className="text-3xl font-bold tracking-widest" style={{ color: "#3E2A1E", letterSpacing: "0.05em" }}>
            회원 등록
          </h2>
        </div>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-7" onSubmit={handleSignup}>
        {/* Name field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-name" className="label-style">
            성함
          </label>
          <input
            id="signup-name"
            type="text"
            className="input-dotted"
            placeholder="명부에 적을 성함"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>

        {/* Email field + Send Code Button */}
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-email" className="label-style">
            연락처
          </label>
          <div className="flex gap-2 items-end">
            <input
              id="signup-email"
              type="email"
              className="input-dotted flex-1"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isEmailVerified}
              required
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSendingCode || isEmailVerified}
              className="btn-stamp text-xs whitespace-nowrap disabled:opacity-50"
              style={{ color: "#3E2A1E", padding: "0.4rem 0.8rem" }}
            >
              {isCodeSent ? "재발송" : "인증 요청"}
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
          <p className="text-green-700 text-xs font-bold">✓ 이메일 인증이 완료되었습니다.</p>
        )}

        {/* Password field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="signup-password" className="label-style">
            비밀번호
          </label>
          <input
            id="signup-password"
            type="password"
            className="input-dotted"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-xs text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-700 text-xs text-center font-bold">
            회원 명단에 등록되었습니다. 잠시 후 이동합니다.
          </p>
        )}

        {/* Signature preview section */}
        <div className="flex flex-col gap-3 pt-4 border-t border-dashed" style={{ borderColor: "#BFAD98" }}>
          <p className="label-style">서명 미리보기</p>
          <div className="flex justify-end pr-3">
            <span
              className="text-4xl font-kyobo"
              style={{ color: "#3E2A1E", opacity: name ? 1 : 0.4 }}
            >
              {name || "Signature"}
            </span>
          </div>
          <div className="w-full h-px" style={{ background: "#BFAD98" }} />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || success || !isEmailVerified}
          className="btn-stamp mt-2 font-semibold disabled:opacity-50"
          style={{ color: "#3E2A1E" }}
        >
          {isLoading ? "등록 중..." : "회원 명단에 등록하기"}
        </button>
      </form>
    </div>
  )
}
