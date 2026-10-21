import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bottlingInformationNotes} from './bottlingInformation';
test('missing ABV is explained while a numeric zero is not treated as missing',()=>{
  const p={brand:'Authored',expression:'Example',abv:null};
  assert.ok(bottlingInformationNotes(p).some(n=>n.startsWith('도수는')));
  assert.ok(!bottlingInformationNotes({...p,abv:0}).some(n=>n.startsWith('도수는')));
});
test('independent and historical editions request their own sources without claiming verification',()=>{
  const p={brand:'Authored',expression:'Example',abv:50};
  assert.ok(bottlingInformationNotes({...p,independentBottling:true})[0].startsWith('독립 병입'));
  assert.ok(bottlingInformationNotes({...p,oldBottle:true})[0].startsWith('올드바틀'));
  assert.deepEqual(bottlingInformationNotes({...p,batch:'B1',caskNumber:'C1'}),[]);
  assert.equal(bottlingInformationNotes(p).length,1);
});
