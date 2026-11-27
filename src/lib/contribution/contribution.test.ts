import test from 'node:test';
import assert from 'node:assert/strict';
import {contentReady,contributionFailure,describeValue,formReady,publicStatus,urlAllowed,urlReady} from './contribution';

const base={kind:null as null|'CORRECTION'|'NEW_BOTTLE'|'OTHER',targetId:null as number|null,labelName:'',fields:[] as ('ABV'|'PHOTO_MISMATCH')[],
  contents:{} as Record<string,string>,otherText:'',source:null as null|'LABEL'|'OFFICIAL_SITE'|'RETAILER'|'MEMORY',url:''};

test('FE-01 each kind needs only its own minimum',()=>{
  assert.equal(formReady({...base,kind:'CORRECTION',fields:['ABV'],contents:{ABV:'46%'}}),false,'correction needs a picked bottle');
  assert.equal(formReady({...base,kind:'CORRECTION',targetId:1,fields:['ABV'],contents:{ABV:'46%'}}),true);
  assert.equal(formReady({...base,kind:'CORRECTION',targetId:1}),false,'correction needs at least one field');
  assert.equal(formReady({...base,kind:'NEW_BOTTLE',labelName:'Kilchoman Machir Bay'}),true,'a new bottle needs only the label name');
  assert.equal(formReady({...base,kind:'NEW_BOTTLE'}),false);
  assert.equal(formReady({...base,kind:'OTHER',otherText:'가'}),false);
  assert.equal(formReady({...base,kind:'OTHER',otherText:'중복돼요'}),true);
});

test('FE-02 content and URL rules match the server',()=>{
  assert.equal(contentReady('PHOTO_MISMATCH',''),true);
  assert.equal(contentReady('ABV','가'),false);
  assert.equal(contentReady('ABV','가'.repeat(301)),false);
  assert.equal(urlAllowed('MEMORY'),false);assert.equal(urlAllowed('RETAILER'),true);
  assert.equal(urlReady('javascript:alert(1)'),false);
  assert.equal(urlReady('https://user:pw@example.org'),false);
  assert.equal(urlReady('https://example.org/item'),true);
  assert.equal(formReady({...base,kind:'NEW_BOTTLE',labelName:'X',source:'MEMORY',url:'https://example.org'}),false,'URL only with an official site or seller');
});

test('FE-03 failures keep input and point to recovery',()=>{
  assert.equal(contributionFailure(401,null).authExpired,true);
  assert.match(contributionFailure(403,null).message,/그대로/);
  assert.match(contributionFailure(409,'CONTRIBUTION_PENDING').message,/기다리고/);
  assert.match(contributionFailure(429,'RATE_LIMITED').message,/내일/);
  assert.match(contributionFailure(400,'CONTRIBUTION_PERSONAL_DATA').message,/연락처/);
  assert.match(contributionFailure(503,'CONTRIBUTION_DISABLED').message,/그대로/);
  assert.match(contributionFailure(null,null).message,/다시 보내/);
});

test('FE-04 hold and failed application are not shown as such',()=>{
  const item=(decision:'PENDING'|'APPROVED'|'REJECTED'|'SEPARATE_RELEASE',apply:'NONE'|'APPLIED'='NONE')=>({field:'ABV' as const,proposed:null,decision,apply,reasonPublic:null});
  assert.equal(publicStatus({status:'HELD',kind:'CORRECTION',items:[item('PENDING')]}).label,'확인하고 있어요');
  assert.equal(publicStatus({status:'APPLY_FAILED',kind:'CORRECTION',items:[item('APPROVED')]}).label,'반영을 준비하고 있어요');
  assert.equal(publicStatus({status:'DECIDED',kind:'CORRECTION',items:[item('REJECTED')]}).label,'이번에는 반영하지 않았어요');
  assert.equal(publicStatus({status:'DECIDED',kind:'CORRECTION',items:[]}).label,'반영을 준비하고 있어요');
  assert.equal(publicStatus({status:'APPLIED',kind:'CORRECTION',items:[item('APPROVED','APPLIED'),item('REJECTED')]}).label,'일부 반영됐어요');
  assert.equal(publicStatus({status:'APPLIED',kind:'CORRECTION',items:[item('SEPARATE_RELEASE','APPLIED')]}).label,'다른 에디션(판)으로 따로 등록했어요');
  assert.equal(publicStatus({status:'NEEDS_INFO',kind:'CORRECTION',items:[item('PENDING')]}).label,'조금 더 알려주세요');
});

test('operator values read as words, not codes',()=>{
  assert.equal(describeValue('AGE_STATEMENT',{ageStatementType:'NUMBERED',ageYears:'12'}),'표기: 숫자 연수 표기, 연수: 12');
  assert.equal(describeValue('CASK',{maturationCasks:'BOURBON,SHERRY',finishCasks:null}),'숙성 통: 버번, 셰리');
  assert.equal(describeValue('BOTTLER',{bottlerName:'G&M',independentBottling:'true'}),'병입사: G&M, 병입 방식: 독립 병입');
  assert.equal(describeValue('ABV',null),'—');
  assert.match(contributionFailure(409,'CONTRIBUTION_PENDING').message,/빼면/);
  assert.equal(contributionFailure(409,'CONTRIBUTION_PENDING').showMine,true);
});
