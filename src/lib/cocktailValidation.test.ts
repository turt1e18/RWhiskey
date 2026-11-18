import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cocktailMismatch } from './cocktailValidation';

const ok = { cocktailName: '진 피즈', abv: '약 8%', checkList: ['진 45ml', '레몬즙 20ml'], method: ['흔든다'] };

test('조건에 맞으면 통과한다', () => {
  assert.equal(cocktailMismatch(ok, { experienceLevel: 'home_bar', isNonAlcoholic: false, dislikes: ['민트'] }), null);
});
test('기피 재료가 재료 목록이나 이름에 있으면 거른다', () => {
  assert.equal(cocktailMismatch({ ...ok, checkList: ['진', '민트 잎 8장'] }, { dislikes: ['민트'] }), 'dislike');
  assert.equal(cocktailMismatch({ ...ok, cocktailName: '모히토 민트' }, { dislikes: [' 민트 '] }), 'dislike');
});
test('무알콜인데 도수가 있으면 거른다', () => {
  assert.equal(cocktailMismatch({ ...ok, abv: '약 5%' }, { isNonAlcoholic: true }), 'alcohol');
  assert.equal(cocktailMismatch({ ...ok, abv: '0%' }, { isNonAlcoholic: true }), null);
  assert.equal(cocktailMismatch({ ...ok, abv: '무알콜' }, { isNonAlcoholic: true }), null);
});
test('홈바는 재료와 조주법이 비면 거른다', () => {
  assert.equal(cocktailMismatch({ ...ok, method: [] }, { experienceLevel: 'home_bar' }), 'recipe');
  assert.equal(cocktailMismatch({ ...ok, checkList: [] }, { experienceLevel: 'beginner' }), null);
});
test('이름이 없으면 거른다', () => {
  assert.equal(cocktailMismatch({ ...ok, cocktailName: ' ' }, {}), 'name');
  assert.equal(cocktailMismatch(null, {}), 'name');
});
