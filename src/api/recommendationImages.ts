import { jsonRequestHeaders } from "./apiClient";
import { parseWhiskeyPhoto, type WhiskeyReferencePhoto } from '../lib/recommendations/whiskeyPhoto';

const photos=new Map<string,Promise<WhiskeyReferencePhoto|null>>();
/** Only an explicit user retry invalidates a failed lookup. */
export function forgetRecommendationPhoto(query:string):void {photos.delete(query);}
/** Coalesce StrictMode/remount requests. A failed search is not automatically retried. */
export function getRecommendationPhoto(query:string):Promise<WhiskeyReferencePhoto|null> {
  const cached=photos.get(query);if(cached)return cached;
  if(photos.size>=32)photos.delete(photos.keys().next().value!);
  const pending=(async()=>{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6_000);
    try {
      const response=await fetch('/api/google',{method:'POST',headers:jsonRequestHeaders(),credentials:'include',
        body:JSON.stringify({data:query,type:3,includeSource:true}),signal:controller.signal});
      return response.ok?parseWhiskeyPhoto(await response.json()):null;
    }catch{return null;}finally{clearTimeout(timer);}
  })();
  photos.set(query,pending);return pending;
}

/** An optional search picture must never turn a saved recommendation into a failure. */
export async function getRecommendationImage(query: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch("/api/google", {
      method: "POST", headers: jsonRequestHeaders(), credentials: "include",
      body: JSON.stringify({ data: query, type: 3 }), signal: controller.signal,
    });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (typeof value !== "string" || value.length > 2048 || value !== value.trim()) return null;
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? value : null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}
