import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveCocktailDraft, takeCocktailDraft } from './cocktailDraft';

const store = new Map<string, string>();
(globalThis as any).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
};

const draft = {
  request: { experienceLevel: 'home_bar' as const, isNonAlcoholic: false, preferredTaste: ['상큼한 (Sour)'], carbonation: true, dislikes: ['민트'], currentMood: '비 오는 날', baseSpirit: '진' },
  customBottle: '',
};

test('저장한 주문서를 한 번만 꺼낸다', () => {
  saveCocktailDraft(draft);
  assert.deepEqual(takeCocktailDraft(), draft);
  assert.equal(takeCocktailDraft(), null);
});

test('형태가 다른 값은 버린다', () => {
  store.set('rw:cocktailDraft', JSON.stringify({ request: { experienceLevel: 'x' } }));
  assert.equal(takeCocktailDraft(), null);
  store.set('rw:cocktailDraft', '{깨진 json');
  assert.equal(takeCocktailDraft(), null);
});

test('탄산 상관없음(null)과 빈 메모도 복원한다', () => {
  const d = { ...draft, request: { ...draft.request, carbonation: null, currentMood: '' } };
  saveCocktailDraft(d);
  assert.deepEqual(takeCocktailDraft(), d);
});
