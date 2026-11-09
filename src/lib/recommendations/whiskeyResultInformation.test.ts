import test from 'node:test';
import assert from 'node:assert/strict';
import {whiskeyResultInformation,refreshResultInformation} from './whiskeyResultInformation';
import {card,collected} from './whiskeyResultInformation.fixtures';
import type {CatalogFacts,ProductSourceObservations} from './v3Contract';
const catalog:CatalogFacts={status:'CURRENT',bottlingId:1,factsDigest:'b'.repeat(64),policyVersion:'S4_EVIDENCE_V1',checkedAt:'2026-10-26T00:00:00Z',validUntil:'2099-01-01T00:00:00Z',
  fields:[{field:'abv',value:'46.3',sources:[{url:'https://producer.example/a',observedAt:'2026-10-22T00:00:00Z'}]}]};
const page:ProductSourceObservations={scope:'PRODUCT_PAGE',status:'CURRENT',bottlingIdentityConfirmed:false,observedAt:'2026-10-22T00:00:00Z',validUntil:'2099-01-01T00:00:00Z',sourceUrl:'https://producer.example/a',publisher:'Producer',fields:[{field:'abv',value:'46.3',unit:'%'},{field:'maturationCask',value:'BOURBON'}]};
test('actual facts remain values while basic-only original AI estimates are brief and optional gaps are absent',()=>{
  const before=JSON.stringify(card);
  const view=whiskeyResultInformation(card);
  assert.deepEqual(view.basic.map(f=>f.field),['category','country','abv','age']);
  assert.deepEqual(view.basic.map(f=>f.kind),['AI','AI','KNOWN','KNOWN']);
  assert.equal(view.basic[2].value,'46.3%');assert.equal(view.basic[3].value,'12년');
  assert.deepEqual(view.bottling,[{field:'maturationCask',label:'숙성 통',value:'Bourbon (버번)'}]);assert.deepEqual(view.volumes,[]);
  assert.equal(JSON.stringify(card),before);
});
test('all missing basic labels stay fixed and null age is never NAS',()=>{
  const view=whiskeyResultInformation({...card,identity:{brand:'Example',expression:'One'},collectedBottlingInformation:null});
  assert.equal(view.basic.length,4);assert.ok(view.basic.every(f=>f.kind==='MISSING'&&f.value==='정보 없음'));
  assert.deepEqual(view.bottling,[]);
  for(const value of ['UNKNOWN','N/A',' ']){
    const info={...collected,fields:collected.fields.map(f=>f.field==='maturationCask'?{...f,value}:f)};
    assert.deepEqual(whiskeyResultInformation({...card,collectedBottlingInformation:info}).bottling,[]);
  }
});
test('NAS is explicit and has the same AI status policy as every other basic fact',()=>{
  const ai=whiskeyResultInformation({...card,identity:{brand:'Example',expression:'One',ageStatement:'NAS'},collectedBottlingInformation:null});
  assert.equal(ai.basic[3].value,'숙성 연수 미표기');assert.equal(ai.basic[3].kind,'AI');
  const info={...collected,basicFields:collected.basicFields!.map(f=>f.field==='age'?{...f,value:'NAS'}:f)};
  assert.equal(whiskeyResultInformation({...card,collectedBottlingInformation:info}).basic[3].kind,'KNOWN');
});
test('ambiguous and variant-held products cannot refill missing fields with AI',()=>{
  for(const status of ['AMBIGUOUS','INSUFFICIENT_IDENTITY'] as const){
    const view=whiskeyResultInformation({...card,collectedBottlingInformation:{...collected,status,basicFields:undefined}});
    assert.ok(view.basic.every(f=>f.kind==='HELD'));assert.equal(view.bottling.length,0);assert.ok(view.notice);
  }
  const info={...collected,basicFields:collected.basicFields!.map(f=>f.field==='abv'?{...f,status:'UNKNOWN' as const,value:null,sources:[],reason:'CONFLICTING_OBSERVATIONS'}:f)};
  assert.equal(whiskeyResultInformation({...card,collectedBottlingInformation:info}).basic[2].kind,'HELD');
});
test('catalog expiry and numeric meaning are preserved, and current certified fields have priority',()=>{
  assert.equal(whiskeyResultInformation({...card,catalogFacts:{...catalog,fields:[{...catalog.fields[0],value:'43'}]}}).basic[2].value,'43%');
  const noCollected={...card,collectedBottlingInformation:null};
  assert.equal(whiskeyResultInformation({...noCollected,catalogFacts:{...catalog,validUntil:'2020-01-01T00:00:00Z'}}).basic[2].kind,'AI');
  assert.equal(whiskeyResultInformation({...noCollected,catalogFacts:{...catalog,fields:[{...catalog.fields[0],value:'140'}]}}).basic[2].kind,'HELD');
  const mixed={...catalog,fields:[{...catalog.fields[0],field:'ageYears',value:'12'},{...catalog.fields[0],field:'ageStatement',value:'NAS'}]};
  assert.equal(whiskeyResultInformation({...noCollected,catalogFacts:mixed}).basic[3].kind,'HELD');
});
test('product-page facts are retained for general products but never expanded to an explicit edition or mismatched strength',()=>{
  const general={...card,collectedBottlingInformation:null,productSourceObservations:page};
  assert.equal(whiskeyResultInformation(general).basic[2].kind,'KNOWN');assert.equal(whiskeyResultInformation(general).bottling.length,1);
  for(const identity of [{...card.identity,edition:'Special'},{...card.identity,market:'US'},{...card.identity,volumeMl:750}]){
    const view=whiskeyResultInformation({...general,identity});assert.equal(view.basic[2].kind,'AI');assert.equal(view.bottling.length,0);
  }
  const conflict={...general,productSourceObservations:{...page,fields:[{field:'abv',value:'40'}]}};
  assert.ok(whiskeyResultInformation(conflict).basic.every(f=>f.kind==='HELD'));
});
test('credit-dependent observed fields are not silently published after removing credit UI',()=>{
  const info={...collected,basicFields:collected.basicFields!.map(f=>f.field==='abv'?{...f,sources:[{url:'https://producer.example/a',attribution:'Required credit'}]}:f),
    fields:collected.fields.map(f=>f.field==='maturationCask'?{...f,sources:[{url:'https://producer.example/a',licenseUrl:'https://creativecommons.org/licenses/by/4.0/'}]}:f)};
  const view=whiskeyResultInformation({...card,collectedBottlingInformation:info});assert.equal(view.basic[2].kind,'AI');assert.equal(view.bottling.length,0);
});
test('refresh compares display values rather than URLs/dates and keeps saved prose/identity',()=>{
  const next={...card,identity:{...card.identity,expression:'Different'},presentation:{summary:['different'],pairings:[]},collectedBottlingInformation:{...collected,checkedAt:'2026-10-27T00:00:00Z'}};
  const result=refreshResultInformation(card,next);assert.equal(result.changed,false);assert.deepEqual(result.card.identity,card.identity);assert.deepEqual(result.card.presentation,card.presentation);
  assert.throws(()=>refreshResultInformation(card,{...card,id:'other'}));
  const changed={...card,collectedBottlingInformation:{...collected,basicFields:collected.basicFields!.map(f=>f.field==='abv'?{...f,value:'43'}:f)}};
  assert.equal(refreshResultInformation(card,changed).changed,true);
});
test('failed sidecar preserves values, but a valid withdrawal is applied even when another channel fails',()=>{
  const unavailable={...collected,status:'UNAVAILABLE' as const,basicFields:undefined};
  const failure=refreshResultInformation(card,{...card,collectedBottlingInformation:unavailable});assert.equal(failure.unavailable,true);assert.equal(failure.changed,false);
  const withheld={...collected,status:'NAME_ONLY' as const,basicFields:undefined,availableVolumesMl:[],fields:collected.fields.map(f=>({...f,status:'UNKNOWN' as const,value:null,sources:[],reason:'PUBLICATION_REVIEW_REQUIRED'}))};
  const withdrawn=refreshResultInformation({...card,catalogFacts:catalog},{...card,catalogFacts:{...catalog,status:'UNAVAILABLE'},collectedBottlingInformation:withheld});
  const view=whiskeyResultInformation(withdrawn.card);assert.equal(view.basic[2].kind,'AI');assert.equal(view.bottling.length,0);
  const validNew=refreshResultInformation(card,{...card,catalogFacts:catalog,collectedBottlingInformation:unavailable});assert.equal(whiskeyResultInformation(validNew.card).basic[2].kind,'KNOWN');
});

test('known volumes are combined without extending a specific requested bottle',()=>{
  const info={...collected,availableVolumesMl:[700,750]};
  const facts={...catalog,fields:[{...catalog.fields[0],field:'volumeMl',value:'700'}]};
  assert.deepEqual(whiskeyResultInformation({...card,catalogFacts:facts,collectedBottlingInformation:info}).volumes,[700,750]);
  assert.deepEqual(whiskeyResultInformation({...card,identity:{...card.identity,volumeMl:700},catalogFacts:facts,collectedBottlingInformation:info}).volumes,[700]);
});
test('overlapping sweetness signals display one stable taste row',()=>{
  const facts={...catalog,fields:[{...catalog.fields[0],field:'sweetnessLevel',value:'2'},{...catalog.fields[0],field:'tasteSweetness',value:'1'}]};
  const rows=whiskeyResultInformation({...card,catalogFacts:facts}).bottling.filter(f=>f.label==='단맛');
  assert.deepEqual(rows,[{field:'tasteSweetness',label:'단맛',value:'은은함'}]);
});
