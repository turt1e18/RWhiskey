import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REPORT_REASONS, clearDraft, draftFromEntry, parseSource, sourceNoteHref, draftKey, draftProblem, emptyDraft, entryFailure, loadDraft, sameDraft, saveDraft, toRequest, type TastingEntry } from './entryDraft';

const memory = () => { const data = new Map<string, string>(); return {
  getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key), data }; };

test('빈 칸은 null로 보내고 생성 때만 clientKey와 source를 싣는다', () => {
  const draft = { ...emptyDraft('k1', '  글렌피딕 12  '), memo: '  좋았다 ', nose: '   ', rating: 4.5, tastedOn: '2026-11-01' };
  const created = toRequest(draft, { source: { kind: 'AI_OPERATION', ref: 'u' } });
  assert.equal(created.clientKey, 'k1'); assert.deepEqual(created.source, { kind: 'AI_OPERATION', ref: 'u' });
  assert.equal(created.whiskeyName, '글렌피딕 12'); assert.equal(created.memo, '좋았다'); assert.equal(created.nose, null);
  assert.equal(created.rating, 4.5); assert.equal(created.tastedOn, '2026-11-01');
  const replaced = toRequest(draft);
  assert.equal('clientKey' in replaced, false); assert.equal('source' in replaced, false);
});

test('마실 것은 점수·날짜·항목·공개를 비워 보낸다', () => {
  const request = toRequest({ ...emptyDraft('k', '아드벡'), status: 'WISH', rating: 5, tastedOn: '2026-11-01', nose: '피트', serving: 'NEAT', visibility: 'PUBLIC', memo: '궁금' });
  assert.deepEqual([request.rating, request.tastedOn, request.nose, request.serving, request.visibility, request.memo], [null, null, null, null, 'PRIVATE', '궁금']);
});

test('저장 전 문제를 사람 말로 알려 준다', () => {
  const ok = emptyDraft('k', '이름');
  assert.equal(draftProblem(ok, false, '2026-11-17'), null);
  assert.match(draftProblem(emptyDraft('k', '  '), false, '2026-11-17')!, /이름/);
  assert.equal(draftProblem(emptyDraft('k', ''), true, '2026-11-17'), null); // 추천에서 온 노트는 이름을 서버가 채운다
  assert.match(draftProblem({ ...ok, tastedOn: '2026-11-18' }, false, '2026-11-17')!, /오늘까지/);
  assert.equal(draftProblem({ ...ok, tastedOn: '2026-11-17' }, false, '2026-11-17'), null);
  assert.equal(draftProblem({ ...ok, status: 'WISH', tastedOn: '2026-11-18' }, false, '2026-11-17'), null);
  assert.match(draftProblem({ ...ok, memo: '가'.repeat(2001) }, false, '2026-11-17')!, /2000자/);
  assert.equal(draftProblem({ ...ok, memo: '가'.repeat(2000) }, false, '2026-11-17'), null);
  assert.match(draftProblem({ ...ok, finish: '가'.repeat(501) }, false, '2026-11-17')!, /500자/);
});

test('초안은 계정·대상별로 따로 보관되고 손상된 값은 버린다', () => {
  const store = memory();
  const draft = { ...emptyDraft('k', '이름'), memo: '쓰던 글' };
  saveDraft(store, draftKey(7, 'new'), draft);
  assert.deepEqual(loadDraft(store, draftKey(7, 'new')), draft);
  assert.equal(loadDraft(store, draftKey(8, 'new')), null);
  assert.equal(loadDraft(store, draftKey(7, '12')), null);
  clearDraft(store, draftKey(7, 'new'));
  assert.equal(loadDraft(store, draftKey(7, 'new')), null);
  for (const bad of ['{', '"text"', '[]x', '{"clientKey":"k","status":"DRUNK"}', '{"clientKey":"","status":"TASTED"}', '{"clientKey":"k","rating":"5"}', '{"clientKey":"k","serving":"SHOT"}', '{"clientKey":"k","memo":3}']) {
    store.setItem('x', bad); assert.equal(loadDraft(store, 'x'), null, bad);
  }
  // 예전 초안에 없는 칸은 기본값으로 채운다.
  store.setItem('x', '{"clientKey":"k","whiskeyName":"이름"}');
  assert.deepEqual(loadDraft(store, 'x'), emptyDraft('k', '이름'));
  const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
  assert.equal(loadDraft(blocked, 'x'), null); saveDraft(blocked, 'x', draft); clearDraft(blocked, 'x');
});

