import apiClient from './apiClient';
import type { V3Request, V3Response } from '../lib/recommendations/v3Contract';
export interface WhiskeyHistoryItem {
  sourceType:'VERIFIED_RECORD'|'LEGACY_ORDER';sourceId:number;displayName:string|null;recommendedAt:string;
  verificationAtRecommendation:'V3_CERTIFIED'|'V2_REVIEWED'|'LEGACY_UNVERIFIED';snapshotAvailable:boolean;notePath:string;
}

export const whiskeyV3Api = {
  history: () => apiClient<WhiskeyHistoryItem[]>('/api/recommendations/history', { method:'GET' }),
  recommend: (request: V3Request, key: string) => apiClient<V3Response>('/api/recommendations/v3/verified', {
    method: 'POST', headers: { 'Idempotency-Key':key }, body:JSON.stringify(request), timeoutMs:25_000,
  }),
  lookup: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}`, { method:'GET', timeoutMs:5_000 }),
  recover: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}/recover`, { method:'POST', timeoutMs:5_000 }),
  closeUnreceived: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}/close-unreceived`, { method:'POST', timeoutMs:5_000 }),
};
