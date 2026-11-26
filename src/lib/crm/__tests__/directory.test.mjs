import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function moduleAt(path, deps) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:key=>{if(!(key in deps))throw Error(key);return deps[key];},URL});
  return exports;
}
const source='./../companies.ts';
class CrmError extends Error {constructor(status,text){super(text);this.status=status;}}
test('uses one scoped projection; total/filtered counts are not page length; strips accidental extra fields',async()=>{
  let args; const row={id:'demo',name:'Demo',crm_contacts:[],code_issued:true,outreach_state:'sent',has_verified_reply:true,provider_message_id:'PRIVATE',from_email:'PRIVATE',text_body:'PRIVATE'};
  const api=moduleAt(source,{'server-only':{},'./crypto':{},'./client':{CrmError,rpc:async(...a)=>{args=a; return {total:504,matched:101,companies:[row]};}}});
  const first=await api.listCompanies(' demo ',0,'sent');assert.equal(args[0],'crm_company_directory');assert.equal(args[1].p_query,'demo');assert.equal(args[1].p_state,'sent');assert.equal(first.nextOffset,100);assert.equal(first.total,504);assert.equal(first.matched,101);assert.equal(first.companies[0].codeIssued,true);assert.equal(first.companies[0].outreachState,'sent');assert.equal(first.replyTracking,'verified_only');assert.equal(first.companies[0].hasVerifiedReply,true);assert.ok(!JSON.stringify(first).includes('PRIVATE'));
  const last=await api.listCompanies('demo',100,'sent'); assert.equal(last.nextOffset,null);
  row.has_verified_reply=undefined;
  const replied=await api.listCompanies('',0,'replied');assert.equal(args[1].p_state,'replied');assert.equal(replied.companies[0].hasVerifiedReply,false);
  await assert.rejects(api.listCompanies('',0,'invalid'),e=>e.status===400);
});
test('GET rejects non-admin before lookup, including status queries',async()=>{
  let calls=0,allow=false;
  const route=moduleAt('../../../app/api/crm/companies/route.ts',{'@/lib/crm/auth':{requireAdmin:async()=>{if(!allow)throw new CrmError(403,'blocked');}},'@/lib/crm/companies':{listCompanies:(q,o,s)=>{calls++;return {q,o,s};}},'@/lib/crm/http':{failure:e=>({error:e.status})},'@/app/api/swatches/session':{json:x=>x}});
  const req={nextUrl:new URL('https://test.invalid/api/crm/companies?status=replied&q=demo&offset=100')};
  assert.equal((await route.GET(req)).error,403);assert.equal(calls,0);allow=true; const ok=await route.GET(req);assert.equal(ok.q,'demo');assert.equal(ok.o,100);assert.equal(ok.s,'replied');
});
