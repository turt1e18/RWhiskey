"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { rememberPath } from "@/lib/loginRedirect";

export default function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const { fetchUser } = useAuthStore();

  const pathname = usePathname();
  useEffect(() => { rememberPath(pathname); }, [pathname]);

  useEffect(() => {
    // 앱 초기화 시 사용자 세션 정보 확인
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
