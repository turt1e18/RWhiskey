import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cocktailImageQuery } from './cocktailImageQuery';

test('영어 이름 > 괄호 안 영문 > 한글 이름 순으로 검색어를 만든다', () => {
  assert.equal(cocktailImageQuery('톰 콜린스', 'Tom Collins'), 'Tom Collins cocktail');
  assert.equal(cocktailImageQuery('김렛 (Gimlet)'), 'Gimlet cocktail');
  assert.equal(cocktailImageQuery('톰 콜린스', ' '), 'cocktail 톰 콜린스');
  assert.equal(cocktailImageQuery('Dark \'n\' Stormy'), 'cocktail Dark \'n\' Stormy');
});
