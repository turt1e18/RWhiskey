import {test} from 'node:test';
import assert from 'node:assert/strict';
import {whiskeyPhotoQuery,parseWhiskeyPhoto} from './whiskeyPhoto';
import {searchLegacyImages,parseLegacyImageRequest,type ImageSearchSettings} from '../../server/imageSearch';
import {getRecommendationPhoto,forgetRecommendationPhoto} from '../../api/recommendationImages';

const photo={url:'https://images.example.org/bottle.jpg',sourceUrl:'https://maker.example.org/product',sourceTitle:'Example bottle'};
const signal=new AbortController().signal;
test('image query uses bottling identity and public reference URLs reject unsafe destinations',()=>{
  const query=whiskeyPhotoQuery({brand:'Example',expression:'Twelve',edition:'Edition A',batch:'B2',bottler:'Bottler',abv:48,vintageYear:2010,caskNumber:'C7'});
  for(const token of ['Example','Twelve','Edition A','batch B2','Bottler','48%','vintage 2010','cask C7'])assert.ok(query.includes(token));
  assert.deepEqual(parseWhiskeyPhoto(photo),photo);
  for(const url of ['http://images.example.org/a','https://name:secret@example.org/a','https://127.0.0.1/a','https://box.internal/a','javascript:alert(1)']){
    assert.equal(parseWhiskeyPhoto({...photo,url}),null);assert.equal(parseWhiskeyPhoto({...photo,sourceUrl:url}),null);
  }
});
test('Google reference photo preserves source while existing string and thumbnail contracts stay unchanged',async()=>{
  let calls=0;
  const settings:ImageSearchSettings={key:'AUTHORED_TEST_KEY',engineId:'AUTHORED_ENGINE',now:()=>Date.parse('2026-10-20'),transport:async(_url,options)=>{
    calls++;assert.equal(options.params.searchType,'image');assert.equal(options.params.num,1);assert.equal(options.timeout,5000);
    return {data:{items:[{link:photo.url,title:photo.sourceTitle,image:{contextLink:photo.sourceUrl,thumbnailLink:'https://images.example.org/thumb.jpg'}}]}};
  }};
  assert.deepEqual(await searchLegacyImages({data:'Example Twelve',type:3,includeSource:true},signal,settings),photo);
  assert.equal(calls,1);
  assert.equal(await searchLegacyImages({data:'Example Twelve',type:3},signal,settings),photo.url);
  assert.equal(await searchLegacyImages({data:'Example Twelve',type:0},signal,settings),photo.url);
});
test('a missing or unsafe source cannot silently become an attributed photo and no second hit is substituted',async()=>{
  let calls=0;
  const settings:ImageSearchSettings={key:'AUTHORED_TEST_KEY',engineId:'AUTHORED_ENGINE',transport:async()=>{calls++;return {data:{items:[{link:photo.url,title:'Bottle',image:{contextLink:'https://box.internal/product'}}]}};}};
  assert.equal(await searchLegacyImages({data:'Example',type:3,includeSource:true},signal,settings),null);assert.equal(calls,1);
  assert.throws(()=>parseLegacyImageRequest({data:'Example',type:1,includeSource:true}));
  assert.throws(()=>parseLegacyImageRequest({data:'Example',type:3,includeSource:'yes'}));
  assert.equal(await searchLegacyImages({data:'Example',type:3,includeSource:true},signal,{providerName:'DISABLED'}),null);
});
test('unsafe original image uses the HTTPS thumbnail of the same result with its source in one search',async()=>{
  for(const originalUrl of ['http://images.example.org/original.jpg','https://box.internal/original.jpg']){
  let calls=0;
  const settings:ImageSearchSettings={key:'AUTHORED_TEST_KEY',engineId:'AUTHORED_ENGINE',transport:async()=>{calls++;return {data:{items:[{
    link:originalUrl,title:photo.sourceTitle,
    image:{contextLink:photo.sourceUrl,thumbnailLink:'https://images.example.org/thumbnail.jpg'},
  }]}};}};
  assert.deepEqual(await searchLegacyImages({data:'Example',type:3,includeSource:true},signal,settings),{...photo,url:'https://images.example.org/thumbnail.jpg'});
  assert.equal(calls,1);
  }
});
test('concurrent and repeated card mounts share one image request; search errors do not retry',async()=>{
  const original=globalThis.fetch;let calls=0;
  try{
    globalThis.fetch=async(_url,init)=>{calls++;const body=JSON.parse(String(init?.body));assert.equal(body.includeSource,true);assert.equal(body.type,3);assert.equal(init?.credentials,'include');return Response.json(photo);};
    const [a,b]=await Promise.all([getRecommendationPhoto('AUTHORED_UNIQUE_BOTTLE'),getRecommendationPhoto('AUTHORED_UNIQUE_BOTTLE')]);
    assert.deepEqual(a,photo);assert.deepEqual(b,photo);assert.equal(calls,1);
    await getRecommendationPhoto('AUTHORED_UNIQUE_BOTTLE');assert.equal(calls,1);
    globalThis.fetch=async()=>{calls++;throw new Error('authored unavailable')};
    assert.equal(await getRecommendationPhoto('AUTHORED_FAILED_BOTTLE'),null);
    assert.equal(await getRecommendationPhoto('AUTHORED_FAILED_BOTTLE'),null);assert.equal(calls,2);
    forgetRecommendationPhoto('AUTHORED_FAILED_BOTTLE');
    globalThis.fetch=async()=>{calls++;return Response.json(photo);};
    assert.deepEqual(await getRecommendationPhoto('AUTHORED_FAILED_BOTTLE'),photo);assert.equal(calls,3);
  }finally{globalThis.fetch=original;}
});
