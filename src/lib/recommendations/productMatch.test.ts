import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCollectedInformation,collectedBottlingFields,collectedLookupMessage,validProductMatch} from './collectedBottlingInformation';
import type {CollectedBottlingInformation} from './collectedBottlingInformation';
const info:CollectedBottlingInformation={status:'NAME_MATCH',checkedAt:'2026-10-26T00:00:00Z',evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED',
  bottlingIdentityConfirmed:false,recordCount:2,datasetBuildId:'a'.repeat(64),availableVolumesMl:[],
  fields:collectedBottlingFields.map(field=>({field,status:'UNKNOWN',value:null,sources:[]})),
  productMatch:{status:'MATCHED',method:'REVIEWED_ALIAS',sourceNames:['Deanston 12 Year Whisky']}};
test('product metadata distinguishes connection from bottling suitability',()=>{
  assert.ok(validProductMatch(info.productMatch));
  assert.ok(collectedLookupMessage(info).includes('연결'));
  assert.ok(collectedLookupMessage({...info,status:'INSUFFICIENT_IDENTITY'}).includes('출시판'));
  assert.ok(collectedLookupMessage({...info,status:'AMBIGUOUS'}).includes('구분'));
  assert.equal(cleanCollectedInformation({...info,productMatch:{...info.productMatch!,sourceNames:['bad\nname']}}).productMatch,undefined);
  assert.deepEqual(cleanCollectedInformation(info).productMatch,info.productMatch);
});
test('candidate metadata never claims a matched name and malformed metadata is isolated',()=>{
  assert.equal(validProductMatch({status:'REVIEW_REQUIRED',method:null,sourceNames:['Deanston']}),false);
  assert.equal(validProductMatch({status:'MATCHED',method:'SIMILARITY',sourceNames:[]}),false);
  assert.equal(validProductMatch({status:'MATCHED',method:'EXACT_NAME',sourceNames:Array(9).fill('x')}),false);
  assert.equal(cleanCollectedInformation({...info,productMatch:null}).productMatch,undefined);
  const candidate={...info,status:'NAME_ONLY' as const,productMatch:{status:'REVIEW_REQUIRED' as const,method:null,reason:'PRODUCT_NAME_REVIEW_REQUIRED',sourceNames:[]},
    fields:info.fields.map(f=>({...f,reason:'PRODUCT_NAME_REVIEW_REQUIRED'}))};
  assert.ok(collectedLookupMessage(candidate).includes('비슷한 이름'));
  assert.ok(!collectedLookupMessage(candidate).includes('연결했어요'));
});
test('a normalized product name is accepted only for a matched optional connection',()=>{
  const match={status:'MATCHED' as const,method:'NORMALIZED_NAME' as const,sourceNames:['Example 16','Example 16 Year Old']};
  assert.ok(validProductMatch(match));
  assert.deepEqual(cleanCollectedInformation({...info,productMatch:match}).productMatch,match);
  assert.equal(validProductMatch({...match,status:'REVIEW_REQUIRED'}),false);
});
