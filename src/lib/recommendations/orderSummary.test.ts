import test from 'node:test';
import assert from 'node:assert/strict';
import {orderSummaryChips,receiptDate} from './orderSummary';
import type {V3Request} from './v3Contract';

const base:V3Request={experienceLevel:'BEGINNER',hardConditions:{},
  preferences:{aromas:[],taste:'UNKNOWN',body:'UNKNOWN',smoke:'UNKNOWN'},
  explorationIntent:'BALANCED',includeIndependentBottlings:false,includeOldBottles:false};

test('an order without conditions says so instead of inventing preferences',()=>{
  assert.deepEqual(orderSummaryChips(base),['초심자','조건 없이 주문']);
  assert.deepEqual(orderSummaryChips(null),[]);
});
test('smoke and aromas use the order form wording, other conditions are counted',()=>{
  const chips=orderSummaryChips({...base,experienceLevel:'ADVANCED',
    hardConditions:{country:'Scotland',excludedBottlingIds:[1,2]},
    preferences:{...base.preferences,smoke:'MILD',aromas:['VANILLA_CARAMEL','DRIED_FRUIT'],taste:'SWEET',targetAbv:46},
    includeOldBottles:true});
  assert.deepEqual(chips,['상급','연기 향 은은하게','바닐라·캐러멜','건포도·말린 과일','그 외 조건 4개']);
});
test('receipt date is shown only for a valid timestamp',()=>{
  assert.equal(receiptDate('2026-11-13T03:10:00'),'2026/11/13');
  assert.equal(receiptDate(null),null);
  assert.equal(receiptDate('not-a-date'),null);
});
