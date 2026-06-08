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
  
  const [isAgreedRequired, setIsAgreedRequired] = useState(false)
  const [isAgreedOptional, setIsAgreedOptional] = useState(false)
  const [isAllAgreed, setIsAllAgreed] = useState(false)
  
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

  // 전체 동의 핸들러
  const handleAllAgree = (checked: boolean) => {
    setIsAllAgreed(checked)
    setIsAgreedRequired(checked)
    setIsAgreedOptional(checked)
  }

  // 개별 동의 핸들러
  const handleRequiredAgree = (checked: boolean) => {
    setIsAgreedRequired(checked)
    if (!checked) setIsAllAgreed(false)
    if (checked && isAgreedOptional) setIsAllAgreed(true)
  }

  const handleOptionalAgree = (checked: boolean) => {
    setIsAgreedOptional(checked)
    if (!checked) setIsAllAgreed(false)
    if (checked && isAgreedRequired) setIsAllAgreed(true)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEmailVerified) {
      setError("이메일 인증을 먼저 완료해주세요.")
      return
    }

    if (!isAgreedRequired) {
      setError("필수 약관에 동의해주세요.")
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

      {/* Beta Notice Section */}
      <div className="bg-stone-100/80 border border-stone-200 p-4 rounded flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-700">⚠️</span>
          <p className="text-xs font-bold text-stone-800">베타 테스트 안내 사항</p>
        </div>
        <ul className="flex flex-col gap-1.5">
          <li className="text-[11px] text-stone-600 leading-relaxed flex gap-1.5">
            <span className="flex-shrink-0">•</span>
            <span>베타 테스트 중이라서 비밀번호의 양식이 간단하게 8자리 이상입니다.</span>
          </li>
          <li className="text-[11px] text-stone-600 leading-relaxed flex gap-1.5">
            <span className="flex-shrink-0">•</span>
            <span>베타 테스트 시 업데이트 마다 회원가입 정보를 초기화 할 가능성이 존재합니다. 초기화 시 테스터 분들에게 미리 알려드립니다. 감사합니다.</span>
          </li>
        </ul>
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
          <p className="text-[10px] text-stone-500 mt-1 pl-1">8자리 이상 등록해 주세요</p>
        </div>

        {/* Privacy Policy Agreements */}
        <div className="flex flex-col gap-4 py-4 border-t border-dashed" style={{ borderColor: "#BFAD98" }}>
          <p className="label-style">개인정보 이용약관</p>
          
          {/* Required Agreement */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                id="agree-required"
                type="checkbox"
                className="w-4 h-4 accent-[#3E2A1E] cursor-pointer"
                checked={isAgreedRequired}
                onChange={(e) => handleRequiredAgree(e.target.checked)}
              />
              <label htmlFor="agree-required" className="text-xs font-bold cursor-pointer" style={{ color: "#3E2A1E" }}>
                [필수] 개인정보 수집 및 이용 동의
              </label>
            </div>
            <div className="h-24 overflow-y-auto p-2 text-[11px] bg-stone-100/50 border border-stone-200 rounded leading-relaxed text-stone-600 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              RWhiskey은(는) 정보통신망 이용촉진 및 정보보호 등에 관한 법률 및 개인정보보호법에 따라 원활한 서비스 제공을 위해 아래와 같이 최소한의 개인정보를 수집 및 이용합니다.
              <br /><br />
              1. 수집 및 이용 목적<br />
              - 회원제 서비스 제공에 따른 본인 식별 및 가입 의사 확인<br />
              - 라운지(커뮤니티) 이용, 테이스팅 노트 작성, 북마크 등 기본 서비스 제공<br />
              - 불량 회원의 부정 이용 방지 및 민원 처리<br /><br />
              2. 수집하는 개인정보 항목<br />
              - 필수 항목: 이메일 주소, 비밀번호, 닉네임<br />
              - 자동 수집 항목: IP 주소, 쿠키(Cookie), 서비스 이용 기록, 접속 로그<br /><br />
              3. 개인정보의 보유 및 이용 기간<br />
              원칙적으로 개인정보의 수집 및 이용 목적이 달성된 후(회원 탈퇴 시)에는 해당 정보를 지체 없이 파기합니다. 단, 관계 법령에 의해 보존할 필요가 있는 경우 아래의 기간 동안 보관합니다.<br />
              - 웹사이트 접속 기록 (통신비밀보호법): 3개월<br />
              - 소비자의 불만 또는 분쟁 처리에 관한 기록 (전자상거래법): 3년<br /><br />
              4. 동의를 거부할 권리 및 불이익<br />
              이용자는 본 필수 동의를 거부할 권리가 있으나, 거부 시 회원가입 및 서비스 이용이 제한됩니다.
            </div>
          </div>

          {/* Optional Agreement */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                id="agree-optional"
                type="checkbox"
                className="w-4 h-4 accent-[#3E2A1E] cursor-pointer"
                checked={isAgreedOptional}
                onChange={(e) => handleOptionalAgree(e.target.checked)}
              />
              <label htmlFor="agree-optional" className="text-xs cursor-pointer" style={{ color: "#3E2A1E" }}>
                [선택] 개인정보 수집 및 이용 동의
              </label>
            </div>
            <div className="h-24 overflow-y-auto p-2 text-[11px] bg-stone-100/50 border border-stone-200 rounded leading-relaxed text-stone-600 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              RWhiskey은(는) 이용자에게 맞춤형 혜택과 큐레이션 서비스를 제공하기 위해 아래와 같이 선택적 개인정보를 수집 및 이용합니다.
              <br /><br />
              1. 수집 및 이용 목적<br />
              - 이용자의 취향 및 선호도를 반영한 맞춤형 위스키/칵테일 추천 서비스 제공<br />
              - 신규 기능 안내 및 통계 학적 특성에 따른 서비스 환경 개선<br /><br />
              2. 수집하는 개인정보 항목<br />
              - 선택 항목: 연령대, 성별, 주류 취향 및 선호도 정보<br /><br />
              3. 개인정보의 보유 및 이용 기간<br />
              - 회원 탈퇴 시 또는 선택 동의 철회 시까지 지체 없이 파기 (단, 관계 법령에 보존 의무가 있는 경우 해당 기간까지 보관)<br /><br />
              4. 동의를 거부할 권리 및 불이익<br />
              이용자는 선택 개인정보 수집에 대한 동의를 거부할 권리가 있습니다. 거부하시더라도 기본 서비스(회원가입 및 커뮤니티 이용 등)는 정상적으로 이용 가능하나, 개인 맞춤형 추천 및 이벤트 참여에는 제한이 있을 수 있습니다.
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-xs text-center">{error}</p>
        )}

        {success && (
          <p className="text-green-700 text-xs text-center font-bold">
            회원 명단에 등록되었습니다. 잠시 후 이동합니다.
          </p>
        )}

        {/* Total Agreement Row */}
        <div className="flex items-center justify-end gap-2 px-1">
          <input
            id="agree-all"
            type="checkbox"
            className="w-4 h-4 accent-[#3E2A1E] cursor-pointer"
            checked={isAllAgreed}
            onChange={(e) => handleAllAgree(e.target.checked)}
          />
          <label htmlFor="agree-all" className="text-xs font-bold cursor-pointer" style={{ color: "#3E2A1E" }}>
            위 약관에 전체 동의합니다
          </label>
        </div>

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
          disabled={isLoading || success || !isEmailVerified || !isAgreedRequired}
          className="btn-stamp mt-2 font-semibold disabled:opacity-50"
          style={{ color: "#3E2A1E" }}
        >
          {isLoading ? "등록 중..." : "회원 명단에 등록하기"}
        </button>
      </form>
    </div>
  )
}
