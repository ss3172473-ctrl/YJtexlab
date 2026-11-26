import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';
const require=createRequire(import.meta.url);
class CrmError extends Error {constructor(status,message){super(message);this.status=status;}}
function module(file,deps={}){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:deps[n]??require(n),Buffer,Date,Response});return exports;}
const codes=module('../../../app/swatches/customer-code.ts');
const welcome=module('../../../app/swatches/welcome-name.ts');
const id='11111111-1111-4111-8111-111111111111';
const request={companyId:id,contactId:id,credentialId:id,companyUpdatedAt:'2026-11-26T01:02:03.123456+00:00',name:'Fixture',email:'buyer@example.test',codeSha256:createHash('sha256').update('A123').digest('hex')};
function load(options={}){
 const snap={...request,encryptedCode:'cipher',codeHash:'fingerprint',...options.snapshot};delete snap.codeSha256;
 let reads=0;
 const m=module('../sender-access-check.ts',{
  '@/app/swatches/customer-code':codes,'@/app/swatches/welcome-name':welcome,
  './client':{CrmError,rpc:async(name,args)=>{assert.equal(name,'crm_sender_snapshot');assert.equal(args.p_company,id);reads++;return options.missing?null:reads===2&&options.after!==undefined?options.after:snap;}},
  './crypto':{decryptCode:()=>{if(options.decryptError)throw Error('private cipher');return options.code??'A123';},crmFingerprint:()=>options.fingerprint??'fingerprint'},
  './companies':{resolveFingerprint:async(hash)=>{assert.equal(hash,'fingerprint');return options.unresolved?null:{id,name:snap.name,email:snap.email,...options.resolved};}},
 });return {m,reads:()=>reads,snap};
}
test('fresh bound server proof contains no code/cipher and reads before and after resolver',async()=>{
 const {m,reads}=load();const before=Date.now(),proof=await m.verifySenderAccess(request);
 for(const [k,v] of Object.entries(request))assert.equal(proof[k],v);
 assert.equal(proof.method,'server_access_resolver');assert.equal(proof.browserVerified,false);assert.equal(proof.accessGranted,true);assert.equal(proof.welcomeCompany,'Fixture');
 assert.ok(Date.parse(proof.checkedAt)>=before);assert.equal(reads(),2);assert.equal(proof.code,undefined);assert.equal(proof.encryptedCode,undefined);assert.equal(proof.codeHash,undefined);
});
test('strict request validation denies changed schema and unnormalized identities',async()=>{
 for(const patch of [{code:'A123'},{canViewPrices:true},{email:'UPPER@example.test'},{companyId:'bad'},{companyUpdatedAt:'NaN'},{codeSha256:'bad'},{name:'x\r\nBcc:x'},{contactId:undefined}])await assert.rejects(load().m.verifySenderAccess({...request,...patch}),e=>e.status===400);
});
test('every supplied identity and version must match freshly read snapshot',async()=>{
 for(const key of ['companyId','contactId','credentialId','companyUpdatedAt','name','email'])await assert.rejects(load({snapshot:{[key]:'different'}}).m.verifySenderAccess(request),e=>e.status===409);
 await assert.rejects(load({missing:true}).m.verifySenderAccess(request),e=>e.status===409);
 await assert.rejects(load().m.verifySenderAccess({...request,codeSha256:'0'.repeat(64)}),e=>e.status===409);
});
test('decrypt/integrity failures remain generic, resolver mismatches denied',async()=>{
 for(const option of [{decryptError:true},{code:'invalid'},{fingerprint:'bad'}])await assert.rejects(load(option).m.verifySenderAccess(request),e=>e.status===503&&!e.message.includes('private cipher'));
 for(const option of [{unresolved:true},{resolved:{id:'wrong'}},{resolved:{name:'wrong'}},{resolved:{email:'wrong'}}])await assert.rejects(load(option).m.verifySenderAccess(request),e=>e.status===409);
});
test('concurrent suppression/revocation/version or credential changes deny proof',async()=>{
 for(const change of [null,{name:'changed'},{codeHash:'changed'},{encryptedCode:'changed'}]){
  const initial=load();const after=change===null?null:{...initial.snap,...change};await assert.rejects(load({after}).m.verifySenderAccess(request),e=>e.status===409);
 }
});
test('welcome shares exact public UTF-16 truncation including long astral names',async()=>{
 const name='가'.repeat(99)+'🌍';const proof=await load({snapshot:{name}}).m.verifySenderAccess({...request,name});
 assert.equal(proof.welcomeCompany,name.slice(0,100));
 const publicRoute=readFileSync(new URL('../../../app/api/swatches/access/route.ts',import.meta.url),'utf8');assert.match(publicRoute,/customerWelcomeName\(matches\[0\]\.name\)/);
});
test('sender authentication precedes reading request body or verification',async()=>{
 let bodyRead=false,verified=false;
 const route=module('../../../app/api/crm/machine/sender/verify-access/route.ts',{
  '@/lib/crm/auth':{bodyObject:async()=>{bodyRead=true;return request;}},
  '@/lib/crm/sender':{requireSender:()=>{throw new CrmError(401,'denied');}},
  '@/lib/crm/sender-access-check':{verifySenderAccess:async()=>{verified=true;}},
  '@/lib/crm/http':{failure:e=>new Response(null,{status:e.status})},'@/app/api/swatches/session':{json:x=>Response.json(x)},
 });assert.equal((await route.POST({headers:new Headers()})).status,401);assert.equal(bodyRead,false);assert.equal(verified,false);
});
