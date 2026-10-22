import apiClient from './apiClient';
import type { V3Request, V3Response } from '../lib/recommendations/v3Contract';
import type { WhiskeyFeedbackReason, WhiskeyFeedbackSentiment } from '../type/ApiInterface';
export interface AiFeedbackInput {
  sentiment?:WhiskeyFeedbackSentiment|null;reason?:WhiskeyFeedbackReason;comment?:string|null;
  tastedOn?:string|null;nose?:string|null;palate?:string|null;finish?:string|null;memo?:string|null;rating?:number|null;
  userFeatures?:{smokeLevel?:number|null};
}
export interface AiFeedbackView {operationId:string;stage:'EXPECTED'|'CONSUMED';feedback:AiFeedbackInput;updatedAt:string}
export interface WhiskeyHistoryItem {
  sourceType:'VERIFIED_RECORD'|'LEGACY_ORDER';sourceId:number;displayName:string|null;recommendedAt:string;
  verificationAtRecommendation:'V3_CERTIFIED'|'V2_REVIEWED'|'LEGACY_UNVERIFIED';snapshotAvailable:boolean;notePath:string;
}

export const whiskeyV3Api = {
  suggest: (request:V3Request,key:string) => apiClient<V3Response>('/api/recommendations/v3/ai-suggestions', {
    method:'POST',headers:{'Idempotency-Key':key,
      ...(process.env.NODE_ENV === 'development' ? {'X-Whiskey-Debug-Candidates':'true'} : {})},body:JSON.stringify(request),timeoutMs:25_000,
  }),
  byId: (id:string) => apiClient<V3Response>(`/api/recommendations/v3/operations/${encodeURIComponent(id)}`,{method:'GET'}),
  aiHistory: () => apiClient<V3Response[]>('/api/recommendations/v3/ai-suggestions',{method:'GET'}),
  aiFeedback: (id:string,stage:'EXPECTED'|'CONSUMED') => apiClient<AiFeedbackView|null>(`/api/recommendations/v3/ai-suggestions/${encodeURIComponent(id)}/feedback/${stage}`,{method:'GET',emptyBodyAsNull:true}),
  saveAiFeedback: (id:string,stage:'EXPECTED'|'CONSUMED',input:AiFeedbackInput) => apiClient<AiFeedbackView>(`/api/recommendations/v3/ai-suggestions/${encodeURIComponent(id)}/feedback/${stage}`,{method:'PUT',body:JSON.stringify(input)}),
  history: () => apiClient<WhiskeyHistoryItem[]>('/api/recommendations/history', { method:'GET' }),
  recommend: (request: V3Request, key: string) => apiClient<V3Response>('/api/recommendations/v3/verified', {
    method: 'POST', headers: { 'Idempotency-Key':key,
      ...(process.env.NODE_ENV === 'development' ? { 'X-Whiskey-Debug-Candidates':'true' } : {}),
    }, body:JSON.stringify(request), timeoutMs:25_000,
  }),
  lookup: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}`, { method:'GET', timeoutMs:5_000 }),
  recover: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}/recover`, { method:'POST', timeoutMs:5_000 }),
  closeUnreceived: (key: string) => apiClient<V3Response>(`/api/recommendations/v3/operations/by-key/${encodeURIComponent(key)}/close-unreceived`, { method:'POST', timeoutMs:5_000 }),
};
