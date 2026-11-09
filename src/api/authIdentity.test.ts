import test from 'node:test';
import assert from 'node:assert/strict';
import {authApi} from './whiskeyApi';
import {whiskeyV3Api} from './whiskeyV3Api';
import apiClient from './apiClient';

test('bounded owner checks abort a stalled identity request while legacy callers remain compatible',async()=>{
  const original=globalThis.fetch;
  let calls=0;
  try {
    globalThis.fetch=async(_url,init)=>{
      calls++;
      assert.equal(init?.method,'GET');assert.equal(init?.credentials,'include');
      if(!init?.signal)return Response.json({authenticated:true,uid:42,email:null,name:null});
      return new Promise<Response>((_resolve,reject)=>{
        init.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
      });
    };
    assert.equal((await authApi.me()).uid,42);
    await assert.rejects(authApi.me(20));
    assert.equal(calls,2);
  }finally{globalThis.fetch=original;}
});

test('first-impression owner gating has a bounded read and retains the legacy empty response',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async(_url,init)=>{
      if(!init?.signal)return new Response(null,{status:204});
      return new Promise<Response>((_resolve,reject)=>{
        init.signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});
      });
    };
    assert.equal(await whiskeyV3Api.aiFeedback('authored','EXPECTED'),null);
    assert.deepEqual(await apiClient('/authored-empty',{method:'GET'}),{});
    await assert.rejects(whiskeyV3Api.aiFeedback('authored','EXPECTED',20));
  }finally{globalThis.fetch=original;}
});
