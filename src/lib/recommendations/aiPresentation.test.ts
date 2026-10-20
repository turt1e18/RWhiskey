import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aiKoreanName } from './aiPresentation';
import { toAiSuggestion } from './v3Contract';
import type { V3Response } from './v3Contract';

const id='00000000-0000-4000-8000-000000000001';
export const presentationFixture:V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',operationId:id,
  appliedLevel:'BEGINNER',recommendedAt:'2026-10-20T00:00:00Z',verification:{atRecommendation:'AI_SUGGESTED',current:'UNVERIFIED'},
  aiSuggestion:{id,identity:{brand:'Woodford Reserve',expression:"Distiller's Select"},notice:'REMOVED_LONG_NOTICE',
    localizedName:'우드포드 리저브 디스틸러스 셀렉트',presentation:{summary:['고르신 풍미를 살펴보실 한 잔으로 준비했어요.'],pairings:[]},
    servingSuggestion:'천천히 향을 비교하며 한 모금씩 즐겨보세요.',
    presentationSource:{kind:'MODEL',provider:'GEMINI',model:'gemini-3.8-flash',promptVersion:'AI_BARTENDER_V1',status:'GENERATED'}}};
test('old saved bottle gets a display alias without changing canonical identity',()=>{
  const identity={brand:'The Balvenie',expression:'DoubleWood 12 Year Old'};
  const before=JSON.stringify(identity);
  assert.equal(aiKoreanName(identity),'발베니 더블우드 12년');assert.equal(JSON.stringify(identity),before);
  assert.equal(aiKoreanName({brand:'Unknown',expression:'Untranslated'}),null);
});
test('model localized name wins over an old alias and remains optional',()=>{
  assert.equal(aiKoreanName(presentationFixture.aiSuggestion!.identity,'다른 한국어 표기'),'다른 한국어 표기');
  assert.equal(toAiSuggestion(presentationFixture)?.localizedName,'우드포드 리저브 디스틸러스 셀렉트');
  assert.notEqual(toAiSuggestion({...presentationFixture,aiSuggestion:{...presentationFixture.aiSuggestion!,localizedName:null,presentationSource:null}}),null);
});
test('unsafe localized name and forged model source do not become a result card',()=>{
  const a=presentationFixture.aiSuggestion!;
  for(const localizedName of ['漢字위스키','<가짜>','x'.repeat(141)]) assert.equal(toAiSuggestion({...presentationFixture,aiSuggestion:{...a,localizedName}}),null);
  assert.equal(toAiSuggestion({...presentationFixture,aiSuggestion:{...a,presentationSource:{kind:'MODEL',status:'GENERATED'}}}),null);
  assert.equal(toAiSuggestion({...presentationFixture,aiSuggestion:{...a,presentationSource:{...a.presentationSource!,model:'https://example.invalid'}}}),null);
});
test('server filtered model explanation remains a model result with complete provenance',()=>{
  const a=presentationFixture.aiSuggestion!;
  assert.equal(toAiSuggestion({...presentationFixture,aiSuggestion:{...a,presentationSource:{...a.presentationSource!,status:'GENERATED_FILTERED'}}})?.presentationSource?.status,'GENERATED_FILTERED');
  assert.equal(toAiSuggestion({...presentationFixture,aiSuggestion:{...a,presentationSource:{...a.presentationSource!,status:'UNAVAILABLE'}}}),null);
});
