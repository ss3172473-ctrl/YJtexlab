import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { prepareSnapshot } from '../../../../scripts/import-crm-sheet.mjs';
const require = createRequire(import.meta.url);
function load(name, env = {}, dependencies = {}, fetchImpl = fetch) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>n==='server-only'?{}:dependencies[n] ?? require(n),process:{env},Buffer,URL,AbortSignal,fetch:fetchImpl});
  return exports;
}
const env = { CRM_CODE_HASH_KEY:'fixture-only-key-with-at-least-32-characters',CRM_CODE_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64') };
test('code encryption authenticates, HMAC deterministic, generated legacy-compatible format',()=>{
  const crypto = load('crypto',env);
  const encrypted = crypto.encryptCode('A123');
  assert.equal(crypto.decryptCode(encrypted),'A123');
  assert.notEqual(encrypted,crypto.encryptCode('A123'));
  assert.equal(crypto.crmFingerprint('A123'),crypto.crmFingerprint('A123'));
  assert.notEqual(crypto.crmFingerprint('A123'),crypto.crmFingerprint('B123'));
  assert.throws(()=>crypto.decryptCode(encrypted.slice(0,-3)+'xxx'));
  for(let i=0;i<100;i++) assert.match(crypto.newCode(),/^(?=.*[0-9])(?=.*[A-Z])[A-Z0-9]{4}$/);
});
test('snapshot retains identities, splits contacts, immediately issues blank-active codes, revokes explicit disabled, omits raw code metadata',()=>{
  const rows=[['업체명','이메일','고객 코드','활성 상태','가격 공개','접촉 상태'],['A','a@example.com; b@example.com','A123','','','반송'],['B','b@example.org','B123','비활성','공개','']];
  const {data,summary}=prepareSnapshot(rows,{source:'fixture',hashKey:env.CRM_CODE_HASH_KEY,encryptionKey:Buffer.from(env.CRM_CODE_ENCRYPTION_KEY,'base64')});
  assert.equal(summary.codes,2);assert.equal(summary.contacts,3);assert.equal(summary.revoked,1);
  assert.equal(data[0].revoked,false);assert.equal(data[1].revoked,true);assert.equal(data[0].contacts[1].suppressed,true);
  assert.equal(data[0].legacy_metadata['고객 코드'],undefined);assert.ok(!JSON.stringify(data).includes('A123'));
  assert.equal(data[1].can_view_prices,true);
  const changed=prepareSnapshot([rows[0],['A','a@example.com','C123','','','반송']],{source:'fixture',hashKey:env.CRM_CODE_HASH_KEY,encryptionKey:Buffer.from(env.CRM_CODE_ENCRYPTION_KEY,'base64')});
  assert.notEqual(data[0].legacy_metadata.source_digest,changed.data[0].legacy_metadata.source_digest);
  assert.throws(()=>prepareSnapshot([rows[0],rows[1],rows[1]],{source:'fixture',hashKey:env.CRM_CODE_HASH_KEY,encryptionKey:Buffer.from(env.CRM_CODE_ENCRYPTION_KEY,'base64')}),/Duplicate code/);
});
test('Auth uses publishable apikey only, data uses service; errors do not expose database text',async()=>{
  const calls=[];
  const client=load('client',{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'secret',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},{},async(url,options)=>{calls.push(options);return new Response('{}',{status:200});});
  await client.supabase('/auth/v1/otp'); await client.supabase('/auth/v1/user',{},'user-jwt');await client.supabase('/rest/v1/crm_companies');
  assert.equal(calls[0].headers.Authorization,undefined);assert.equal(calls[1].headers.Authorization,'Bearer user-jwt');assert.equal(calls[2].headers.Authorization,'Bearer secret');
});
test('Admin allows only verified fixed owner and never trusts user metadata',async()=>{
  class CrmError extends Error {constructor(status,message){super(message);this.status=status;}}
  let user={id:'owner',email:'yjtexlab@gmail.com',email_confirmed_at:'2026-01-01'};
  const auth=load('auth',{}, {'./client':{CrmError,supabase:async()=>user},'@/app/api/swatches/session':{sameOrigin:()=>true}});
  const request={cookies:{get:()=>({value:'header.payload.signature'})}};
  assert.equal((await auth.requireAdmin(request)).id,'owner');
  user={id:'bad',email:'bad@example.com',email_confirmed_at:'2026-01-01',user_metadata:{role:'admin'}};
  await assert.rejects(auth.requireAdmin(request),e=>e.status===403);
  user={id:'bad',email:'yjtexlab@gmail.com'};
  await assert.rejects(auth.requireAdmin(request),e=>e.status===403);
});
test('Credential lookup queries only requested fingerprint and returns bound identity, no plaintext code',async()=>{
  let path=''; let results=[{company_id:'company',crm_companies:{id:'company',name:'A',can_view_prices:false,crm_contacts:[{email:'a@example.com',is_primary:true,suppressed:true}]}}];
  const companies=load('companies',{}, {'./client':{supabase:async p=>{path=p;return results;},rpc:async()=>{},CrmError:Error},'./crypto':{}});
  const result=await companies.resolveFingerprint('a'.repeat(43));
  assert.equal(result.id,'company');assert.equal(result.name,'A');assert.equal(result.email,'a@example.com');assert.equal(result.code,'');assert.equal(result.canViewPrices,false);
  assert.ok(path.includes('revoked_at=is.null'));assert.ok(path.includes('code_hash=eq.'));
  results=[];assert.equal(await companies.resolveFingerprint('a'.repeat(43)),null);
});

test('Magic-link token validates owner remotely before accepting expiry; invalid, anonymous, unconfirmed tokens rejected',async()=>{
  class CrmError extends Error {constructor(status,message){super(message);this.status=status;}}
  let calls=0;
  let user={id:'owner',email:'yjtexlab@gmail.com',email_confirmed_at:'2026-01-01'};
  const auth=load('auth',{}, {'./client':{CrmError,supabase:async()=>{calls++;return user;}},'@/app/api/swatches/session':{sameOrigin:()=>true}});
  const make=exp=>`header.${Buffer.from(JSON.stringify({exp})).toString('base64url')}.signature`;
  const token=make(Math.floor(Date.now()/1000)+7200);
  await auth.verifiedAdminToken(token);assert.equal(calls,1);assert.equal(auth.verifiedTokenLifetime(token),3600);
  assert.throws(()=>auth.verifiedTokenLifetime(make(1)),e=>e.status===401);
  assert.throws(()=>auth.verifiedTokenLifetime('header.e30.signature'),e=>e.status===401);
  await assert.rejects(auth.verifiedAdminToken('invalid'),e=>e.status===401);assert.equal(calls,1);
  user={id:'other',email:'attacker@example.com',email_confirmed_at:'2026-01-01',user_metadata:{role:'admin'}};
  await assert.rejects(auth.verifiedAdminToken(token),e=>e.status===403);
  user={id:'owner',email:'yjtexlab@gmail.com'};
  await assert.rejects(auth.verifiedAdminToken(token),e=>e.status===403);
  user={id:'owner',email:'yjtexlab@gmail.com',email_confirmed_at:'2026-01-01',is_anonymous:true};
  await assert.rejects(auth.verifiedAdminToken(token),e=>e.status===403);
});
test('Session magic-link exchange requires same origin, validates token, sets bounded HttpOnly cookie, never returns it',async()=>{
  class CrmError extends Error {constructor(status,message){super(message);this.status=status;}}
  let origin=true,validated=0; const calls=[];
  const response=(body,status=200)=>({body,status,cookies:{set(...args){this.value=args;}}});
  const auth={adminEmail:'yjtexlab@gmail.com',adminCookie:'yj_crm_admin',assertOrigin(){if(!origin)throw new CrmError(403,'denied');},bodyObject:async req=>req.body,requireAdmin:async()=>({email:'yjtexlab@gmail.com'}),verifiedAdminToken:async token=>{validated++;if(token==='bad')throw new CrmError(401,'bad');},verifiedTokenLifetime:()=>123};
  const route=load('../../app/api/crm/session/route',{NODE_ENV:'production'},{'@/lib/crm/auth':auth,'@/lib/crm/client':{CrmError,supabase:async(...args)=>{calls.push(args);return{};}},'@/lib/crm/http':{failure:e=>response({error:e.message},e.status)},'@/app/api/swatches/session':{json:response},'@/app/api/swatches/access/attempt-guard':{accessAttemptSource:()=>'',createAccessAttemptLimiter:()=>()=>0}});
  const request={body:{accessToken:'validated-jwt'},headers:{}};
  let result=await route.PUT(request);assert.equal(result.body.authenticated,true);assert.equal(validated,1);
  assert.equal(result.cookies.value[1],'validated-jwt');assert.equal(result.cookies.value[2].httpOnly,true);assert.equal(result.cookies.value[2].maxAge,123);assert.equal(result.cookies.value[2].secure,true);
  assert.ok(!JSON.stringify(result.body).includes('validated-jwt'));
  origin=false;result=await route.PUT(request);assert.equal(result.status,403);assert.equal(validated,1);
  origin=true;result=await route.PUT({body:{accessToken:'bad'},headers:{}});assert.equal(result.status,401);assert.equal(result.cookies.value,undefined);
  await route.POST({body:{email:'yjtexlab@gmail.com'},headers:{}});
  assert.equal(calls[0][0],'/auth/v1/otp?redirect_to=https%3A%2F%2Fyjtexlab.com%2Fadmin%2Fcrm');assert.equal(JSON.parse(calls[0][1].body).create_user,false);
});

test('PostgREST return=minimal accepts successful 201 empty bodies',async()=>{
  const client=load('client',{SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'secret',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'},{},async()=>new Response(null,{status:201}));
  assert.equal(await client.supabase('/rest/v1/crm_access_events',{method:'POST',headers:{Prefer:'return=minimal'},body:'{}'}),undefined);
});
