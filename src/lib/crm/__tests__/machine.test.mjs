import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
class CrmError extends Error { constructor(status,message){super(message);this.status=status;} }
function load(rpc=async()=>({}),env={CRM_COLLECTOR_TOKEN:'a'.repeat(48)}){
 const exports={};const dependencies={'./client':{CrmError,rpc,supabaseEnabled:()=>true},'./companies':{nameInput:x=>x.trim(),emailInput:x=>{if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.trim()))throw new CrmError(400,'email');return x.trim().toLowerCase();}},'./crypto':{newCode:()=> 'A123',crmFingerprint:()=> 'hash',encryptCode:()=> 'encrypted'}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../machine.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:dependencies[n]??require(n),process:{env},Buffer,URL});return exports;
}
const input={operationId:'dots:fixture:0001',name:'Fixture',email:'BUYER@example.test',sourceUrl:'https://example.test/contact#info',provenance:'Public contact page'};
test('collector token required; admin cookie and malformed bearer cannot authorize',()=>{
 const m=load();for(const h of [{},{cookie:'yj_crm_admin=token'},{authorization:'Bearer wrong'},{authorization:'Basic '+ 'a'.repeat(48)}]) assert.throws(()=>m.requireCollector(new Headers(h)),e=>e.status===401);
 m.requireCollector(new Headers({authorization:'Bearer '+'a'.repeat(48)}));assert.throws(()=>load(undefined,{}).requireCollector(new Headers()),e=>e.status===503);
});
test('canonical payload, restricted fields and required public source evidence',()=>{
 const m=load(),v=m.registrationInput(input);assert.equal(v.email,'buyer@example.test');assert.equal(v.sourceUrl,'https://example.test/contact');assert.equal(v.digest,m.registrationInput({...input,email:'buyer@example.test'}).digest);
 assert.notEqual(v.digest,m.registrationInput({...input,provenance:'Other evidence'}).digest);
 for(const extra of [{canViewPrices:true},{action:'revoke'},{companyId:'x'},{sourceUrl:'file:///tmp/source'},{sourceUrl:'https://u:p@example.test'},{provenance:''},{operationId:'tiny'},{email:'a@b'}])assert.throws(()=>m.registrationInput({...input,...extra}),e=>e.status===400);
});
test('RPC receipt returned without code, scoped actor not caller input',async()=>{
 let params;const m=load(async(name,p)=>{assert.equal(name,'crm_register_collected_company');params=p;return {companyId:'id',status:'created'};});const result=await m.registerCollectedCompany(input);assert.equal(result.companyId,'id');assert.equal(params.p_email,'buyer@example.test');assert.equal(params.p_actor,undefined);assert.ok(!JSON.stringify(result).includes('A123'));
});
test('idempotency conflict and ambiguous identities fail closed without retry',async()=>{
 for(const error of ['operation_payload_conflict','ambiguous_contact']) {let calls=0;const m=load(async()=>{calls++;return {error};});await assert.rejects(m.registerCollectedCompany(input),e=>e.status===409);assert.equal(calls,1);}
});
