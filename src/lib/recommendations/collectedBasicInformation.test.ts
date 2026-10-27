import test from 'node:test';
import assert from 'node:assert/strict';
import {collectedBasicFields,validCollectedBasicFields,cleanCollectedInformation,collectedBottlingFields,validCollectedBottlingInformation,collectedLookupMessage} from './collectedBottlingInformation';
import type {CollectedBottlingInformation,CollectedBasicField} from './collectedBottlingInformation';
const fields:CollectedBasicField[]=collectedBasicFields.map(field=>({field,status:'UNKNOWN',value:null,sources:[]}));
const info:CollectedBottlingInformation={status:'NAME_MATCH',checkedAt:'2026-10-25T00:00:00Z',evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED',
  bottlingIdentityConfirmed:false,datasetBuildId:'a'.repeat(64),recordCount:1,availableVolumesMl:[],
  fields:collectedBottlingFields.map(field=>({field,status:'UNKNOWN',value:null,sources:[]}))};
test('optional basic facts keep numeric meaning and safe cited sources',()=>{
  const withAbv=fields.map(f=>f.field==='abv'?{...f,status:'OBSERVED' as const,value:'46.3',sources:[{url:'https://producer.example/product',attribution:'Publisher',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}]}:f);
  assert.ok(validCollectedBasicFields(withAbv,'NAME_MATCH'));
  assert.equal(validCollectedBasicFields(withAbv,'NAME_ONLY'),false);
  assert.equal(validCollectedBasicFields(withAbv.map(f=>f.field==='abv'?{...f,value:'101'}:f),'NAME_MATCH'),false);
  assert.equal(validCollectedBasicFields(withAbv.map(f=>f.field==='abv'?{...f,sources:[{url:'javascript:alert(1)'}]}:f),'NAME_MATCH'),false);
});
test('damaged enhancement is isolated and older responses are preserved',()=>{
  assert.equal(cleanCollectedInformation(info),info);
  const cleaned=cleanCollectedInformation({...info,basicFields:fields.slice(1)});
  assert.equal(cleaned.basicFields,undefined);assert.deepEqual(cleaned.fields,info.fields);
  assert.deepEqual(cleanCollectedInformation({...info,basicFields:fields,usageScope:'LOCAL_REFERENCE'}).basicFields,fields);
});
test('invalid use scope is rejected and translated names stay candidates in refresh messages',()=>{
  assert.equal(validCollectedBottlingInformation({...info,usageScope:'UNREVIEWED'}),false);
  assert.equal(validCollectedBottlingInformation({...info,usageScope:null}),false);
  const translated={...info,status:'NAME_ONLY' as const,fields:info.fields.map(f=>({...f,reason:'TRANSLATED_NAME_REVIEW_REQUIRED'}))};
  assert.ok(collectedLookupMessage(translated).includes('후보'));
  assert.ok(!collectedLookupMessage(translated).includes('제품명은 찾았어요'));
});
