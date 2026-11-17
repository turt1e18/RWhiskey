import apiClient, { ApiResponseError } from "./apiClient";
import { entryFailure, type EntryStatus, type SaveFailure, type TastingEntry, type TastingEntryPage, type TastingEntryRequest } from "@/lib/notes/entryDraft";

const base = "/api/tasting-entries";
// 응답이 오지 않는 요청이 "저장 중…"에 머물지 않게 한다.
const timeoutMs = 15_000;

/** 통합 시음 노트 API. 구 notesApi(/api/notes)와 별개다. */
export const tastingEntryApi = {
  create: (body: TastingEntryRequest) => apiClient<TastingEntry>(base, { method: "POST", body: JSON.stringify(body), timeoutMs }),
  mine: (status: EntryStatus | null, cursor: string | null) => {
    const query = new URLSearchParams({ ...(status && { status }), ...(cursor && { cursor }) }).toString();
    return apiClient<TastingEntryPage>(query ? `${base}?${query}` : base, { method: "GET", timeoutMs });
  },
  get: (id: number) => apiClient<TastingEntry>(`${base}/${id}`, { method: "GET", timeoutMs }),
  replace: (id: number, body: TastingEntryRequest) => apiClient<TastingEntry>(`${base}/${id}`, { method: "PUT", body: JSON.stringify(body), timeoutMs }),
  remove: (id: number) => apiClient<null>(`${base}/${id}`, { method: "DELETE", emptyBodyAsNull: true, timeoutMs }),
};

export function describeEntryError(error: unknown, action: "save" | "load" | "delete"): SaveFailure {
  if (!(error instanceof ApiResponseError)) return entryFailure(null, null, action);
  const code = typeof error.data === "object" && error.data !== null && "code" in error.data ? String((error.data as { code: unknown }).code) : null;
  return entryFailure(error.status, code, action);
}
