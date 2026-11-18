import type { ReactNode } from "react";
import LoginRequiredModal from "@/components/LoginRequiredModal";

export default function MoodLayout({ children }: { children: ReactNode }) {
  return <>{children}<LoginRequiredModal service="위스키 추천" /></>;
}
