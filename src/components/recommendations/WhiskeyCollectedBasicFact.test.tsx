import WhiskeyResultBasicFacts from './WhiskeyResultBasicFacts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import WhiskeyCollectedBasicFact from './WhiskeyCollectedBasicFact';

test('direct values have no repeated source metadata',()=>{
 const html=renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{field:'abv',label:'알코올 도수',value:'46.3%',kind:'KNOWN'}}/>);
 assert.ok(html.includes('46.3%'));assert.ok(!html.includes('출처'));assert.ok(!html.includes('참고 정보'));assert.ok(html.includes('확인된 정보'));
});
test('beginners see only the reference label, never the confirmed label',()=>{
 const known=renderToStaticMarkup(<WhiskeyCollectedBasicFact beginner fact={{field:'abv',label:'알코올 도수',value:'46.3%',kind:'KNOWN'}}/>);
 assert.ok(!known.includes('확인된 정보'));assert.ok(!known.includes('참고 정보'));
 const ai=renderToStaticMarkup(<WhiskeyCollectedBasicFact beginner fact={{field:'abv',label:'알코올 도수',value:'46.3%',kind:'AI'}}/>);
 assert.ok(ai.includes('참고 정보'));
});
test('model-only values carry one short visible non-interactive label',()=>{
 const html=renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{field:'age',label:'숙성 연수',value:'12년',kind:'AI'}}/>);
 assert.equal((html.match(/참고 정보/g)??[]).length,1);assert.ok(html.includes('12년'));assert.ok(!html.includes('<button'));
});
test('the server notice appears once, only when a reference value is shown',()=>{
 const base={basic:[{field:'abv' as const,label:'알코올 도수',value:'46.3%',kind:'AI' as const}],bottling:[],volumes:[],notice:null};
 const withRef=renderToStaticMarkup(<WhiskeyResultBasicFacts display={base} notice="세부 정보는 참고용이에요."/>);
 assert.equal((withRef.match(/세부 정보는 참고용이에요/g)??[]).length,1);
 const known=renderToStaticMarkup(<WhiskeyResultBasicFacts display={{...base,basic:[{...base.basic[0],kind:'KNOWN' as const}]}} notice="세부 정보는 참고용이에요."/>);
 assert.ok(!known.includes('세부 정보는 참고용이에요'));
});
test('report entry appears only beside missing or held values when reporting is enabled',()=>{
  const missing={field:'age' as const,label:'숙성 연수',value:'아직 정보가 없어요',kind:'MISSING' as const};
  assert.match(renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={missing} onReport={()=>{}}/>),/숙성 연수 정보 알려주기/);
  assert.match(renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{...missing,kind:'HELD',value:'정보 확인 필요'}} onReport={()=>{}}/>),/알려주기/);
  assert.doesNotMatch(renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{...missing,kind:'KNOWN',value:'12년'}} onReport={()=>{}}/>),/알려주기/);
  assert.doesNotMatch(renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={missing}/>),/알려주기/);
});