test('저장한 노트에서 만든 초안은 그 노트와 같다고 본다', () => {
  const entry: TastingEntry = { id: 1, mine: true, bookmarked: false, likeCount: 0, liked: false, status: 'TASTED', source: null, whiskeyName: '이름', whiskeyNameEn: null, tastedOn: null, serving: 'ROCKS',
    memo: null, nose: '바닐라', palate: null, finish: null, rating: 3.5, visibility: 'PRIVATE', publishedAt: null, hidden: false, createdAt: '2026-11-17T00:00:00Z', updatedAt: '2026-11-17T00:00:00Z' };
  const draft = draftFromEntry(entry, 'a');
  assert.equal(draft.memo, ''); assert.equal(draft.nose, '바닐라'); assert.equal(draft.rating, 3.5);
  assert.equal(sameDraft(draft, draftFromEntry(entry, 'b')), true);
  assert.equal(sameDraft(draft, { ...draft, memo: 'x' }), false);
});

test('실패 안내는 할 일을 말하고 서버 원문을 보여 주지 않는다', () => {
  assert.deepEqual(entryFailure(401, null, 'save').needsLogin, true);
  assert.match(entryFailure(401, null, 'save').message, /로그인.*보관/);
  assert.match(entryFailure(null, null, 'save').message, /연결이 끊겼어요.*보관/);
  assert.doesNotMatch(entryFailure(null, null, 'load').message, /보관/);
  assert.match(entryFailure(404, 'ENTRY_NOT_FOUND', 'load').message, /찾지 못했어요/);
  assert.match(entryFailure(429, 'DAILY_CREATE_LIMIT', 'save').message, /내일/);
  assert.match(entryFailure(400, 'INVALID_TASTING_DATE', 'save').message, /오늘까지/);
  assert.match(entryFailure(400, 'SOMETHING_NEW', 'save').message, /저장하지 못했어요/);
  assert.match(entryFailure(500, null, 'delete').message, /지우지 못했어요/);
  // 마실 목록 담기는 쓰던 글을 보관하지 않으므로 보관 안내를 하지 않는다
  for (const status of [null, 401, 500]) assert.doesNotMatch(entryFailure(status, null, 'add').message, /보관|저장/);
  assert.match(entryFailure(500, null, 'add').message, /담지 못했어요/);
  for (const status of [null, 400, 401, 403, 404, 429, 500]) assert.doesNotMatch(entryFailure(status, 'X', 'save').message, /API|Error|fetch|\d{3}/);
});

test('저장·신고 실패 안내는 글이 사라진 경우와 내 글을 구분한다', () => {
  for (const action of ['bookmark', 'report'] as const) assert.match(entryFailure(404, null, action).message, /비공개|지웠/);
  assert.match(entryFailure(400, 'CANNOT_BOOKMARK_OWN', 'bookmark').message, /내가 쓴 글/);
  assert.match(entryFailure(500, null, 'bookmark').message, /저장한 글에 담지 못했어요/);
  assert.match(entryFailure(500, null, 'unbookmark').message, /저장한 글에서 빼지 못했어요/);
  assert.match(entryFailure(500, null, 'report').message, /신고를 보내지 못했어요/);
  for (const status of [null, 401, 500]) assert.doesNotMatch(entryFailure(status, null, 'report').message, /보관/);
  assert.deepEqual(REPORT_REASONS.map((item) => item.key), ['SPAM', 'INAPPROPRIATE', 'COPYRIGHT', 'PERSONAL_INFO', 'OTHER']);
});

test('같은 추천으로 이미 쓴 기록이 있으면 시음 기록에서 열라고 안내한다', () => {
  const failure = entryFailure(409, 'SOURCE_ALREADY_RECORDED', 'save');
  assert.match(failure.message, /이미 있어요/);
  assert.equal(failure.needsLogin, false);
});

test('추천에서 노트를 쓰는 주소는 왕복하고 알 수 없는 값은 새 글로 본다', () => {
  const uuid = '3f2c9a60-6b7e-4f0a-9a43-0d2a7a1c9b11';
  const href = sourceNoteHref({ kind: 'AI_OPERATION', ref: uuid });
  assert.equal(href, `/notes/new?source=AI_OPERATION:${uuid}`);
  assert.deepEqual(parseSource(new URL(href, 'http://x').searchParams.get('source')), { kind: 'AI_OPERATION', ref: uuid });
  assert.deepEqual(parseSource('VERIFIED_RECORD:12'), { kind: 'VERIFIED_RECORD', ref: '12' });
  for (const bad of [null, '', 'PERSONAL:1', 'AI_OPERATION', 'AI_OPERATION:', 'DROP:1', 'AI_OPERATION:' + 'x'.repeat(41)]) assert.equal(parseSource(bad), undefined, String(bad));
  assert.equal(sourceNoteHref({ kind: 'LEGACY_ORDER', ref: 'a b&c' }), '/notes/new?source=LEGACY_ORDER:a%20b%26c');
});

test('좋아요 실패는 이유별 안내 문구를 준다', () => {
  assert.match(entryFailure(429, 'DAILY_LIKE_LIMIT', 'like').message, /좋아요/);
  assert.match(entryFailure(400, 'CANNOT_LIKE_OWN', 'like').message, /내가 쓴 글/);
  assert.match(entryFailure(404, null, 'like').message, /더 이상 볼 수 없어요/);
});
