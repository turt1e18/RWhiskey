import { useEffect, useState } from "react";

/** 초 단위로 0까지 줄어드는 남은 시간. start(n)으로 시작한다. */
export function useCountdown() {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft] as const;
}

// BE 재전송 간격(EmailVerificationService.SEND_COOLDOWN)과 같게 둔다
export const RESEND_COOLDOWN_SEC = 60;
