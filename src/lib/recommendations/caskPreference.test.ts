import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sameProposedCaskPreference,proposedCaskCategory} from './caskPreference';
test('observed model cask aliases agree with soft preferences without changing raw identity',()=>{
  for(const [expected,actual] of [['SHERRY','Sherry Cask'],['SHERRY','ex-sherry barrel'],['VIRGIN_OAK','Charred New White Oak'],['VIRGIN_OAK','new oak']]){
    assert.equal(sameProposedCaskPreference(expected,actual),true);
    assert.equal(proposedCaskCategory(actual),expected);
  }
});
test('compound uncertain missing or different casks do not become matches',()=>{
  for(const actual of ['bourbon and sherry casks','sherry-finished bourbon','maybe sherry','Oloroso/PX blend','Port Cask',null])
    assert.equal(sameProposedCaskPreference('SHERRY',actual),false);
  assert.equal(sameProposedCaskPreference(null,null),false);
});
