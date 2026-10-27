import test from 'node:test';
import assert from 'node:assert/strict';
import {isSameOriginRequest} from './requestOrigin';
const request=(origin:string,host='127.0.0.1:3094',extra:Record<string,string>={})=>new Request('http://localhost:3094/api/google',{headers:{origin,host,...extra}});
test('checks browser HTTP host even when the framework request URL uses its internal host',()=>{
  assert.equal(isSameOriginRequest(request('http://127.0.0.1:3094')),true);
  assert.equal(isSameOriginRequest(request('http://localhost:3094','localhost:3094')),true);
});
test('cross origin, port, scheme, missing origin and forwarded host cannot grant access',()=>{
  for(const origin of ['http://attacker.example','http://localhost:3094','http://127.0.0.1:3000','https://127.0.0.1:3094','null',''])
    assert.equal(isSameOriginRequest(request(origin)),false,origin);
  assert.equal(isSameOriginRequest(request('http://attacker.example','127.0.0.1:3094',{'x-forwarded-host':'attacker.example'})),false);
  for(const host of ['attacker.example@127.0.0.1:3094','127.0.0.1:3094,attacker.example','127.0.0.1:3094/path',''])
    assert.equal(isSameOriginRequest(request('http://127.0.0.1:3094',host)),false,host);
});
