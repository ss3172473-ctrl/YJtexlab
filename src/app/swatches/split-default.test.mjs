import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
function load(name, extras={}) {
 const exports={};
 vm.runInNewContext(ts.transpileModule(readFileSync(new URL(name,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React}}).outputText,{exports,URLSearchParams,Uint8Array,TextDecoder,Blob,...extras});
 return exports;
}
const policy=load('./first-row-policy.ts');
test('intentional default rollout retains explicit old-path and baseline escape hatches',()=>{
 for(const [query,expected] of [['',true],['?other=x',true],['?swatchPerf=split',true],['?swatchPerf=firstrow',false],['?swatchPerf=baseline',false],['?swatchPerf=unknown',false],['?swatchPerf=',false],['?swatchPerf=split&swatchPerf=split',false],['?swatchPerf=baseline&swatchPerf=split',false]]) {
  assert.equal(policy.splitRowEnabled(query,false,false),expected,query);
  assert.equal(policy.splitRowEnabled(query,true,false),false);
  assert.equal(policy.splitRowEnabled(query,false,true),false);
 }
 assert.equal(policy.firstRowEnabled('?swatchPerf=firstrow'),true);
 assert.equal(policy.firstRowEnabled('?swatchPerf=baseline'),false);
});
function fixture(){
 const images=[],timers=new Map();let n=0;
 class Image {constructor(){this.src='';this.isConnected=false;images.push(this)} addEventListener(){} removeEventListener(){}}
 const runtime=load('./prepared-cover.tsx',{require:name=>name==='./first-row-policy'?policy:{},window:{Image,setTimeout:(f,ms)=>{timers.set(++n,{f,ms});return n},clearTimeout:id=>timers.delete(id)},URL,performance,AbortController,fetch:async()=>{throw Error('unexpected tail fetch')}});
 return {runtime,images,timers};
}
test('missing or rejected lead falls back to same authenticated original URL',async()=>{
 for(const promise of [Promise.resolve(undefined),Promise.reject(Error('fixture'))]){
  const f=fixture();let cancelled=0;const src='/api/swatches/photo?sku=S85&v=1';
  f.runtime.prepareSplitRow('width=390',[src],{image:promise,cancel:()=>cancelled++},'fixture');
  await Promise.resolve();await Promise.resolve();
  assert.equal(f.images[0].src,src);assert.equal(cancelled,1);
 }
});
test('stalled stream deadline falls back once and late bytes cannot replace it',async()=>{
 const f=fixture();let resolve,cancelled=0;const src='/api/swatches/thumbnail?sku=S1';
 const pending=new Promise(r=>resolve=r);
 f.runtime.prepareSplitRow('width=390',[src],{image:pending,cancel:()=>cancelled++},'fixture');
 [...f.timers.values()].find(t=>t.ms===2500).f();
 assert.equal(f.images[0].src,src);assert.equal(cancelled,1);
 resolve(new Blob(['late']));await Promise.resolve();
 assert.equal(f.images[0].src,src);
});
test('reset cancels lead and stale completion cannot populate a new visit',async()=>{
 const f=fixture();let resolve,cancelled=0;
 f.runtime.prepareSplitRow('width=390',['/api/swatches/thumbnail?sku=S1'],{image:new Promise(r=>resolve=r),cancel:()=>cancelled++},'fixture');
 f.runtime.resetPreparedCovers();resolve(new Blob(['stale']));await Promise.resolve();
 assert.equal(cancelled,1);assert.equal(f.images[0].src,'');
});
test('invalid source metadata is rejected without issuing image reads',()=>{
 for(const sources of [['https://example.com/a'],['/api/swatches/thumbnail?sku=S1','/api/swatches/thumbnail?sku=S1'],[]]){
  const f=fixture();let cancelled=0;f.runtime.prepareSplitRow('',sources,{image:Promise.resolve(),cancel:()=>cancelled++},'fixture');
  assert.equal(cancelled,1);assert.equal(f.images.length,0);
 }
});
