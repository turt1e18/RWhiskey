import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bilingualLabel} from '../../components/recommendations/whiskeyPresentation';
import {bottlingRows,caskDisplay} from './bottlingDisplay';
import {collectedBottlingFields,validCollectedBottlingInformation} from './collectedBottlingInformation';
import {bartenderPresentation,servingSteps} from './bartenderPresentation';
import type {CollectedBottlingInformation} from './collectedBottlingInformation';
const info:CollectedBottlingInformation={status:'NAME_MATCH',checkedAt:'2026-10-23T00:00:00Z',evidenceStatus:'SOURCE_OBSERVATION_UNVERIFIED',
  bottlingIdentityConfirmed:false,datasetBuildId:'a'.repeat(64),recordCount:1,availableVolumesMl:[],
  fields:collectedBottlingFields.map(field=>({field,status:'UNKNOWN',value:null,sources:[]}))};
test('result enums are readable English and Korean without changing stored identity',()=>{
  const p={category:'SINGLE_MALT',country:'UNITED_STATES'};const before=JSON.stringify(p);
  assert.equal(bilingualLabel('category',p.category,null),'Single Malt (싱글 몰트)');
  assert.equal(bilingualLabel('country',p.country,null),'United States (미국)');
  assert.equal(bilingualLabel('category','Single Malt Scotch Whisky',null),'Single Malt Scotch Whisky (싱글 몰트 스카치)');
  assert.equal(bilingualLabel('country','SCOTLAND',null),'Scotland (스코틀랜드)');
  assert.equal(bilingualLabel('category','UNKNOWN',null),null);
  assert.equal(caskDisplay('VIRGIN_OAK'),'Virgin Oak (새 오크 통)');
  assert.equal(JSON.stringify(p),before);
});
test('one bottling field prefers source evidence while model-only values stay unknown references',()=>{
  const data={...info,fields:[{...info.fields[0],status:'OBSERVED' as const,value:'Bourbon',sources:[{url:'https://producer.example/product'}]},...info.fields.slice(1)]};
  const rows=bottlingRows(data,{brand:'Fixture',expression:'One',maturationCask:'SHERRY',finishCask:'PORT'});
  assert.equal(rows[0].value,'Bourbon');assert.equal(rows[0].reference,null);
  assert.equal(rows[1].value,'미확인');assert.equal(rows[1].reference,'Port (포트)');
  const held={...info,fields:[{...info.fields[0],reason:'CONFLICTING_OBSERVATIONS'},...info.fields.slice(1)]};
  assert.equal(bottlingRows(held,{brand:'Fixture',expression:'One',maturationCask:'SHERRY'})[0].reference,null);
});
test('name-only means DB name found but never provides fabricated bottling facts or volume',()=>{
  const data={...info,status:'NAME_ONLY' as const};assert.equal(validCollectedBottlingInformation(data),true);
  assert.equal(validCollectedBottlingInformation({...data,availableVolumesMl:[700]}),false);
  assert.equal(bottlingRows(data).length,9);assert.ok(bottlingRows(data).every(f=>f.value==='미확인'));
  const named={...data,fields:data.fields.map(f=>({...f,reason:'PRODUCT_FIELDS_NOT_COLLECTED'}))};
  assert.equal(bottlingRows(named,{brand:'Fixture',expression:'One',maturationCask:'SHERRY'})[0].reference,'Sherry (셰리)');
});
test('saved short explanations and drinking advice share one introduction with a food line',()=>{
  const summary=['오늘의 취향을 떠올리며 한 잔을 골라드렸어요.'];const original=JSON.stringify(summary);
  const view=bartenderPresentation(summary,'물 한 모금과 함께 천천히 향을 살펴보세요.');
  assert.equal(view.introduction.length,2);assert.match(view.food,/크래커/);assert.equal(view.foodSuggested,false);assert.equal(JSON.stringify(summary),original);
  assert.equal(bartenderPresentation(summary,'다크초콜릿을 조금 곁들여보세요.').foodSuggested,true);
  assert.equal(bartenderPresentation(summary,'다크초콜릿을 조금 곁들여보세요.').food,'다크초콜릿을 조금 곁들여보세요.');
  assert.equal(bartenderPresentation(summary,'배 한 조각을 곁들여 보세요.').food,'배 한 조각을 곁들여 보세요.');
});
test('serving steps mention strength only when it is displayed and follow the experience level',()=>{
  const beginner=servingSteps('BEGINNER',null);
  assert.equal(beginner.length,3);assert.doesNotMatch(beginner.join(' '),/%/);assert.match(beginner[2],/하이볼/);
  assert.match(servingSteps('ADVANCED',57.1)[1],/57.1%로 높은 편/);
  assert.doesNotMatch(servingSteps('INTERMEDIATE',40)[1],/%/);
});
