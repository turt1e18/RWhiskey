import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectedBottlingFields,validCollectedBottlingInformation} from './collectedBottlingInformation';
import type {CollectedBottlingInformation} from './collectedBottlingInformation';
import {toAiSuggestion,toVerifiedCard} from './v3Contract';
import type {V3Response} from './v3Contract';
const info:CollectedBottlingInformation={status:'NAME_MATCH',checkedAt:'2026-10-23T00:00:00Z',
  evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED',bottlingIdentityConfirmed:false,datasetBuildId:'a'.repeat(64),recordCount:1,
  availableVolumesMl:[700,750],fields:collectedBottlingFields.map(field=>({field,status:'UNKNOWN',value:null,sources:[]}))};
info.fields[0]={field:'maturationCask',status:'OBSERVED',value:'Bourbon; Sherry',sources:[{url:'https://producer.example/product'}]};
const id='00000000-0000-4000-8000-000000000001';
const response:V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',operationId:id,appliedLevel:'BEGINNER',
  recommendedAt:'2026-10-23T00:00:00Z',verification:{atRecommendation:'AI_SUGGESTED',current:'UNVERIFIED'},
  aiSuggestion:{id,identity:{brand:'Balvenie',expression:'DoubleWood 12'},presentation:{summary:['Fixture'],pairings:[]},notice:'Fixture',
    collectedBottlingInformation:info}};
test('nine partitioned fields remain separate from model identity and verified facts',()=>{
  assert.equal(validCollectedBottlingInformation(info),true);
  const card=toAiSuggestion(response);assert.deepEqual(card?.collectedBottlingInformation,info);
  assert.equal(card?.identity.maturationCask,undefined);assert.equal(card?.catalogFacts,undefined);
  assert.equal(toVerifiedCard(response),null);
});
test('every non-match state is displayable only with unknown values',()=>{
  for(const status of ['NAME_ONLY','NO_MATCH','AMBIGUOUS','INSUFFICIENT_IDENTITY','UNAVAILABLE'] as const){
    const unknown={...info,status,availableVolumesMl:[],fields:info.fields.map(f=>({...f,status:'UNKNOWN',value:null,sources:[]}))};
    assert.equal(validCollectedBottlingInformation(unknown),true);
    assert.equal(validCollectedBottlingInformation({...unknown,fields:info.fields}),false);
  }
});
test('malformed sidecars are discarded while preserving the original saved recommendation',()=>{
  for(const patch of [{bottlingIdentityConfirmed:true},{recordCount:0},{datasetBuildId:null},{recordCount:65},
    {evidenceStatus:'VERIFIED'},{availableVolumesMl:[700,700]},{fields:info.fields.slice(1)},
    {fields:[info.fields[0],...info.fields.slice(1).map(()=>info.fields[0])]},
    ...['javascript:alert(1)','https://127.0.0.1/a','https://a.internal/a','https://producer.example/a?token=secret']
      .map(url=>({fields:[{...info.fields[0],sources:[{url}]},...info.fields.slice(1)]}))]){
    const bad={...info,...patch};assert.equal(validCollectedBottlingInformation(bad),false);
    const card=toAiSuggestion({...response,aiSuggestion:{...response.aiSuggestion!,collectedBottlingInformation:bad}} as V3Response);
    assert.equal(card?.id,id);assert.equal(card?.collectedBottlingInformation,null);
  }
});
