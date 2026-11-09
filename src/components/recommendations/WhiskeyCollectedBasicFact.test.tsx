import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import WhiskeyCollectedBasicFact from './WhiskeyCollectedBasicFact';

test('direct values have no repeated source metadata',()=>{
 const html=renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{field:'abv',label:'알코올 도수',value:'46.3%',kind:'KNOWN'}}/>);
 assert.ok(html.includes('46.3%'));assert.ok(!html.includes('출처'));assert.ok(!html.includes('AI 추정'));
});
test('model-only values carry one short visible non-interactive label',()=>{
 const html=renderToStaticMarkup(<WhiskeyCollectedBasicFact fact={{field:'age',label:'숙성 연수',value:'12년',kind:'AI'}}/>);
 assert.equal((html.match(/AI 추정/g)??[]).length,1);assert.ok(html.includes('12년'));assert.ok(!html.includes('<button'));
});
