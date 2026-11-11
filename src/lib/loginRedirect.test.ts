import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeReturnPath } from './loginRedirect';

test('같은 사이트의 앱 경로만 돌아갈 곳으로 허용한다', () => {
  for (const ok of ['/notes', '/mood/verified', '/cocktail', '/notes/verified/12']) assert.equal(isSafeReturnPath(ok), true, ok);
  for (const bad of ['//evil.test', 'https://evil.test', '/login', '/login?x=1', '/api/user', 'notes', '/a b', String.raw`/\evil`]) assert.equal(isSafeReturnPath(bad), false, bad);
});
