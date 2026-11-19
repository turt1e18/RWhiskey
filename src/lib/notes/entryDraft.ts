// 통합 시음 노트(/api/tasting-entries)의 타입과, 작성 폼이 쓰는 순수 함수.
// node:test로 바로 돌릴 수 있게 "@/..." 경로와 브라우저 전역에 의존하지 않는다.

export type EntryStatus = "WISH" | "TASTED";
export type EntryServing = "NEAT" | "ROCKS" | "WATER" | "HIGHBALL" | "OTHER";
export type EntryVisibility = "PRIVATE" | "PUBLIC";
export type EntrySource = { kind: "LEGACY_ORDER" | "VERIFIED_RECORD" | "AI_OPERATION"; ref: string };

export interface TastingEntry {
  id: number;
  mine: boolean;
  bookmarked: boolean;
  likeCount: number;
  liked: boolean;
  /** 인기 탭에서만 온다: 최근 7일에 받은 좋아요 수. */
  recentLikeCount?: number | null;
  status: EntryStatus;
  source: EntrySource | null;
  whiskeyName: string;
  whiskeyNameEn: string | null;
  tastedOn: string | null;
  serving: EntryServing | null;
  memo: string | null;
  nose: string | null;
  palate: string | null;
  finish: string | null;
  rating: number | null;
  visibility: EntryVisibility;
  publishedAt: string | null;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface TastingEntryPage { items: TastingEntry[]; nextCursor: string | null }

/** 글쓴이가 비공개로 바꾸거나 지운 글은 available=false이고 entry가 없다. */
export interface TastingBookmarkItem { entryId: number; bookmarkedAt: string; available: boolean; entry: TastingEntry | null }
export interface TastingBookmarkPage { items: TastingBookmarkItem[]; nextCursor: string | null }

export type ReportReason = "SPAM" | "INAPPROPRIATE" | "COPYRIGHT" | "PERSONAL_INFO" | "OTHER";
export const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: "SPAM", label: "광고·스팸이에요" },
  { key: "INAPPROPRIATE", label: "불쾌하거나 부적절해요" },
  { key: "COPYRIGHT", label: "다른 사람의 글을 그대로 옮긴 것 같아요" },
  { key: "PERSONAL_INFO", label: "개인정보가 들어 있어요" },
  { key: "OTHER", label: "그 밖의 문제예요" },
];

export type EntryAction = "save" | "load" | "delete" | "add" | "bookmark" | "unbookmark" | "report" | "like";

export interface TastingEntryRequest {
  clientKey?: string;
  status: EntryStatus;
  whiskeyName: string | null;
  whiskeyNameEn: string | null;
  source?: EntrySource;
  tastedOn: string | null;
  serving: EntryServing | null;
  memo: string | null;
  nose: string | null;
  palate: string | null;
  finish: string | null;
  rating: number | null;
  visibility: EntryVisibility;
}

/** 폼이 들고 있는 값. 문자열 칸은 비어 있으면 ""다. */
export interface EntryDraft {
  /** 저장 재시도가 같은 노트로 모이게 하는 키. 초안과 함께 보관한다. */
  clientKey: string;
  status: EntryStatus;
  whiskeyName: string;
  tastedOn: string;
  serving: EntryServing | null;
  memo: string;
  nose: string;
  palate: string;
  finish: string;
  rating: number | null;
  visibility: EntryVisibility;
}

export const SERVING_LABELS: Record<EntryServing, string> = {
  NEAT: "스트레이트", ROCKS: "온더록스", WATER: "물 조금", HIGHBALL: "하이볼", OTHER: "기타",
};
export const LIMITS = { whiskeyName: 255, memo: 2000, part: 500 } as const;

export function emptyDraft(clientKey: string, whiskeyName = ""): EntryDraft {
  return { clientKey, status: "TASTED", whiskeyName, tastedOn: "", serving: null, memo: "", nose: "", palate: "", finish: "", rating: null, visibility: "PRIVATE" };
}

export function draftFromEntry(entry: TastingEntry, clientKey: string): EntryDraft {
  return {
    clientKey, status: entry.status, whiskeyName: entry.whiskeyName, tastedOn: entry.tastedOn ?? "", serving: entry.serving,
    memo: entry.memo ?? "", nose: entry.nose ?? "", palate: entry.palate ?? "", finish: entry.finish ?? "",
    rating: entry.rating, visibility: entry.visibility,
  };
}

