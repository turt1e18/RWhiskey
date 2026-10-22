"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {imageFailureAction,imageAttemptWait} from '@/lib/recommendations/imageAttempt';

/** Search pictures are references, not verified bottle/recipe identity evidence. */
type Props={src?:string|null;fallbackSrc?:string|null;name:string;sourceUrl?:string;sourceTitle?:string};
export default function RecommendationSearchImage(props:Props) {
  return <ImageAttempt key={`${props.src??''}|${props.fallbackSrc??''}`} {...props}/>;
}
function ImageAttempt({src,fallbackSrc,name,sourceUrl,sourceTitle}:Props) {
  const primary=src?.startsWith('https://')?src:null;
  const fallback=primary && sourceUrl && fallbackSrc?.startsWith('https://') && fallbackSrc!==primary?fallbackSrc:null;
  const [index,setIndex]=useState(0);const started=useRef(Date.now());
  const url=index===0?primary:fallback;
  const currentUrl=useRef(url);currentUrl.current=url;
  const [status, setStatus] = useState<"loading" | "loaded" | "unavailable">(url ? "loading" : "unavailable");
  function failed(){
    if(imageFailureAction(index,!!fallback,Date.now()-started.current)==='fallback')setIndex(1);
    else setStatus('unavailable');
  }
  useEffect(() => {
    if (status !== "loading") return;
    const timer = setTimeout(()=>{
      if(imageFailureAction(index,!!fallback,Date.now()-started.current)==='fallback')setIndex(1);
      else setStatus('unavailable');
    },imageAttemptWait(index,!!fallback,Date.now()-started.current));
    return () => clearTimeout(timer);
  }, [status,index,fallback]);

  return <figure className="relative mb-6 flex h-64 w-full items-center justify-center overflow-hidden rounded-sm bg-[#f5ead3]">
    {url && status !== "unavailable" ? <>
      {status === "loading" && <div role="status" aria-label="참고 이미지 불러오는 중" className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <div aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-2 border-[#4a3728]/20 border-t-[#4a3728]" />
        <span className="text-xs text-stone-700">참고 사진을 불러오는 중</span>
      </div>}
      <Image src={url} alt={name + " 참고 이미지"} fill unoptimized referrerPolicy="no-referrer"
        className={"object-contain p-2 pb-7 transition-opacity duration-300 " + (status === "loaded" ? "opacity-100" : "opacity-0")}
        key={url} onLoad={() => {if(currentUrl.current===url && Date.now()-started.current<8000)setStatus("loaded");}}
        onError={()=>{if(currentUrl.current===url)failed();}} />
      {status === "loaded" && <figcaption className="absolute inset-x-2 bottom-1 text-center text-[11px] leading-5 text-stone-700">
        {sourceUrl?'검색 참고 사진':'참고 이미지'}{sourceUrl && <> · <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline" title={sourceTitle}>사진 출처</a></>}
      </figcaption>}
    </> : <div role="status" className="px-5 text-center text-sm leading-relaxed text-stone-700">
      <p>사진을 준비하지 못했어요.</p>
      <p className="mt-1 text-xs">추천 내용은 아래에서 확인해 주세요.</p>
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center underline">사진 출처에서 확인하기</a>}
    </div>}
  </figure>;
}
