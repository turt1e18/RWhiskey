'use client';
import {useEffect,useState} from 'react';
import type {CollectedCandidateOrigin} from './collectedCandidate';

/** Expiry hides only the source body; drafts and the saved recommendation ID stay mounted. */
export function useCollectedLease(origin:CollectedCandidateOrigin|null|undefined):number {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    setNow(Date.now());
    if(!origin)return;
    const delay=Date.parse(origin.validUntil)-Date.now();
    if(delay<=0)return;
    const timer=setTimeout(()=>setNow(Date.now()),Math.min(delay+20,900020));
    return ()=>clearTimeout(timer);
  },[origin]);
  return now;
}
