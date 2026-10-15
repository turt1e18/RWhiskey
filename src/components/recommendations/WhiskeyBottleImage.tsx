"use client";
import { useState } from "react";
import { Wine } from "lucide-react";
export default function WhiskeyBottleImage({ url, name }: { url: string | null | undefined; name: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="mt-5 flex h-56 w-full items-center justify-center rounded border border-[#4a3728]/15 bg-white/35">
    {url?.startsWith("https://") && !failed ?
      // Exact bottling images are approved by the BE. A remote image failure remains a normal card.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt={name + " 제품 사진"} referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full max-w-full object-contain p-3" /> :
      <div className="flex flex-col items-center gap-3 text-stone-600"><Wine size={48} aria-hidden="true" /><p className="text-xs">제품 사진을 준비 중이에요</p></div>}
  </div>;
}
