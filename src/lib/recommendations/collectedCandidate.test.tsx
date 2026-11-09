import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {validCandidateOrigin,collectedBodyHidden,sourceReadFailure,collectedRecoveryId} from './collectedCandidate';
import type {CollectedCandidateOrigin} from './collectedCandidate';
import {toAiSuggestion} from './v3Contract';
import type {V3Response} from './v3Contract';
import {card,collected} from './whiskeyResultInformation.fixtures';
import {whiskeyResultInformation,refreshResultInformation} from './whiskeyResultInformation';
import WhiskeyAiSuggestionCard from '@/components/recommendations/WhiskeyAiSuggestionCard';
const now=Date.now();
const origin:CollectedCandidateOrigin={kind:'COLLECTED_REFERENCE',buildId:'a'.repeat(64),recordIds:['REC-'+'b'.repeat(64)],
  usageScope:'PUBLIC',observedFields:['brand','expression','abv','age'],checkedAt:new Date(now).toISOString(),validUntil:new Date(now+900000).toISOString()};
const sourceCard={...card,candidateOrigin:origin,reasons:['COLLECTED_CANDIDATE'],collectedBottlingInformation:{...collected,usageScope:'PUBLIC' as const}};
const response:V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',operationId:card.id,recommendedAt:new Date(now).toISOString(),
  appliedLevel:'BEGINNER',verification:{atRecommendation:'AI_SUGGESTED',current:'UNVERIFIED'},aiSuggestion:sourceCard};
test('source selection carries a strict access origin and never becomes an optional AI fallback',()=>{
  assert.ok(validCandidateOrigin(origin));assert.ok(toAiSuggestion(response));
  for(const candidateOrigin of [null,{...origin,buildId:'bad'},{...origin,recordIds:[]},{...origin,observedFields:['abv']},
    {...origin,validUntil:new Date(now+900001).toISOString()}]){
    assert.equal(toAiSuggestion({...response,aiSuggestion:{...sourceCard,candidateOrigin}} as V3Response),null);
  }
  assert.equal(toAiSuggestion({...response,aiSuggestion:{...sourceCard,collectedBottlingInformation:null}}),null);
  assert.equal(toAiSuggestion({...response,aiSuggestion:{...sourceCard,collectedBottlingInformation:{...collected,usageScope:'LOCAL_REFERENCE'}}}),null);
  assert.ok(toAiSuggestion({...response,aiSuggestion:card}));
});
test('source basics are observations or missing and never labelled AI estimates',()=>{
  const display=whiskeyResultInformation(sourceCard,now);
  assert.deepEqual(display.basic.map(f=>f.kind),['MISSING','MISSING','KNOWN','KNOWN']);
  assert.equal(display.basic[2].value,'46.3%');
  assert.ok(!collectedBodyHidden(sourceCard,now));assert.ok(collectedBodyHidden(sourceCard,now+900001));
  const expired=whiskeyResultInformation(sourceCard,now+900001);
  assert.ok(expired.basic.every(f=>f.kind==='HELD'));assert.deepEqual(expired.bottling,[]);assert.deepEqual(expired.volumes,[]);
});
test('explicit withdrawal differs from transient failure and renewal preserves original introduction',()=>{
  assert.equal(sourceReadFailure({...response,state:'NEEDS_REVIEW',code:'COLLECTED_SOURCE_RESTRICTED',aiSuggestion:null}),'RESTRICTED');
  assert.equal(sourceReadFailure({...response,state:'UNAVAILABLE',code:'COLLECTED_SOURCE_UNAVAILABLE',aiSuggestion:null}),'TEMPORARY');
  const next={...sourceCard,candidateOrigin:{...origin,checkedAt:new Date(now+1000).toISOString(),validUntil:new Date(now+901000).toISOString()},
    presentation:{summary:['Changed text must not replace the saved prose'],pairings:[]}};
  const result=refreshResultInformation(sourceCard,next);
  assert.deepEqual(result.card.presentation,sourceCard.presentation);assert.equal(result.card.candidateOrigin,next.candidateOrigin);
  assert.equal(result.changed,false);
});
test('expired result cannot expose identity or feedback before its original owner is confirmed',()=>{
  const expired={...response,aiSuggestion:{...sourceCard,candidateOrigin:{...origin,checkedAt:new Date(now-901000).toISOString(),validUntil:new Date(now-1000).toISOString()}}};
  const html=renderToStaticMarkup(<WhiskeyAiSuggestionCard response={expired} ownerUid={null}/>);
  assert.ok(html.includes('저장한 추천을 확인할 수 없어요'));assert.ok(html.includes('새 탭에서 다시 로그인'));
  for(const text of ['Deanston','저장한 추천 소개예요.','<img','병입 정보 더보기'])assert.ok(!html.includes(text),text);
});
test('read restrictions link to the same owned record and never invent a new recommendation',()=>{
  for(const code of ['COLLECTED_SOURCE_RESTRICTED','COLLECTED_SOURCE_UNAVAILABLE']){
    assert.equal(collectedRecoveryId({...response,state:'NEEDS_REVIEW',code,aiSuggestion:null}),card.id);
    assert.equal(collectedRecoveryId({...response,code,operationId:'../other'}),null);
  }
  assert.equal(collectedRecoveryId(response),null);
});
