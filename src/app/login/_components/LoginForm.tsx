"use client";

import { useState } from "react";
import { authApi } from "@/api/whiskeyApi";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  onSignup: () => void;
  onReset: () => void;
}

export default function LoginForm({ onSignup, onReset }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authApi.login({ email, pw: password });
      if (response.success) {
        setUser({
          authenticated: true,
          uid: response.uid,
          name: response.name,
          email: response.email
        });
        router.push("/main");
      } else {
        setError("회원 명부에서 찾을 수 없는 이메일 또는 비밀번호입니다.");
      }
    } catch (err: any) {
      setError("회원 명부에서 찾을 수 없는 이메일 또는 비밀번호입니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-4">
        <h1
          className="font-parisienne text-5xl font-bold tracking-tight"
          style={{ color: "#3E2A1E" }}
        >
          R-Whiskey
        </h1>
        <h2
          className="text-base font-bold tracking-[0.2em]"
          style={{ color: "#5C4A39" }}
        >
          방명록
        </h2>
        <div
          className="w-12 h-px"
          style={{ background: "#3E2A1E", opacity: 0.4 }}
        />
      </div>

      {/* Form fields */}
      <form className="flex flex-col gap-7" onSubmit={handleLogin}>
        {/* Email field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="label-style">
            연락처
          </label>
          <input
            id="login-email"
            type="email"
            className="input-dotted"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        {/* Password field */}
        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="label-style">
            비밀번호
          </label>
          <input
            id="login-password"
            type="password"
            className="input-dotted"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="text-red-600 text-xs text-center">{error}</p>}

        {/* Forgot password link */}
        <div className="text-right pt-1">
          <button
            type="button"
            onClick={onReset}
            className="text-xs underline underline-offset-2 transition-colors duration-150"
            style={{ color: "#5C4A39" }}
          >
            암호를 잊으셨나요?
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-stamp mt-3 font-semibold disabled:opacity-50"
          style={{ color: "#3E2A1E" }}
        >
          {isLoading ? "대조 중..." : "바 방문"}
        </button>
      </form>

      {/* Divider */}
      <div className="w-full h-px" style={{ background: "#BFAD98" }} />

      {/* Signup link */}
      <div className="text-center">
        <p className="text-xs" style={{ color: "#5C4A39" }}>
          명부에 성함을 올리지 않으셨나요?{" "}
          <button
            type="button"
            onClick={onSignup}
            className="underline underline-offset-2 transition-colors duration-150 font-semibold"
            style={{ color: "#3E2A1E" }}
          >
            회원 명부에 등록하기
          </button>
        </p>
      </div>
    </div>
  );
}
