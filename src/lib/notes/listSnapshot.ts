/** 목록 상세에서 돌아왔을 때 보던 목록을 되살리는 탭 전용 임시 보관. 오래된 값은 쓰지 않는다. */
export const SNAPSHOT_TTL_MS = 10 * 60 * 1000;

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Snapshot<T> = { items: T[]; next: string | null; savedAt: number };

export function saveSnapshot<T>(store: Store, key: string, snap: { items: T[]; next: string | null }, now = Date.now()) {
  try { store.setItem(key, JSON.stringify({ ...snap, savedAt: now })); } catch { /* 가득 찼거나 막혔으면 복원만 포기한다 */ }
}

export function loadSnapshot<T>(store: Store, key: string, now = Date.now()): Snapshot<T> | null {
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Snapshot<T>> | null;
    const ok = value && Array.isArray(value.items) && value.items.length > 0 && (value.next === null || typeof value.next === "string")
      && typeof value.savedAt === "number" && now - value.savedAt >= 0 && now - value.savedAt < SNAPSHOT_TTL_MS;
    if (ok) return value as Snapshot<T>;
    store.removeItem(key);
  } catch { /* 손상된 값은 없는 것으로 본다 */ }
  return null;
}

/** 상세로 나가며 남기는 표시: 어느 글을 열었는지와 보던 스크롤 위치. */
export type Departure = { id: number; panel: number; win: number };

export function markDeparture(store: Store, key: string, departure: Departure) {
  try { store.setItem(key, JSON.stringify(departure)); } catch { /* 복원만 포기한다 */ }
}

/** 한 번만 읽히고 지워진다. 그냥 목록에 들어온 경우에는 표시가 없어 새로 불러온다. */
export function takeDeparture(store: Store, key: string): Departure | null {
  try {
    const raw = store.getItem(key);
    store.removeItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Departure> | null;
    return v && Number.isInteger(v.id) && typeof v.panel === "number" && typeof v.win === "number" ? (v as Departure) : null;
  } catch { return null; }
}

/** 되살릴 목록 결정: 나간 표시가 있고 보관본이 살아 있을 때만 돌려준다. 표시는 읽는 즉시 지워진다. */
export function resolveRestore<T>(store: Store, snapshotKey: string, now = Date.now()): { out: Departure; snap: Snapshot<T> } | null {
  const out = takeDeparture(store, `${snapshotKey}:out`);
  const snap = out ? loadSnapshot<T>(store, snapshotKey, now) : null;
  return out && snap ? { out, snap } : null;
}

/** 카드에서 좋아요를 누르면 목록 값도 같이 바꿔, 보관한 목록이 눌러 둔 상태와 어긋나지 않게 한다. */
export function withLike<T extends { id: number; liked: boolean; likeCount: number }>(items: T[], id: number, liked: boolean): T[] {
  return items.map((entry) => entry.id === id ? { ...entry, liked, likeCount: Math.max(0, entry.likeCount + (liked ? 1 : -1)) } : entry);
}

/** 로그아웃하면 이 탭에 남은 목록 보관본과 나간 표시를 모두 지운다(같은 탭을 다음 사람이 쓸 수 있다). */
export function clearSnapshots(store: Pick<Storage, "length" | "key" | "removeItem">) {
  try {
    const mine: string[] = [];
    for (let i = 0; i < store.length; i++) { const key = store.key(i); if (key && /^(lounge|entries):/.test(key)) mine.push(key); }
    mine.forEach((key) => store.removeItem(key));
  } catch { /* 막힌 저장소면 지울 것도 없다 */ }
}
