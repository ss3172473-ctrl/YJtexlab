import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url);
class CrmError extends Error{constructor(status,message){super(message);this.status=status;}}
const secret='fixture-signing-secret-not-a-real-key';
function load(name,env={},dependencies={}){
 const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:dependencies[n]??(n==='./client'?{CrmError}:require(n)),process:{env},Buffer,URLSearchParams});return exports;
}
const payload={type:'block_actions',api_app_id:'A0CM3GV4D34',team:{id:'T0C99EN4JHM'},user:{id:'U0CAK75RSAC'},channel:{id:'C0CLX6YM77D'},container:{type:'message',channel_id:'C0CLX6YM77D',message_ts:'1795669226.410369'},message:{ts:'1795669226.410369'},actions:[{action_id:'crm_approve',value:'00000000-0000-4000-8000-000000000001:'+ 'a'.repeat(64)}]};
const encode=p=>new URLSearchParams({payload:JSON.stringify(p)}).toString();
function signed(raw,timestamp='1795669226'){return new Headers({'x-slack-request-timestamp':timestamp,'x-slack-signature':'v0='+createHmac('sha256',secret).update(`v0:${timestamp}:${raw}`).digest('hex')});}
test('Slack raw-body HMAC rejects changed bytes, wrong signatures and replay window',()=>{
 const s=load('slack-verification',{CRM_SLACK_SIGNING_SECRET:secret}),raw=encode(payload);s.verifySlackSignature(raw,signed(raw),1795669226);
 assert.throws(()=>s.verifySlackSignature(raw+' ',signed(raw),1795669226),e=>e.status===401);
 assert.throws(()=>s.verifySlackSignature(raw,signed(raw),1795669527),e=>e.status===401);
 assert.throws(()=>s.verifySlackSignature(raw,signed(raw,'1795669600'),1795669226),e=>e.status===401);
 assert.throws(()=>s.verifySlackSignature(raw,new Headers(),1795669226),e=>e.status===401);
});
test('Only exact owner/app/team/channel and bound card action accepted',()=>{
 const s=load('slack-verification');assert.equal(s.slackDecision(encode(payload)).decision,'approve');
 const variants=[{user:{id:'another'}},{api_app_id:'another'},{team:{id:'another'}},{channel:{id:'another'}},{container:{...payload.container,channel_id:'another'}},{container:{...payload.container,is_ephemeral:true}},{message:{ts:'1795669226.000001'}},{actions:[...payload.actions,...payload.actions]},{actions:[{...payload.actions[0],action_id:'send_now'}]}];
 for(const v of variants)assert.throws(()=>s.slackDecision(encode({...payload,...v})),e=>[400,403].includes(e.status));
});
const id='00000000-0000-4000-8000-000000000001';
const client={CrmError,supabaseEnabled:()=>true};
const companies={companyId:v=>{if(!/^[a-f0-9-]{36}$/.test(v))throw new CrmError(400,'id');return v;}};
function approvals(env={},extra={}){return load('approval-actions',env,{'./client':{...client,...extra},'./companies':companies});}
const draft={action:'create',operationId:'price:fixture:001',kind:'price',companyId:id,expectedUpdatedAt:'2026-11-26T01:02:03+00:00',canViewPrices:true};
test('Worker token separated from other credentials; no approval operation exposed',()=>{
 const a=approvals({CRM_APPROVAL_WORKER_TOKEN:'x'.repeat(48)});a.requireApprovalWorker(new Headers({authorization:'Bearer '+'x'.repeat(48)}));
 for(const h of [{},{cookie:'admin-session'},{authorization:'Bearer '+'y'.repeat(48)}])assert.throws(()=>a.requireApprovalWorker(new Headers(h)),e=>e.status===401);
 for(const action of ['approve','reject','decide'])assert.throws(()=>a.approvalInput({action,id}),e=>e.status===400);
});
test('Draft is immutable exact intent; wrong kind, versions, header injection rejected',()=>{
 const a=approvals(),first=a.approvalInput(draft);assert.equal(first.body.requestDigest,a.approvalInput(draft).body.requestDigest);
 assert.notEqual(first.body.requestDigest,a.approvalInput({...draft,canViewPrices:false}).body.requestDigest);
 for(const patch of [{canViewPrices:'true'},{expectedUpdatedAt:'yesterday'},{to:'attacker@example.com'},{kind:'send'},{textBody:'extra'}])assert.throws(()=>a.approvalInput({...draft,...patch}),e=>e.status===400);
 const reply={action:'create',operationId:'reply:fixture:001',kind:'reply',companyId:id,contactId:id,expectedUpdatedAt:draft.expectedUpdatedAt,inboundMessageId:id,inboxDigest:'b'.repeat(64),subject:'Re: fabric',textBody:'Approved answer'};
 assert.equal(a.approvalInput(reply).body.subject,'Re: fabric');assert.throws(()=>a.approvalInput({...reply,subject:'Hi\r\nBcc: other@example.com'}),e=>e.status===400);
});
test('Completion requires execution binding and durable provider receipt; uncertain cannot claim success',()=>{
 const a=approvals();assert.equal(a.approvalInput({action:'complete',id,executionId:id,outcome:'uncertain'}).body.providerMessageId,null);
 assert.throws(()=>a.approvalInput({action:'complete',id,executionId:id,outcome:'succeeded'}),e=>e.status===400);
 assert.throws(()=>a.approvalInput({action:'complete',id,executionId:id,outcome:'retry'}),e=>e.status===400);
});
