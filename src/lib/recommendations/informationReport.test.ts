import test from 'node:test';
import assert from 'node:assert/strict';
import {reportFailure,reportFieldForFact,reportFieldOptions,reportItemReady,reportReady} from './informationReport';

test('content rules match the server: photo mismatch may be empty, others need 2 to 300 characters',()=>{
  assert.equal(reportItemReady('PHOTO_MISMATCH','  '),true);
  assert.equal(reportItemReady('ABV',''),false);
  assert.equal(reportItemReady('ABV','가'),false);
  assert.equal(reportItemReady('ABV','46%'),true);
  assert.equal(reportItemReady('OTHER','가'.repeat(300)),true);
  assert.equal(reportItemReady('OTHER','가'.repeat(301)),false);
});
test('a form is ready only when at least one field is picked and every picked field is valid',()=>{
  assert.equal(reportReady([],{}),false);
  assert.equal(reportReady(['ABV','DISTILLERY'],{ABV:'46%'}),false);
  assert.equal(reportReady(['ABV','DISTILLERY','PHOTO_MISMATCH'],{ABV:'46%',DISTILLERY:'Pulteney'}),true);
});
test('every server field has exactly one option',()=>{
  const values=reportFieldOptions.map(o=>o.value);
  assert.equal(new Set(values).size,14);
  assert.equal(values.length,14);
});
test('server failures become recoverable messages',()=>{
  assert.equal(reportFailure(401,'AUTH_REQUIRED').authExpired,true);
  assert.equal(reportFailure(403,null).authExpired,true);
  assert.match(reportFailure(400,'INFORMATION_REPORT_PERSONAL_DATA').message,/연락처나 이메일/);
  assert.match(reportFailure(409,'INFORMATION_REPORT_PENDING').message,/확인을 기다리고/);
  assert.match(reportFailure(429,'RATE_LIMITED').message,/오늘은 더/);
  assert.match(reportFailure(404,'REQUEST_NOT_FOUND').message,/보낼 수 없어요/);
  assert.match(reportFailure(null,null).message,/그대로 있으니/);
});
test('fact rows open the report with the matching field selected',()=>{
  assert.equal(reportFieldForFact('abv'),'ABV');
  assert.equal(reportFieldForFact('age'),'AGE_STATEMENT');
  assert.equal(reportFieldForFact('category'),'CATEGORY_REGION');
  assert.equal(reportFieldForFact('country'),'CATEGORY_REGION');
});
