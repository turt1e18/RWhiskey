"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useDialogFocus } from "@/lib/useDialogFocus";

/**
 * 로그인하지 않은 사용자가 추천 화면에 들어오면 로그인으로 안내한다.
 * 로그인 뒤에는 AuthProvider가 기억한 이 화면으로 돌아온다.
 */
export default function LoginRequiredModal({ service }: { service: string }) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const router = useRouter();
  const open = isInitialized && !isAuthenticated;
  const ref = useDialogFocus<HTMLDivElement>(open, () => router.push("/main"));

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        aria-describedby="login-required-desc"
        className="w-full max-w-sm rounded-2xl border border-[#ffb247]/30 bg-[#2d2417] p-6 shadow-2xl md:p-8"
      >
        <h2 id="login-required-title" className="text-xl font-bold text-[#ffb247] md:text-2xl">
          로그인이 필요해요
        </h2>
        <p id="login-required-desc" className="mt-3 break-keep text-[0.9375rem] leading-relaxed text-white/80">
          {service}은 로그인한 뒤에 받을 수 있어요. 로그인하면 지금 보던 화면으로 돌아와요.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/login"
            className="flex min-h-11 items-center justify-center rounded-xl bg-[#ffb247] font-bold text-[#1a140b] hover:bg-[#ffc46b]"
          >
            로그인하기
          </Link>
          <Link
            href="/main"
            className="flex min-h-11 items-center justify-center rounded-xl border border-white/20 text-white/80 hover:bg-white/10"
          >
            메인으로
          </Link>
        </div>
      </div>
    </div>
  );
}
