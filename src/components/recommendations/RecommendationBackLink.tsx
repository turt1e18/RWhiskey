import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function RecommendationBackLink({ href }: { href: string }) {
  return (
    <Link href={href} replace
      className="inline-flex min-h-11 items-center gap-2 rounded-sm py-2 text-sm font-light text-stone-500 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">
      <ChevronLeft aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0" />
      <span>뒤로가기</span>
    </Link>
  );
}
