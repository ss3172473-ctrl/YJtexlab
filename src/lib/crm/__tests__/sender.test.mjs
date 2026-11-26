import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
class CrmError extends Error { constructor(status,message){super(message);this.status=status;} }
function load(rpc=async()=>[],env={CRM_SENDER_TOKEN:'s'.repeat(48)}){
 const exports={}; const deps={'./client':{CrmError,rpc,supabaseEnabled:()=>true},'./crypto':{decryptCode:()=> 'A123',crmFingerprint:()=> 'hash'}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../sender.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:deps[n]??require(n),process:{env},Buffer,Date});return exports;
}
const id='11111111-1111-4111-8111-111111111111';
const claim={action:'claim',operationId:'sender:fixture:1',companyId:id,contactId:id,credentialId:id,companyUpdatedAt:'2026-11-26T00:00:00Z',inboundCheckedAt:'2026-11-26T00:00:00Z',name:'Fixture',email:'buyer@example.test',messageId:'<fixture@yjtexlab.com>',mimeSha256:'a'.repeat(64)};
test('sender rejects collector/admin credential and malformed payload',()=>{
 const m=load(); assert.throws(()=>m.requireSender(new Headers({authorization:'Bearer '+'c'.repeat(48)})),e=>e.status===401);
 m.requireSender(new Headers({authorization:'Bearer '+'s'.repeat(48)})); m.senderInput(claim);
 for(const change of [{email:'BUYER@example.test'},{name:'x\r\nBcc:bad'},{messageId:'bad'},{companyId:'bad'},{mimeSha256:'bad'},{companyUpdatedAt:'NaN'},{code:'A123'},{action:'delete'}]) assert.throws(()=>m.senderInput({...claim,...change}),e=>e.status===400);
});
test('only confirmed provider receipt may claim sent',()=>{
 const m=load(),r={action:'receipt',operationId:'sender:fixture:1',leaseToken:id,outcome:'sent'};
 assert.throws(()=>m.senderInput(r)); m.senderInput({...r,providerMessageId:'gmail123'});
 m.senderInput({...r,outcome:'uncertain'});assert.throws(()=>m.senderInput({...r,outcome:'uncertain',providerMessageId:'gmail123'}));
});
test('candidate code integrity checked and encrypted material removed',async()=>{
 const m=load(async()=>[{companyId:id,encryptedCode:'cipher',codeHash:'hash'}]);const c=await m.senderCandidates();assert.equal(c[0].code,'A123');assert.equal(c[0].encryptedCode,undefined);assert.equal(c[0].codeHash,undefined);
 await assert.rejects(load(async()=>[{encryptedCode:'cipher',codeHash:'wrong'}]).senderCandidates(),e=>e.status===503);
});
test('DB stale/uncertain guards surfaced without retry',async()=>{
 let calls=0;const m=load(async()=>{calls++;return {error:'already_started_no_retry'};});await assert.rejects(m.senderTransition({action:'begin',operationId:'sender:fixture:1',leaseToken:id}),e=>e.status===409);assert.equal(calls,1);
});
