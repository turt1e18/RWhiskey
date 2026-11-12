import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayExpression } from './aiPresentation';

test('제품명 끝의 용량 표기만 화면에서 지운다', () => {
  assert.equal(displayExpression('12 Year Old — 50ml'), '12 Year Old');
  assert.equal(displayExpression('Special Reserve - 700 ML'), 'Special Reserve');
  assert.equal(displayExpression('Cask Strength – 0.7l'), 'Cask Strength');
  assert.equal(displayExpression('18 Year Old'), '18 Year Old');
  assert.equal(displayExpression('Triple Cask 50ml Edition'), 'Triple Cask 50ml Edition');
  assert.equal(displayExpression('— 50ml'), '— 50ml');
});
