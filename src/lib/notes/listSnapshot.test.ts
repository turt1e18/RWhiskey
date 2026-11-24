import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SNAPSHOT_TTL_MS, loadSnapshot, markDeparture, clearSnapshots, resolveRestore, saveSnapshot, takeDeparture, withLike } from './listSnapshot';

const memory = () => { const data = new Map<string, string>(); return {
  getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key), data }; };

test('저장한 목록은 제한 시간 안에서만 되살린다', () => {
  const store = memory();
  saveSnapshot(store, 'k', { items: [{ id: 1 }, { id: 2 }], next: 'c' }, 1000);
  assert.deepEqual(loadSnapshot(store, 'k', 1000 + SNAPSHOT_TTL_MS - 1)?.items, [{ id: 1 }, { id: 2 }]);
  assert.equal(loadSnapshot(store, 'k', 1000 + SNAPSHOT_TTL_MS), null);
  assert.equal(store.data.has('k'), false); // 만료된 값은 지운다
});

test('손상됐거나 비어 있는 값은 쓰지 않는다', () => {
  const store = memory();
  for (const bad of ['{', 'null', '[]', '{"items":[],"next":null,"savedAt":1}', '{"items":[1],"next":3,"savedAt":1}', '{"items":[1],"next":null}', '{"items":[1],"next":null,"savedAt":9999999999999}']) {
    store.setItem('k', bad); assert.equal(loadSnapshot(store, 'k', 1000), null, bad);
  }
  assert.equal(loadSnapshot(store, 'none', 1000), null);
});

test('저장소가 막혀 있어도 던지지 않는다', () => {
  const blocked = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); }, removeItem: () => { throw new Error('denied'); } };
  saveSnapshot(blocked, 'k', { items: [1], next: null }); markDeparture(blocked, 'd', { id: 1, panel: 0, win: 0 });
  assert.equal(loadSnapshot(blocked, 'k'), null); assert.equal(takeDeparture(blocked, 'd'), null);
});

test('나간 표시는 한 번만 읽힌다', () => {
  const store = memory();
  markDeparture(store, 'd', { id: 7, panel: 1500, win: 0 });
  assert.deepEqual(takeDeparture(store, 'd'), { id: 7, panel: 1500, win: 0 });
  assert.equal(takeDeparture(store, 'd'), null);
  store.setItem('d', '{"id":"x","panel":1,"win":1}'); assert.equal(takeDeparture(store, 'd'), null);
});

test('나간 표시와 살아 있는 보관본이 모두 있을 때만 되살린다', () => {
  const store = memory();
  saveSnapshot(store, 'k', { items: [{ id: 1 }], next: null }, 1000);
  assert.equal(resolveRestore(store, 'k', 1000), null); // 그냥 들어온 경우: 표시 없음
  markDeparture(store, 'k:out', { id: 1, panel: 300, win: 0 });
  assert.deepEqual(resolveRestore(store, 'k', 1000)?.out, { id: 1, panel: 300, win: 0 });
  assert.equal(resolveRestore(store, 'k', 1000), null); // 표시는 한 번만 쓰인다
});

test('보관본이 없거나 만료됐으면 표시가 있어도 되살리지 않고 표시는 지운다', () => {
  const store = memory();
  markDeparture(store, 'k:out', { id: 1, panel: 0, win: 0 });
  assert.equal(resolveRestore(store, 'k', 1000), null);
  assert.equal(store.data.has('k:out'), false);
  saveSnapshot(store, 'k', { items: [{ id: 1 }], next: null }, 1000);
  markDeparture(store, 'k:out', { id: 1, panel: 0, win: 0 });
  assert.equal(resolveRestore(store, 'k', 1000 + SNAPSHOT_TTL_MS), null);
});

test('좋아요를 누르면 그 글만 바뀌고 수는 0 아래로 내려가지 않는다', () => {
  const items = [{ id: 1, liked: false, likeCount: 2 }, { id: 2, liked: true, likeCount: 0 }];
  assert.deepEqual(withLike(items, 1, true), [{ id: 1, liked: true, likeCount: 3 }, items[1]]);
  assert.deepEqual(withLike(items, 2, false), [items[0], { id: 2, liked: false, likeCount: 0 }]);
  assert.equal(withLike(items, 9, true)[0], items[0]);
});

test('로그아웃하면 목록 보관본과 나간 표시만 지운다', () => {
  const store = memory(); const keys = () => [...store.data.keys()];
  for (const k of ['lounge:1:latest', 'lounge:1:latest:out', 'entries:1:ALL', 'rw:lastPath']) store.setItem(k, '1');
  clearSnapshots({ get length() { return keys().length; }, key: (i: number) => keys()[i] ?? null, removeItem: store.removeItem });
  assert.deepEqual(keys(), ['rw:lastPath']);
});