const text = (value: string) => value.trim() || null;

/** 서버에 보낼 본문. "마실 것"은 평점·공개를 가질 수 없으므로 감상 칸을 비워 보낸다. */
export function toRequest(draft: EntryDraft, create?: { source?: EntrySource }): TastingEntryRequest {
  const wish = draft.status === "WISH";
  return {
    ...(create && { clientKey: draft.clientKey, ...(create.source && { source: create.source }) }),
    status: draft.status,
    whiskeyName: text(draft.whiskeyName), whiskeyNameEn: null,
    tastedOn: wish ? null : draft.tastedOn || null,
    serving: wish ? null : draft.serving,
    memo: text(draft.memo),
    nose: wish ? null : text(draft.nose), palate: wish ? null : text(draft.palate), finish: wish ? null : text(draft.finish),
    rating: wish ? null : draft.rating,
    visibility: wish ? "PRIVATE" : draft.visibility,
  };
}

/** 저장 전에 화면에서 바로 알려 줄 수 있는 문제. 없으면 null. */
export function draftProblem(draft: EntryDraft, nameLocked: boolean, today: string): string | null {
  if (!nameLocked && !draft.whiskeyName.trim()) return "위스키 이름을 적어 주세요.";
  if (draft.whiskeyName.trim().length > LIMITS.whiskeyName) return `위스키 이름은 ${LIMITS.whiskeyName}자까지 쓸 수 있어요.`;
  if (draft.status === "TASTED" && draft.tastedOn && draft.tastedOn > today) return "마신 날은 오늘까지만 고를 수 있어요.";
  if (draft.memo.trim().length > LIMITS.memo) return `메모는 ${LIMITS.memo}자까지 쓸 수 있어요.`;
  if ([draft.nose, draft.palate, draft.finish].some((part) => part.trim().length > LIMITS.part)) return `향·맛·여운은 각각 ${LIMITS.part}자까지 쓸 수 있어요.`;
  return null;
}

export const sameDraft = (a: EntryDraft, b: EntryDraft) =>
  JSON.stringify({ ...a, clientKey: "" }) === JSON.stringify({ ...b, clientKey: "" });

