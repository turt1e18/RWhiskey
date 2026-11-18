import { Loader2 } from "lucide-react";

/** 불러오는 동안 보이는 돌아가는 표시. 모션 줄이기 설정이면 돌지 않고 글자만 남는다. */
export function Spinner({ label, size = 28 }: { label: string; size?: number }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-[#3e2616]/80">
      <Loader2 aria-hidden width={size} height={size} strokeWidth={1.5} className="animate-spin motion-reduce:animate-none" />
      <p className="font-serif text-sm">{label}</p>
    </div>
  );
}
