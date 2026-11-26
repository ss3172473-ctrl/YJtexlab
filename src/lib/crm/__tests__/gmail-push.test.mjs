import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { generateKeyPairSync, sign } from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const { OAuth2Client }=require('google-auth-library');
class CrmError extends Error{constructor(status,message){super(message);this.status=status;}}
const audience='https://yjtexlab.com/api/crm/gmail/push';
const env={CRM_GMAIL_PUSH_SERVICE_ACCOUNT:'yj-gmail-push@fixture-project.iam.gserviceaccount.com',CRM_GMAIL_PUSH_SERVICE_ACCOUNT_ID:'123456789012345678901',CRM_GMAIL_PUSH_SUBSCRIPTION:'projects/fixture-project/subscriptions/crm-push'};
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const realVerifier=new OAuth2Client();
function token(patch={},header={alg:'RS256',kid:'fixture',typ:'JWT'}){
 const now=Math.floor(Date.now()/1000),payload={iss:'https://accounts.google.com',aud:audience,sub:env.CRM_GMAIL_PUSH_SERVICE_ACCOUNT_ID,email:env.CRM_GMAIL_PUSH_SERVICE_ACCOUNT,email_verified:true,iat:now,exp:now+3600,...patch};
 const content=Buffer.from(JSON.stringify(header)).toString('base64url')+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url');
 return content+'.'+sign('RSA-SHA256',Buffer.from(content),privateKey).toString('base64url');
}
function load(extraEnv={},rpc=async()=>({accepted:true})){
 const exports={};const mockGoogle={auth:{OAuth2:class{
  async verifyIdToken(options){assert.equal(options.audience,audience);assert.equal(options.maxExpiry,3900);return realVerifier.verifySignedJwtWithCertsAsync(options.idToken,{fixture:publicKey.export({type:'spki',format:'pem'})},options.audience,['https://accounts.google.com','accounts.google.com'],options.maxExpiry);}
 }}};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../gmail-push.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:n==='googleapis'?{google:mockGoogle}:n==='./client'?{CrmError,rpc,supabaseEnabled:()=>true}:require(n),process:{env:{...env,...extraEnv}},Buffer,TextDecoder,Date});return exports;
}
function headers(jwt){return new Headers({authorization:'Bearer '+jwt});}
const envelope=(data={emailAddress:'hello@yjtexlab.com',historyId:'987654321012345678901234567890'})=>({subscription:env.CRM_GMAIL_PUSH_SUBSCRIPTION,message:{messageId:'2070443601311540',publishTime:'2026-01-01T12:34:56.123456Z',data:Buffer.from(JSON.stringify(data)).toString('base64url')}});
test('real RSA verification plus exact Google audience/issuer/service-account claims',async()=>{
 const p=load();assert.equal((await p.verifyGmailPush(headers(token()))).subscription,env.CRM_GMAIL_PUSH_SUBSCRIPTION);
 for(const patch of [{aud:'https://attacker.example'},{iss:'https://attacker.example'},{email:'other@fixture-project.iam.gserviceaccount.com'},{email_verified:false},{email_verified:'true'},{sub:'999999999999999999999'},{exp:Math.floor(Date.now()/1000)-1},{iat:Math.floor(Date.now()/1000)+120},{exp:Math.floor(Date.now()/1000)+7200}]) await assert.rejects(p.verifyGmailPush(headers(token(patch))),e=>e.status===401);
});
test('unsigned/tampered JWTs, missing bearer and configuration fail closed',async()=>{
 const p=load(),jwt=token();const parts=jwt.split('.');parts[1]=Buffer.from(JSON.stringify({email:env.CRM_GMAIL_PUSH_SERVICE_ACCOUNT})).toString('base64url');
 await assert.rejects(p.verifyGmailPush(headers(parts.join('.'))),e=>e.status===401);
 await assert.rejects(p.verifyGmailPush(headers(token({}, {alg:'none',kid:'fixture'}))),e=>e.status===401);
 await assert.rejects(p.verifyGmailPush(new Headers()),e=>e.status===401);
 await assert.rejects(load({CRM_GMAIL_PUSH_SERVICE_ACCOUNT_ID:''}).verifyGmailPush(headers(jwt)),e=>e.status===503);
});
test('notification accepts only bound subscription/mailbox, string history and no email content',()=>{
 const p=load(),value=envelope();const parsed=p.notificationInput(value,env.CRM_GMAIL_PUSH_SUBSCRIPTION);
 assert.equal(parsed.historyId,'987654321012345678901234567890');assert.equal(parsed.publishedAt,'2026-01-01T12:34:56.123Z');
 assert.equal(parsed.digest,p.notificationInput({...value,deliveryAttempt:10},env.CRM_GMAIL_PUSH_SUBSCRIPTION).digest);
 for(const data of [{emailAddress:'personal@example.test',historyId:'123'},{emailAddress:'hello@yjtexlab.com',historyId:123},{emailAddress:'hello@yjtexlab.com',historyId:'1',textBody:'mail contents'}])assert.throws(()=>p.notificationInput(envelope(data),env.CRM_GMAIL_PUSH_SUBSCRIPTION),e=>[400,403].includes(e.status));
 assert.throws(()=>p.notificationInput({...value,subscription:'projects/other/subscriptions/other'},env.CRM_GMAIL_PUSH_SUBSCRIPTION),e=>e.status===403);
});
test('malformed base64/JSON, oversize bodies and future timestamps rejected',async()=>{
 const p=load(),value=envelope();for(const data of ['??','e','aGVsbG8='])assert.throws(()=>p.notificationInput({...value,message:{...value.message,data}},env.CRM_GMAIL_PUSH_SUBSCRIPTION),e=>e.status===400);
 const future=new Date(Date.now()+600000).toISOString();assert.throws(()=>p.notificationInput({...value,message:{...value.message,publishTime:future}},env.CRM_GMAIL_PUSH_SUBSCRIPTION),e=>e.status===400);
 await assert.rejects(p.pushBody(new Request(audience,{method:'POST',body:'x'.repeat(32769)})),e=>e.status===413);
});
test('replay conflict is not ACKed and only bounded notification reaches RPC',async()=>{
 let body;const p=load({},async(name,args)=>{assert.equal(name,'crm_record_gmail_push');body=args.p_body;return {error:'notification_payload_conflict'};});
 await assert.rejects(p.recordPush(p.notificationInput(envelope(),env.CRM_GMAIL_PUSH_SUBSCRIPTION)),e=>e.status===409);assert.equal(body.mailbox,'hello@yjtexlab.com');assert.equal(body.token,undefined);
});
test('route verifies identity before reading data and only ACKs after persistence',async()=>{
 const source=readFileSync(new URL('../../../app/api/crm/gmail/push/route.ts',import.meta.url),'utf8');
 function route(push){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='@/lib/crm/gmail-push'?push:{failure:e=>new Response(null,{status:e.status||503})},Response});return exports;}
 let read=false,recorded=false;const denied=route({verifyGmailPush:async()=>{throw new CrmError(401,'no');},pushBody:async()=>{read=true;}});assert.equal((await denied.POST({headers:new Headers()})).status,401);assert.equal(read,false);
 let release;const gate=new Promise(r=>release=r);const allowed=route({verifyGmailPush:async()=>({subscription:'x'}),pushBody:async()=>({}),notificationInput:()=>({}),recordPush:async()=>{await gate;recorded=true;}});
 let completed=false;const response=allowed.POST({headers:new Headers()}).then(r=>{completed=true;return r;});await new Promise(r=>setImmediate(r));assert.equal(completed,false);release();assert.equal((await response).status,204);assert.equal(recorded,true);
});
