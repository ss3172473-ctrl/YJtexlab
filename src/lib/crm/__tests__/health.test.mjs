import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
class CrmError extends Error{constructor(status,message){super(message);this.status=status;}}
function load(env={},rpc=async()=>({})){
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../health.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>name==='server-only'?{}:name==='./client'?{CrmError,rpc,supabaseEnabled:()=>env.CRM_BACKEND==='supabase'}:require(name),process:{env},Date,Buffer});return exports;
}
const base={role:'send',runId:'day:2026-11-26',phase:'started'};
test('dedicated health credential does not accept other role tokens',()=>{
 const key='health-role-receipt-secret-longer-than-thirty-two';const health=load({CRM_BACKEND:'supabase',CRM_HEALTH_TOKEN:key});
 health.requireHealth(new Headers({authorization:`Bearer ${key}`}));assert.throws(()=>health.requireHealth(new Headers({authorization:'Bearer sender-secret'})),e=>e.status===401);
 assert.throws(()=>load({CRM_HEALTH_TOKEN:key}).requireHealth(new Headers({authorization:`Bearer ${key}`})),e=>e.status===503);
});
test('unknown counts remain absent and no arbitrary customer metadata accepted',()=>{
 const health=load();const parsed=health.healthInput(base);assert.deepEqual(Object.keys(parsed.counts),[]);assert.equal(parsed.emittedAt,null);
 for(const patch of [{email:'buyer@example.com'},{counts:{email:'buyer@example.com'}},{counts:{queued:2}},{counts:{accepted:-1}},{counts:{accepted:1.5}},{evidence:{kind:'sender_day',ref:'buyer@example.com'}},{evidence:{kind:'sender_day',ref:'2026-11-26',customer:'secret'}}])assert.throws(()=>health.healthInput({...base,...patch}),e=>e.status===400);
});
test('completed receipts require typed evidence and preserve actual outcome instead of healthy',()=>{
 const health=load();assert.throws(()=>health.healthInput({...base,phase:'completed'}),e=>e.status===400);
 const receipt=health.healthInput({...base,phase:'completed',evidence:{kind:'sender_day',ref:'2026-11-26'},counts:{accepted:30,confirmedBounces:1,netAccepted:29}});
 assert.equal(receipt.phase,'completed');assert.equal(receipt.counts.netAccepted,29);assert.equal(receipt.healthy,undefined);
 for(const phase of ['shortfall','needs_review','failed'])assert.equal(health.healthInput({...base,phase}).phase,phase);
});
test('invalid clocks roles code revisions and unconstrained refs fail',()=>{
 const health=load();for(const patch of [{role:'all'},{phase:'healthy'},{emittedAt:new Date(Date.now()+60000).toISOString()},{emittedAt:'today'},{codeSha:'main'},{evidence:{kind:'collector_run',ref:'2026-11-26'}}])assert.throws(()=>health.healthInput({...base,...patch}),e=>e.status===400);
 assert.equal(health.healthInput({...base,role:'crm',phase:'completed',evidence:{kind:'inbox_checkpoint',ref:'90071992547409931'}}).evidence.ref,'90071992547409931');
});
test('terminal conflicts are surfaced and receivedAt is not accepted from producer',async()=>{
 let call;const health=load({},async(name,args)=>{call={name,args};return{error:'health_receipt_conflict'};});
 assert.throws(()=>health.healthInput({...base,receivedAt:'2026-01-01T00:00:00Z'}),e=>e.status===400);
 await assert.rejects(health.recordHealth(base),e=>e.status===409);assert.equal(call.name,'crm_role_health_record');assert.equal(call.args.p_body.phase,'started');
});
