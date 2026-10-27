"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { whiskeyV3Api } from '@/api/whiskeyV3Api';
import { toAiSuggestion } from '@/lib/recommendations/v3Contract';
import type { V3Response } from '@/lib/recommendations/v3Contract';
import { useAuthStore } from '@/store/authStore';
import { ApiResponseError } from '@/api/apiClient';

export default function AiRecommendationsList(){
  const uid=useAuthStore(s=>s.user?.uid);const [rows,setRows]=useState<V3Response[]>([]);
  const [status,setStatus]=useState<string|null>(null);const [reload,setReload]=useState(0);
  const [loading,setLoading]=useState(false);const [auth,setAuth]=useState(false);
  useEffect(()=>{let active=true;setRows([]);setStatus(null);setAuth(false);if(!uid)return;setLoading(true);
    void whiskeyV3Api.aiHistory().then(items=>{if(active)setRows(items.filter(x=>toAiSuggestion(x)!==null||x.code==='COLLECTED_SOURCE_RECHECK_REQUIRED'&&!!x.operationId));})
      .catch(e=>{if(active){setStatus('추천 기록을 불러오지 못했어요.');setAuth(e instanceof ApiResponseError && e.status===401);}})
      .finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[uid,reload]);
  if(!uid)return null;
  return <section className="mt-5 border-t border-[#4a3728]/25 pt-4">
    <h3 className="font-bold">추천으로 만난 한 잔</h3>
    <p className="mt-2 text-xs leading-5 text-stone-600">취향에 맞춰 고른 추천과 나의 시음 기록을 다시 확인해 보세요.</p>
    {loading && <p role="status" className="mt-3 text-sm">추천 기록을 불러오고 있어요…</p>}
    {!loading && !status && rows.length===0 && <p className="mt-3 text-sm">아직 저장된 추천이 없어요.</p>}
    {status && <p role="status" className="mt-3 text-sm">{status} {auth?<Link href="/login" className="inline-flex min-h-11 items-center underline">다시 로그인</Link>:<button onClick={()=>setReload(n=>n+1)} className="min-h-11 underline">다시 불러오기</button>}</p>}
    <ul className="mt-2 max-h-56 divide-y divide-[#4a3728]/15 overflow-y-auto">
      {rows.map((row,index)=>{const a=toAiSuggestion(row);return !a&&row.code==='COLLECTED_SOURCE_RECHECK_REQUIRED'?<li key={row.operationId}><Link href={`/notes/ai/${row.operationId}`} className="flex min-h-14 flex-col justify-center gap-1 py-3 text-sm"><span>저장한 위스키 추천 · {index+1}</span><span className="text-xs text-stone-600">{row.recommendedAt?new Date(row.recommendedAt).toLocaleString('ko-KR',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''} · 제품 정보와 시음 기록 확인 →</span></Link></li>:a?<li key={a.id}><Link href={`/notes/ai/${a.id}`} className="flex min-h-14 flex-col justify-center gap-1 py-3 text-sm"><span className="break-words">{a.identity.brand} {a.identity.expression}</span><span className="text-xs text-stone-600">시음 기록 남기기·보기 →</span></Link></li>:null;})}
    </ul>
  </section>;
}