/** 사용자·대상별 초안 키. 같은 기기를 쓰는 다른 계정에게 초안이 보이지 않게 uid를 넣는다. */
export const draftKey = (uid: number, scope: string) => `rw:noteDraft:${uid}:${scope}`;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function loadDraft(store: Store, key: string): EntryDraft | null {
  try {
    const value: unknown = JSON.parse(store.getItem(key) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const draft = { ...emptyDraft(""), ...(value as Partial<EntryDraft>) };
    // 손상됐거나 예전 형식인 초안은 버린다.
    const strings = [draft.clientKey, draft.whiskeyName, draft.tastedOn, draft.memo, draft.nose, draft.palate, draft.finish];
    const valid = strings.every((item) => typeof item === "string") && draft.clientKey !== "" &&
      (draft.status === "WISH" || draft.status === "TASTED") && (draft.rating === null || typeof draft.rating === "number") &&
      (draft.serving === null || draft.serving in SERVING_LABELS) && (draft.visibility === "PRIVATE" || draft.visibility === "PUBLIC");
    return valid ? draft : null;
  } catch { return null; }
}
export function saveDraft(store: Store, key: string, draft: EntryDraft) {
  try { store.setItem(key, JSON.stringify(draft)); } catch { /* 저장소가 막혀 있으면 초안 없이 계속한다 */ }
}
export function clearDraft(store: Store, key: string) {
  try { store.removeItem(key); } catch { /* 위와 같음 */ }
}

export type SaveFailure = { message: string; needsLogin: boolean };

/** 저장·조회 실패를 사용자가 할 수 있는 행동으로 바꾼다. status가 없으면 네트워크 문제다. */
export function entryFailure(status: number | null, code: string | null, action: EntryAction): SaveFailure {
  const kept = action === "save" ? " 쓰던 글은 이 기기에 보관하고 있어요." : "";
  if (status === null) return { message: `연결이 끊겼어요. 네트워크를 확인한 뒤 다시 시도해 주세요.${kept}`, needsLogin: false };
  if (status === 401) return { message: `로그인이 풀렸어요. 새 탭에서 로그인한 뒤 여기서 ${action === "save" ? "저장을 다시 눌러" : "다시 눌러"} 주세요.${kept}`, needsLogin: true };
  if (status === 403) return { message: `요청이 거부됐어요. 페이지를 새로고침한 뒤 다시 시도해 주세요.${kept}`, needsLogin: false };
  if (status === 404 && (action === "bookmark" || action === "unbookmark" || action === "report" || action === "like")) return { message: "이 글은 더 이상 볼 수 없어요. 글쓴이가 비공개로 바꾸거나 지웠을 수 있어요.", needsLogin: false };
  if (status === 404) return { message: "기록을 찾지 못했어요. 이미 지웠거나 다른 계정의 기록일 수 있어요.", needsLogin: false };
  if (status === 409 && code === "SOURCE_ALREADY_RECORDED") return { message: "이 추천으로 쓴 기록이 이미 있어요. 시음 기록에서 열어 보세요.", needsLogin: false };
  if (status === 429) return { message: code === "DAILY_LIKE_LIMIT" ? "오늘 누를 수 있는 좋아요를 모두 썼어요. 내일 다시 눌러 주세요." : code === "DAILY_PUBLISH_LIMIT" ? "오늘은 더 공개할 수 없어요. 내일 다시 시도해 주세요." : "오늘 쓸 수 있는 기록 수를 넘었어요. 내일 다시 시도해 주세요.", needsLogin: false };
  const known: Record<string, string> = {
    WHISKEY_NAME_REQUIRED: "위스키 이름을 적어 주세요.",
    TEXT_TOO_LONG: "글이 너무 길어요. 조금 줄인 뒤 다시 저장해 주세요.",
    INVALID_TASTING_DATE: "마신 날은 오늘까지만 고를 수 있어요.",
    INVALID_RATING: "점수를 다시 골라 주세요.",
    WISH_CANNOT_BE_RATED_OR_PUBLIC: "마실 목록의 기록에는 점수를 매기거나 공개할 수 없어요.",
    CANNOT_BOOKMARK_OWN: "내가 쓴 글은 저장할 수 없어요.",
    CANNOT_REPORT_OWN: "내가 쓴 글은 신고할 수 없어요.",
    CANNOT_LIKE_OWN: "내가 쓴 글에는 좋아요를 누를 수 없어요.",
  };
  if (status === 400 && code && known[code]) return { message: known[code], needsLogin: false };
  if (action === "like") return { message: "좋아요를 반영하지 못해 원래대로 돌려놓았어요. 잠시 뒤 다시 눌러 주세요.", needsLogin: false };
  const verb = action === "save" ? "저장하지" : action === "delete" ? "지우지" : action === "add" ? "담지" : action === "bookmark" ? "저장한 글에 담지" : action === "unbookmark" ? "저장한 글에서 빼지" : action === "report" ? "신고를 보내지" : "불러오지";
  return { message: `${verb} 못했어요. 잠시 뒤 다시 시도해 주세요.${kept}`, needsLogin: false };
}

/** "2026-11-17" → "2026.11.17" */
export const dotDate = (iso: string) => iso.slice(0, 10).replace(/-/g, ".");

const SOURCE_KINDS = ["LEGACY_ORDER", "VERIFIED_RECORD", "AI_OPERATION"] as const;

/** 추천에서 노트를 쓰러 가는 주소. 추천 종류와 식별자를 쿼리로 넘긴다. */
export const sourceNoteHref = (source: EntrySource) => `/notes/new?source=${source.kind}:${encodeURIComponent(source.ref)}`;

/** ?source=AI_OPERATION:<id> 형태. 알아볼 수 없으면 undefined(추천 없이 쓰는 새 글). */
export function parseSource(value: string | null): EntrySource | undefined {
  const [kind, ...rest] = (value ?? "").split(":");
  const ref = rest.join(":");
  return (SOURCE_KINDS as readonly string[]).includes(kind) && ref && ref.length <= 40 ? { kind: kind as EntrySource["kind"], ref } : undefined;
}
