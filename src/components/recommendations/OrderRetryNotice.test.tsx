import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import OrderRetryNotice, {RETRY_COOLDOWN_SECONDS} from './OrderRetryNotice';

const render=(busy=false,disabled=false)=>renderToStaticMarkup(<OrderRetryNotice seq={1} busy={busy} disabled={disabled} onRetry={()=>{}}/>);

test('says plainly that nothing was spent and the choices are kept',()=>{
 const html=render();
 assert.ok(html.includes('찾지 못했어요'));assert.ok(html.includes('추천 횟수'));assert.ok(html.includes('사용하지 않았어요'));
 assert.ok(html.includes('고른 조건'));assert.ok(html.includes('그대로 남아 있어요'));
});
test('retry starts in cooldown and the countdown is hidden from assistive tech',()=>{
 const html=render();
 assert.ok(/<button[^>]*disabled/.test(html));
 assert.ok(html.includes(`${RETRY_COOLDOWN_SECONDS}초 뒤 가능`));
 assert.ok(/aria-hidden="true"[^>]*>\d+초 뒤 가능/.test(html));
 assert.equal((html.match(/role="status"/g)??[]).length,1);
});
test('busy shows progress text without a countdown',()=>{
 const html=render(true);
 assert.ok(html.includes('주문을 살펴보고 있어요'));assert.ok(!html.includes('초 뒤 가능'));
});
