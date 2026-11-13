import test from 'node:test';
import assert from 'node:assert/strict';
import {orderNoticeKind} from './orderNotice';

test('only notices that need an action become a modal',()=>{
  assert.equal(orderNoticeKind('AUTH_REQUIRED',false),'AUTH');
  assert.equal(orderNoticeKind(null,true),'AUTH');
  assert.equal(orderNoticeKind('DAILY_LIMITED',false),'DAILY_LIMITED');
  for(const code of ['RECOVER','RESULT_SAVE_UNCONFIRMED','RECOMMENDATION_BUSY','RESULT_UNCONFIRMED'])assert.equal(orderNoticeKind(code,false),'RECOVER',code);
  for(const code of ['V3_DISABLED','AI_SUGGESTION_DISABLED','DISCOVERY_PROVIDER_TIMEOUT','DISCOVERY_PROVIDER_UNAVAILABLE','RATE_LIMITED','HISTORICAL_EVIDENCE_NOT_CURRENT',null])
    assert.equal(orderNoticeKind(code,false),null,String(code));
});
