import apiClient, { ApiResponseError } from "./apiClient";
import { entryFailure, type EntryAction, type EntryStatus, type ReportReason, type SaveFailure, type TastingBookmarkPage, type TastingEntry, type TastingEntryPage, type TastingEntryRequest } from "@/lib/notes/entryDraft";

const base = "/api/tasting-entries";
export type LoungeSort = "popular" | "latest";
// 응답이 오지 않는 요청이 "저장 중…"에 머물지 않게 한다.
const timeoutMs = 15_000;

/** 통합 시음 노트 API. 구 notesApi(/api/notes)와 별개다. */
export const tastingEntryApi = {
  create: (body: TastingEntryRequest) => apiClient<TastingEntry>(base, { method: "POST", body: JSON.stringify(body), timeoutMs }),
  mine: (status: EntryStatus | null, cursor: string | null) => {
    const query = new URLSearchParams({ ...(status && { status }), ...(cursor && { cursor }) }).toString();
    return apiClient<TastingEntryPage>(query ? `${base}?${query}` : base, { method: "GET", timeoutMs });
  },
  /** 이 추천(출처)으로 내가 이미 쓴 노트. 없으면 404(ApiResponseError). */
  bySource: (kind: string, ref: string) => apiClient<TastingEntry>(`${base}/by-source?${new URLSearchParams({ kind, ref })}`, { method: "GET", timeoutMs }),
  get: (id: number) => apiClient<TastingEntry>(`${base}/${id}`, { method: "GET", timeoutMs }),
  replace: (id: number, body: TastingEntryRequest) => apiClient<TastingEntry>(`${base}/${id}`, { method: "PUT", body: JSON.stringify(body), timeoutMs }),
  remove: (id: number) => apiClient<null>(`${base}/${id}`, { method: "DELETE", emptyBodyAsNull: true, timeoutMs }),
  lounge: (sort: LoungeSort, cursor: string | null) =>
    apiClient<TastingEntryPage>(`/api/lounge/entries?${new URLSearchParams({ sort, ...(cursor && { cursor }) })}`, { method: "GET", timeoutMs }),
  like: (id: number) => apiClient<null>(`${base}/${id}/like`, { method: "PUT", emptyBodyAsNull: true, timeoutMs }),
  unlike: (id: number) => apiClient<null>(`${base}/${id}/like`, { method: "DELETE", emptyBodyAsNull: true, timeoutMs }),
  bookmarks: (cursor: string | null) =>
    apiClient<TastingBookmarkPage>(cursor ? `${base}/bookmarks?${new URLSearchParams({ cursor })}` : `${base}/bookmarks`, { method: "GET", timeoutMs }),
  bookmark: (id: number) => apiClient<null>(`${base}/${id}/bookmark`, { method: "PUT", emptyBodyAsNull: true, timeoutMs }),
  unbookmark: (id: number) => apiClient<null>(`${base}/${id}/bookmark`, { method: "DELETE", emptyBodyAsNull: true, timeoutMs }),
  report: (id: number, reason: ReportReason) =>
    apiClient<null>(`${base}/${id}/report`, { method: "POST", body: JSON.stringify({ reason }), emptyBodyAsNull: true, timeoutMs }),
};

export function describeEntryError(error: unknown, action: EntryAction): SaveFailure {
  if (!(error instanceof ApiResponseError)) return entryFailure(null, null, action);
  const code = typeof error.data === "object" && error.data !== null && "code" in error.data ? String((error.data as { code: unknown }).code) : null;
  return entryFailure(error.status, code, action);
}
