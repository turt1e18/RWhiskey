import { sourceNoteHref, type EntrySource } from "./entryDraft";

/** 새 시음 노트(통합 노트) 진입을 여는 스위치. 꺼져 있으면 기존 화면만 쓴다. */
export const NOTES_V2 = process.env.NEXT_PUBLIC_NOTES_V2_ENABLED === "true";

/** 추천에서 "마신 뒤 기록"으로 가는 주소. 스위치가 꺼져 있으면 기존 주소를 그대로 쓴다. */
export const noteWriteHref = (source: EntrySource, legacyHref: string) => (NOTES_V2 ? sourceNoteHref(source) : legacyHref);
