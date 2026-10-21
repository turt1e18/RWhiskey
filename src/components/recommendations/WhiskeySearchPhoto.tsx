"use client";
import {useEffect,useState} from 'react';
import {getRecommendationPhoto,forgetRecommendationPhoto} from '@/api/recommendationImages';
import {whiskeyPhotoQuery, type WhiskeyReferencePhoto} from '@/lib/recommendations/whiskeyPhoto';
import type {AiSuggestionCard} from '@/lib/recommendations/v3Contract';
import RecommendationSearchImage from './RecommendationSearchImage';

/** Optional search reference; never a certificate or a reason to reject a recommendation. */
export default function WhiskeySearchPhoto({identity}:{identity:AiSuggestionCard['identity']}){
  const query=whiskeyPhotoQuery(identity);
  const [photo,setPhoto]=useState<WhiskeyReferencePhoto|null>(null);const [ready,setReady]=useState(false);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setPhoto(null);setReady(false);
    void getRecommendationPhoto(query).then(value=>{if(active){setPhoto(value);setReady(true);}});
    return()=>{active=false;};
  },[query,retry]);
  return <div className="mt-5">
    {ready ? <RecommendationSearchImage key={photo?.url??query} src={photo?.url} fallbackSrc={photo?.fallbackUrl} name={`${identity.brand} ${identity.expression}`}
      sourceUrl={photo?.sourceUrl} sourceTitle={photo?.sourceTitle}/> :
      <div role="status" className="mb-6 flex h-52 items-center justify-center text-sm text-stone-600">사진을 찾고 있어요…</div>}
    {ready && !photo && <button type="button" className="mb-3 inline-flex min-h-11 items-center text-xs text-stone-700 underline"
      onClick={()=>{setReady(false);forgetRecommendationPhoto(query);setRetry(n=>n+1);}}>사진 다시 찾기</button>}
  </div>;
}
