import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getWhiskyRecommendation } from './recommendationService';

const TOKEN = '11111111-2222-3333-4444-555555555555';
const AI = { whiskyName: 'a', whiskyNameEn: 'b', classification: 'c', regionName: 'd', styleName: 'e', featureTags: [], foodName: 'f', pairingNote: 'g', bartenderWord: 'h' };
const INPUT = { flexFlag: false, weatherValue: '맑음', moodValue: '차분' };

async function run(saveStatus: number) {
  const calls: { url: string; method: string; token: string | null }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    const u = String(url); const headers = new Headers(options?.headers);
    calls.push({ url: u, method: options?.method ?? 'GET', token: headers.get('X-Settlement-Token') });
    if (u === '/api/gemini') return new Response(JSON.stringify(AI), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Settlement-Token': TOKEN } });
    if (u.endsWith('/api/recommendations')) return new Response(saveStatus === 200 ? '7' : '{}', { status: saveStatus, headers: { 'Content-Type': 'application/json' } });
    return new Response(null, { status: 204 });
  };
  const originalError = console.error; console.error = () => {};
  try { return { calls, result: await getWhiskyRecommendation(INPUT).then(() => 'ok', () => 'failed') }; }
  finally { globalThis.fetch = original; console.error = originalError; }
}

test('저장은 정산 표를 싣고, 성공하면 환불을 요청하지 않는다', async () => {
  const { calls, result } = await run(200);
  assert.equal(result, 'ok');
  assert.equal(calls.find((c) => c.url.endsWith('/api/recommendations'))?.token, TOKEN);
  assert.equal(calls.some((c) => c.method === 'DELETE'), false);
});

test('저장이 실패하면 같은 표로 환불을 요청한다', async () => {
  const { calls, result } = await run(500);
  assert.equal(result, 'failed');
  const refund = calls.find((c) => c.method === 'DELETE');
  assert.ok(refund?.url.includes(`/api/recommendations/legacy/admission/${TOKEN}?refund=true`));
});
