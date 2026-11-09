import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import WhiskeyResultBasicFacts from './WhiskeyResultBasicFacts';
import WhiskeyCollectedBottlingPanel from './WhiskeyCollectedBottlingPanel';
import WhiskeyResultImage from './WhiskeyResultImage';
import RecommendationSearchImage from './RecommendationSearchImage';
import WhiskeyAiSuggestionCard from './WhiskeyAiSuggestionCard';
import {whiskeyResultInformation} from '@/lib/recommendations/whiskeyResultInformation';
import {card,collected} from '@/lib/recommendations/whiskeyResultInformation.fixtures';
import type {V3Response} from '@/lib/recommendations/v3Contract';
function markup(value=card){const display=whiskeyResultInformation(value);return renderToStaticMarkup(<><WhiskeyResultBasicFacts display={display}/><WhiskeyCollectedBottlingPanel display={display}/></>);}
test('actual information values are readable without source UI or empty bottling fields',()=>{
  const html=markup();assert.ok(html.includes('46.3%'));assert.ok(html.includes('12년'));assert.ok(html.includes('Bourbon'));
  assert.equal((html.match(/AI 추정/g)??[]).length,2);
  for(const noise of ['출처','https://','2026-10-22','등록 제품명','캐스크 번호','피니시 통','Highland','미확인'])assert.ok(!html.includes(noise),noise);
});
test('fixed basic labels and a native bottling entry persist even when no values exist',()=>{
  const empty={...card,identity:{brand:'Example',expression:'One'},collectedBottlingInformation:null};
  for(const html of [markup(),markup(empty)]){
    const positions=['위스키 종류','위스키 생산국','알코올 도수','숙성 연수','병입 정보 더보기'].map(label=>html.indexOf(label));
    assert.ok(positions.every((v,i)=>v>=0&&(i===0||v>positions[i-1])));assert.ok(html.includes('<details'));
  }
  const html=markup(empty);assert.equal((html.match(/정보 없음/g)??[]).length,4);assert.equal((html.match(/현재 안내할 수 있는 병입 정보가 없어요/g)??[]).length,1);
});
test('held fields never render an AI alternative and an unconfirmed viewer cannot render a stored result',()=>{
  const held={...card,collectedBottlingInformation:{...collected,status:'AMBIGUOUS' as const,basicFields:undefined}};
  const html=markup(held);assert.ok(!html.includes('AI 추정'));assert.ok(html.includes('정보 확인 필요'));
  const response:V3Response={apiVersion:'V3',state:'SUCCESS',nextAction:'NONE',operationId:card.id,appliedLevel:'BEGINNER',recommendedAt:'2026-10-26T00:00:00Z',
    verification:{atRecommendation:'AI_SUGGESTED',current:'UNVERIFIED'},aiSuggestion:card};
  const result=renderToStaticMarkup(<WhiskeyAiSuggestionCard response={response} ownerUid={42}/>);
  assert.ok(result.includes('저장한 추천을 확인할 수 없어요'));
  for(const privateBody of ['Deanston','46.3%','마신 뒤 시음 기록','마셔보고 싶어요','사진을 찾고 있어요'])assert.ok(!result.includes(privateBody),privateBody);
  const heldResponse:V3Response={...response,aiSuggestion:{...card,collectedBottlingInformation:{...collected,status:'AMBIGUOUS',availableVolumesMl:[],basicFields:undefined,fields:collected.fields.map(f=>({...f,status:'UNKNOWN',value:null,sources:[],reason:'CONFLICTING_OBSERVATIONS'}))}}};
  const heldCard=renderToStaticMarkup(<WhiskeyAiSuggestionCard response={heldResponse} ownerUid={null}/>);assert.ok(heldCard.includes('로그인한 계정과 추천 주소'));assert.ok(!heldCard.includes('AI 추정'));
  assert.ok(!heldCard.includes('도수가 높을수록'));
  for(const noise of ['출처','사진 다시 찾기','등록 제품명','연결했어요','공개 이용','https://'])assert.ok(!result.includes(noise),noise);
});
test('beginner strength guidance follows displayed facts without exposing a held or missing strength',()=>{
  const display=whiskeyResultInformation(card);
  assert.ok(!renderToStaticMarkup(<WhiskeyResultBasicFacts display={display}/>).includes('도수가 높을수록'));
  assert.ok(renderToStaticMarkup(<WhiskeyResultBasicFacts display={display} beginner/>).includes('도수가 높을수록'));
  for(const kind of ['MISSING','HELD'] as const) {
    const unavailable={...display,basic:display.basic.map(f=>f.field==='abv'?{...f,kind,value:'정보 확인 필요'}:f)};
    assert.ok(!renderToStaticMarkup(<WhiskeyResultBasicFacts display={unavailable} beginner/>).includes('도수가 높을수록'));
  }
});
test('the result photo uses the existing search loading state without a source link',()=>{
  const html=renderToStaticMarkup(<WhiskeyResultImage identity={card.identity}/>);assert.ok(html.includes('사진을 찾고 있어요'));assert.ok(!html.includes('위스키 기본 이미지'));assert.ok(!html.includes('href='));
});
test('photo failure keeps its message while source links are optional and existing callers retain them',()=>{
  const props={name:'Example Twelve',sourceUrl:'https://maker.example.org/product'};
  const hidden=renderToStaticMarkup(<RecommendationSearchImage {...props} showSource={false}/>);
  const original=renderToStaticMarkup(<RecommendationSearchImage {...props}/>);
  assert.ok(hidden.includes('사진을 준비하지 못했어요'));assert.ok(!hidden.includes('href='));
  assert.ok(original.includes('사진 출처에서 확인하기'));assert.ok(original.includes(props.sourceUrl));
  const retry=renderToStaticMarkup(<RecommendationSearchImage {...props} showSource={false} onRetry={()=>{}}/>);
  assert.ok(retry.includes('사진 다시 찾기'));assert.ok(retry.includes('<button'));assert.ok(!retry.includes('사진 출처'));
});
