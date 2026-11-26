import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
class CrmError extends Error { constructor(status,message){super(message);this.status=status;} }
const snap={companyId:'id',name:'Fixture',email:'buyer@example.test',contactId:'contact',credentialId:'credential',companyUpdatedAt:'now',encryptedCode:'cipher',codeHash:'hash',canViewPrices:false};
function load(options={}) {
 const calls=[],exports={}; const deps={
 './client':{CrmError,rpc:async(name,args)=>{calls.push(args);return calls.length===1?(options.prepared??{snapshot:snap}):(options.receipt??{sendHoldReleased:true});}},
 './companies':{companyId:()=>{},resolveFingerprint:async()=>options.resolved===null?null:{id:'id',name:snap.name,email:snap.email,canViewPrices:false,...options.resolved}},
 './crypto':{decryptCode:()=>{if(options.decryptFail)throw Error();return 'A123';},crmFingerprint:()=>options.hash??'hash'},
 '@/app/swatches/customer-code':{customerCode:()=>options.invalidCode?null:'A123'}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../collector-access-check.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:deps[n]});
 return {verify:body=>exports.verifyCollectedAccess('id',body),calls};
}
const body={operationId:'dots:fixture:1'};
test('only server resolved identity releases exact snapshot, no caller success claim',async()=>{
 const subject=load();assert.equal((await subject.verify(body)).sendHoldReleased,true);assert.deepEqual(subject.calls[1].p_expected,snap);
 for(const invalid of [{...body,passed:true},{operationId:'short'},{...body,code:'A123'}])await assert.rejects(load().verify(invalid),e=>e.status===400);
});
test('credential corruption, resolver identity mismatch and missing access never release',async()=>{
 for(const options of [{decryptFail:true},{invalidCode:true},{hash:'other'},{resolved:null},{resolved:{id:'other'}},{resolved:{name:'other'}},{resolved:{email:'other'}},{resolved:{canViewPrices:true}}]){
 const subject=load(options);await assert.rejects(subject.verify(body),e=>e.status===503);assert.equal(subject.calls.length,1);
 }
});
test('unknown registration and atomic stale CAS fail closed',async()=>{
 await assert.rejects(load({prepared:{error:'not_held_registration'}}).verify(body),e=>e.status===409);
 await assert.rejects(load({receipt:{error:'stale_access_snapshot'}}).verify(body),e=>e.status===409);
});
