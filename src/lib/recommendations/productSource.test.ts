import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validProductSourceObservations,toAiSuggestion} from './v3Contract';
import type {V3Response} from './v3Contract';
const id='00000000-0000-4000-8000-000000000001';
const presentationFixture:V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',operationId:id,
  appliedLevel:'BEGINNER',recommendedAt:'2026-10-20T00:00:00Z',verification:{atRecommendation:'AI_SUGGESTED',current:'UNVERIFIED'},
  aiSuggestion:{id,identity:{brand:'Authored',expression:'Fixture'},notice:'Fixture',
    presentation:{summary:['직접 작성한 테스트 설명입니다.'],pairings:[]},servingSuggestion:'천천히 즐겨보세요.'}};
const valid={scope:'PRODUCT_PAGE',status:'CURRENT',bottlingIdentityConfirmed:false,
  observedAt:'2026-10-21T00:00:00Z',validUntil:'2026-10-22T00:00:00Z',
  sourceUrl:'https://producer.example/product',publisher:'PRODUCER',fields:[{field:'abv',value:'47',unit:'%'}]};
test('product observations are separate from AI identity and certification',()=>{
  assert.equal(validProductSourceObservations(valid),true);
  const response=JSON.parse(JSON.stringify(presentationFixture));response.aiSuggestion.productSourceObservations=valid;
  const a=toAiSuggestion(response);assert.ok(a?.productSourceObservations);assert.equal(a.identity.abv,undefined);
  assert.equal(response.verification.current,'UNVERIFIED');assert.equal(a.catalogFacts,undefined);
});
test('invalid optional scope is stripped without hiding the saved AI card',()=>{
  for(const patch of [{scope:'BOTTLING'}, {bottlingIdentityConfirmed:true},{sourceUrl:'http://localhost:8080/private'},
    {sourceUrl:'https://producer.example/product?key=secret'},{fields:[{field:'abv',value:'200'}]},
    {fields:[{field:'abv',value:'47'},{field:'abv',value:'50'}]}]){
    const response=JSON.parse(JSON.stringify(presentationFixture));response.aiSuggestion.productSourceObservations={...valid,...patch};
    const a=toAiSuggestion(response);assert.ok(a);assert.equal(a.productSourceObservations,null);
  }
});
