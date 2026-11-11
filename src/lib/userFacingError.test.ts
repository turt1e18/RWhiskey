import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiResponseError } from '@/api/apiClient';
import { loginErrorMessage, recommendationErrorMessage } from './userFacingError';

const api = (status: number, message = 'x') => new ApiResponseError(status, {}, message);

test('로그인 오류는 원인별로 다르게 안내한다', () => {
  assert.match(loginErrorMessage(api(401)), /올바르지 않아요/);
  assert.match(loginErrorMessage(api(429)), /너무 많아요/);
  assert.match(loginErrorMessage(api(403)), /새로고침/);
  assert.match(loginErrorMessage(api(500)), /로그인할 수 없어요/);
  assert.match(loginErrorMessage(new TypeError('Failed to fetch')), /연결하지 못했어요/);
});

test('추천 오류는 원문을 숨기고 한국어 안내만 통과시킨다', () => {
  assert.equal(recommendationErrorMessage(new TypeError('Failed to fetch')).includes('fetch'), false);
  assert.equal(recommendationErrorMessage(api(500, 'API Error: 500')).includes('API Error'), false);
  assert.equal(recommendationErrorMessage(new Error('Daily limit reached')).includes('Daily'), false);
  assert.equal(recommendationErrorMessage(new Error('오늘 사용할 수 있는 추천 횟수를 모두 사용했어요.')), '오늘 사용할 수 있는 추천 횟수를 모두 사용했어요.');
  assert.match(recommendationErrorMessage(api(401)), /로그인이 필요해요/);
  assert.match(recommendationErrorMessage(api(429)), /너무 잦아요/);
});
