"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";

/** Logout with an in-page confirm step. Native confirm() is dismissed at once in some embedded browsers, which silently cancels the logout. */
export default function LogoutControl({ className, layout, onDone }: {
  className: string; layout: "row" | "column"; onDone?: () => void;
}) {
  const logout = useAuthStore((s) => s.logout);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!asking) {
    return <button type="button" onClick={() => setAsking(true)} className={className}>로그아웃</button>;
  }

  const confirmLogout = async () => {
    setBusy(true);
    await logout(); // clears the session even when the request fails, so there is no error branch to show
    toast.success("로그아웃했어요.");
    onDone?.();
  };

  const column = layout === "column";
  return (
    <div role="group" aria-label="로그아웃 확인" className={column ? "flex flex-col gap-2" : "flex items-center gap-2"}>
      <span className={`text-white/80 ${column ? "text-center text-sm" : "text-xs"}`}>로그아웃할까요?</span>
      <button type="button" autoFocus disabled={busy} onClick={() => void confirmLogout()}
        className={`${column ? "w-full py-3 rounded-xl" : "min-h-11 px-4 rounded-full"} bg-[#ffb247] text-sm font-bold text-[#1a140b] disabled:opacity-60`}>
        {busy ? "로그아웃 중…" : "로그아웃"}
      </button>
      <button type="button" disabled={busy} onClick={() => setAsking(false)}
        className={`${column ? "w-full py-3 rounded-xl" : "min-h-11 px-4 rounded-full"} border border-white/20 text-sm text-white/80`}>
        취소
      </button>
    </div>
  );
}
