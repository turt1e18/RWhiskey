"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // 앱 초기화 시 사용자 세션 정보 확인
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
