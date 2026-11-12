"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { whiskeyV3Api } from '@/api/whiskeyV3Api';
import { toAiSuggestion } from '@/lib/recommendations/v3Contract';
import { displayExpression } from '@/lib/recommendations/aiPresentation';
import type { V3Response } from '@/lib/recommendations/v3Contract';
import { useAuthStore } from '@/store/authStore';
import { ApiResponseError } from '@/api/apiClient';

// onCount: 불러온 기록 수(실패는 null)를 알려 페이지가 빈 상태 안내를 한 번만 보이게 한다.
export default function AiRecommendationsList({onCount,showEmpty=true}:{onCount?:(count:number|null)=>void;showEmpty?:boolean}){
  const uid=useAuthStore(s=>s.user?.uid);const [rows,setRows]=useState<V3Response[]>([]);
  const [status,setStatus]=useState<string|null>(null);const [reload,setReload]=useState(0);
  const [loading,setLoading]=useState(false);const [auth,setAuth]=useState(false);
  useEffect(()=>{let active=true;setRows([]);setStatus(null);setAuth(false);if(!uid){onCount?.(0);return;}setLoading(true);
    void whiskeyV3Api.aiHistory().then(items=>{if(active){const next=items.filter(x=>toAiSuggestion(x)!==null||x.code==='COLLECTED_SOURCE_RECHECK_REQUIRED'&&!!x.operationId);setRows(next);onCount?.(next.length);}})
      .catch(e=>{if(active){setStatus('추천 기록을 불러오지 못했어요.');setAuth(e instanceof ApiResponseError && e.status===401);onCount?.(null);}})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[uid,reload,onCount]);
  if(!uid)return null;
  if(!loading&&!status&&rows.length===0&&!showEmpty)return null;
  // 글자색을 지정하지 않으면 부모의 흰색을 이어받아 크림색 바탕에서 보이지 않는다.
  return <section className="mt-5 border-t border-[#4a3728]/25 pt-4 text-stone-900">
    <h3 className="font-bold">취향에 맞춰 고른 추천</h3>
    <p className="mt-2 text-xs leading-5 text-stone-600">저장한 추천과 나의 시음 기록을 다시 확인해 보세요.</p>
    {loading && <p role="status" className="mt-3 text-sm">추천 기록을 불러오고 있어요…</p>}
    {!loading && !status && rows.length===0 && showEmpty && <p className="mt-3 text-sm">아직 저장된 추천이 없어요.</p>}
    {status && <p role="status" className="mt-3 text-sm">{status} {auth?<Link href="/login" className="inline-flex min-h-11 items-center underline">다시 로그인</Link>:<button onClick={()=>setReload(n=>n+1)} className="min-h-11 underline">다시 불러오기</button>}</p>}
    <ul className="mt-2 max-h-56 divide-y divide-[#4a3728]/15 overflow-y-auto">
      {rows.map((row)=>{const a=toAiSuggestion(row);return !a&&row.code==='COLLECTED_SOURCE_RECHECK_REQUIRED'?<li key={row.operationId}><Link href={`/notes/ai/${row.operationId}`} className="flex min-h-14 flex-col justify-center gap-1 py-3 text-sm"><span>저장한 위스키 추천</span><span className="text-xs text-stone-600">{row.recommendedAt?new Date(row.recommendedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''} · 제품 정보와 시음 기록 확인 →</span></Link></li>:a?<li key={a.id}><Link href={`/notes/ai/${a.id}`} className="flex min-h-14 flex-col justify-center gap-1 py-3 text-sm"><span className="break-words">{a.identity.brand} {displayExpression(a.identity.expression)}</span><span className="text-xs text-stone-600">시음 기록 남기기·보기 →</span></Link></li>:null;})}
    </ul>
  </section>;
}
