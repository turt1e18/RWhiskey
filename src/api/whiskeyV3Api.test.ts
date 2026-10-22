import { test } from 'node:test';
import assert from 'node:assert/strict';
import apiClient, { ApiResponseError } from './apiClient';
import { whiskeyV3Api } from './whiskeyV3Api';

const id='00000000-0000-4000-8000-000000000001';
async function withResponse(body:string,status:number,run:()=>Promise<void>) {
  const original=globalThis.fetch;
  globalThis.fetch=async (_url,options)=>{
    assert.equal(options?.credentials,'include');
    assert.equal('emptyBodyAsNull' in (options ?? {}),false);
    return new Response(body,{status,headers:{'Content-Type':'application/json'}});
  };
  try {await run();} finally {globalThis.fetch=original;}
}
test('unwritten AI feedback is null for empty 200 and JSON null',async ()=>{
  for(const body of ['', '  ', 'null']) await withResponse(body,200,async ()=>{
    assert.equal(await whiskeyV3Api.aiFeedback(id,'EXPECTED'),null);
  });
});
test('saved feedback still returns its payload for both stages',async ()=>{
  for(const stage of ['EXPECTED','CONSUMED'] as const) {
    const row={operationId:id,stage,feedback:{sentiment:'LIKE'},updatedAt:'2026-10-19T12:00:00Z'};
    await withResponse(JSON.stringify(row),200,async ()=>{
      assert.deepEqual(await whiskeyV3Api.aiFeedback(id,stage),row);
    });
  }
});
test('empty body remains invalid for endpoints without explicit nullable opt-in',async ()=>{
  await withResponse('',200,async ()=>{await assert.rejects(()=>apiClient('/authored-test'),SyntaxError);});
});
test('malformed feedback JSON is still rejected',async ()=>{
  await withResponse('{broken',200,async ()=>{await assert.rejects(()=>whiskeyV3Api.aiFeedback(id,'EXPECTED'),SyntaxError);});
});
test('nullable feedback never converts HTTP errors into no feedback',async ()=>{
  for(const status of [401,403,500]) await withResponse('',status,async ()=>{
    await assert.rejects(()=>whiskeyV3Api.aiFeedback(id,'EXPECTED'),e=>e instanceof ApiResponseError && e.status===status);
  });
});
