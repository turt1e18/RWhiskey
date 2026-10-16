import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toV3Request, toVerifiedCard, isV3Response } from './v3Contract';
import type { V3Response } from './v3Contract';

for (const level of ['BEGINNER','INTERMEDIATE','ADVANCED'] as const) {
  test(`${level}: explicit preferences and hard values preserved`,()=>{
    const r=toV3Request({experienceLevel:level,requirements:{country:'Scotland',minAbv:40,maxAbv:55},
      aromaPreferences:['WOODY_SPICY'],smokePreference:'AVOID',context:{targetAbv:46},includeIndependentBottlings:level==='ADVANCED',includeOldBottles:level==='ADVANCED'});
    assert.equal(r.experienceLevel,level);assert.equal(r.hardConditions.minAbv,40);assert.equal(r.hardConditions.maxAbv,55);
    assert.equal(r.hardConditions.country,'Scotland');assert.equal(r.preferences.smoke,'AVOID');
    assert.deepEqual(r.preferences.aromas,['WOODY_SPICY']);assert.equal(r.preferences.targetAbv,46);
    assert.equal(r.includeOldBottles,level==='ADVANCED');assert.equal(r.includeIndependentBottlings,level==='ADVANCED');
  });
}
test('unsupported older conditions cannot silently disappear',()=>{
  assert.throws(()=>toV3Request({requirements:{excludedBottlingIds:[1]}}));
  assert.throws(()=>toV3Request({context:{additionalContext:'private free text'}}));
  assert.throws(()=>toV3Request({preferredFlavor:'SWEET'}));
});
test('unknowns stay unknown and discovery is not a saved recommendation',()=>{
  assert.equal(toV3Request({}).preferences.smoke,'UNKNOWN');
  assert.equal(isV3Response({apiVersion:'V3',state:'CANDIDATES_DISCOVERED',nextAction:'NONE'}),false);
});
const fixture: V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',recommendationId:13,
  selected:{productId:1,bottlingId:2,displayName:'Self authored fixture',category:null,country:null,region:null,edition:null,
    abv:43,volumeMl:null,ageStatementType:'UNKNOWN',ageYears:null,verificationBasis:'PRIMARY',verificationPolicy:'PRIMARY_V1'},
  presentation:{summary:['A stored explanation'],pairings:[]},evidenceUrl:'https://example.invalid/fixture',
  verification:{atRecommendation:'V3_CERTIFIED',current:'CURRENT',certificateId:'fixture-certificate',policyVersion:'fixture'},
  recommendedAt:'2026-10-15T01:00:00Z'};
test('only saved currently verified success becomes a result card',()=>{
  assert.equal(toVerifiedCard(fixture)?.recommendationId,13);
  assert.equal(toVerifiedCard({...fixture,recommendationId:null}),null);
  assert.equal(toVerifiedCard({...fixture,state:'NEEDS_REVIEW'}),null);
  assert.equal(toVerifiedCard({...fixture,verification:{...fixture.verification!,current:'REVOKED'}}),null);
  assert.equal(toVerifiedCard({...fixture,recommendedAt:'invalid'}),null);
});
