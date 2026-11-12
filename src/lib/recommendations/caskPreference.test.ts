import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caskPreferenceNote } from './caskPreference';

test('확인된 통 값이 없으면 일치 여부를 단정하지 않고 "아직 정보가 없어요"라고 한다', () => {
  const text = caskPreferenceNote('숙성 통', 'SHERRY', undefined);
  assert.ok(text?.includes('아직 정보가 없어요'));
  assert.ok(!text?.includes('맞'));
});

test('확인된 값이 선호와 같으면 문장을 만들지 않고, 다르면 확인된 값만 보여 준다', () => {
  assert.equal(caskPreferenceNote('숙성 통', 'SHERRY', { value: 'Sherry (셰리)', raw: 'SHERRY' }), null);
  const other = caskPreferenceNote('숙성 통', 'SHERRY', { value: 'Bourbon (버번)', raw: 'BOURBON' });
  assert.ok(other?.includes('Bourbon (버번)'));
  assert.ok(other?.includes('Sherry (셰리)'));
});
