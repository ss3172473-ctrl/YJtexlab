import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import ts from 'typescript';import {fileURLToPath} from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'../../../../..');
function load(file,requires={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:n=>requires[n],process:{env:{}},console:{error(){},warn(){}},URL,AbortController,setTimeout,clearTimeout,fetch,...globals});return exports;}
const config={url:'https://script.google.com/macros/s/test/exec',secret:'isolated-fake-secret'};
(async()=>{
 const helper=load('src/lib/contact-notification.ts');
 assert.equal(helper.contactRowNumber("'시트1'!A6:F6"),6);assert.equal(helper.contactRowNumber('Inquiries!A6:F7'),null);assert.equal(helper.contactRowNumber('Inquiries!A1:F1'),null);
 let calls=[];
 for(const status of ['sent','already_sent']) assert.equal(await helper.notifyContactRow(6,config,async(url,options)=>{calls.push({url,options});return{ok:true,json:async()=>({ok:true,status})}}),status);
 assert.equal(JSON.parse(calls[0].options.body).rowNumber,6);assert.equal(Object.keys(JSON.parse(calls[0].options.body)).sort().join(','),'rowNumber,secret');
 assert.equal(await helper.notifyContactRow(6,config,async()=>({ok:true,json:async()=>({ok:true,status:'uncertain'})})),'uncertain');
 assert.equal(await helper.notifyContactRow(6,config,async()=>{throw Error('fake sensitive error')}),'uncertain');
 assert.equal(await helper.notifyContactRow(6,{...config,url:'https://evil.invalid/exec'},()=>{throw Error('MUST_NOT_FETCH')}),'not_configured');
 assert.equal(await helper.notifyContactRow(6,{},()=>{throw Error('MUST_NOT_FETCH')}),'not_configured');
 const timeoutHelper=load('src/lib/contact-notification.ts',{}, {setTimeout:fn=>{queueMicrotask(fn);return 1},clearTimeout(){}});
 assert.equal(await timeoutHelper.notifyContactRow(6,config,async(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('abort'))))),'uncertain');
 const events=[];let failAppend=false;
 const values={get:async()=>({data:{values:[['Received At (KST)','Company / Name','Reply-to Email','Subject','Message','Source']]}}),update:async()=>{throw Error('UNEXPECTED_HEADER_WRITE')},append:async()=>{events.push('append');if(failAppend)throw Error('fake secret');return{data:{updates:{updatedRange:"'시트1'!A6:F6"}}};}};
 const google={auth:{GoogleAuth:class{}},sheets:()=>({spreadsheets:{values}})};
 const route=load('src/app/api/contact/route.ts',{'node:fs/promises':{readFile:async()=> '{}'},googleapis:{google},'next/server':{NextResponse:{json:(body,options)=>({body,status:options?.status||200})}},'@/lib/contact':{normalizeContactSubmission:x=>x,buildContactSheetRow:x=>Object.values(x)},'@/lib/contact-notification':{contactRowNumber:helper.contactRowNumber,notifyContactRow:async row=>{events.push('notify');assert.equal(row,6);return 'uncertain'}}},{process:{env:{GOOGLE_CONTACT_SPREADSHEET_ID:'fake-sheet',GOOGLE_SERVICE_ACCOUNT_JSON:'{}'}}});
 let result=await route.POST({json:async()=>({companyName:'Fake',replyTo:'fake@example.invalid',subject:'Test',message:'Test'})});assert.deepEqual(events,['append','notify']);assert.equal(result.status,200);assert.equal(result.body.saved,true);assert.equal(result.body.notification,'uncertain');
 failAppend=true;events.length=0;result=await route.POST({json:async()=>({})});assert.equal(result.status,503);assert.equal(result.body.saved,'unknown');assert.deepEqual(events,['append']);assert(!JSON.stringify(result).includes('fake secret'));
 console.log('PASS: row parsing, recipient payload minimization, sent/already_sent, unknown/provider/network errors, timeout, URL allowlist, missing config, saved-first, append-uncertain no mail/no leak. No external calls.');
})().catch(error=>{console.error(error);process.exitCode=1});
