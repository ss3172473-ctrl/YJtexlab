import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CrmError, rpc, supabaseEnabled } from './client';
const fields: Record<string,string[]> = {
 collection:['collected','duplicates','queued','review'],
 send:['accepted','confirmedBounces','netAccepted','target','sentThisRun','blocked','uncertain'],
 crm:['scanned','inserted','duplicates','review','pendingApprovals','approvedPendingExecution','uncertain'],
 check:['checked','missing','failed','notConfigured'],
};
const evidenceTypes:Record<string,{kind:string;ref:RegExp}> = {
 collection:{kind:'collector_run',ref:/^[a-f0-9]{64}$/},
 send:{kind:'sender_day',ref:/^\d{4}-\d\d-\d\d$/},
 crm:{kind:'inbox_checkpoint',ref:/^[0-9]{1,40}$/},
 check:{kind:'watchdog_run',ref:/^[0-9]{1,30}$/},
};
export function requireHealth(headers:Headers) {
 const key=process.env.CRM_HEALTH_TOKEN;
 if(!supabaseEnabled()||!key||key.length<32)throw new CrmError(503,'Role receipt connection is not configured.');
 const raw=headers.get('authorization')??'', supplied=raw.startsWith('Bearer ')?raw.slice(7):'';
 const hash=(value:string)=>createHash('sha256').update(value).digest();
 if(supplied.length>512||!timingSafeEqual(hash(supplied),hash(key)))throw new CrmError(401,'Role receipt authentication required.');
}
function record(value:unknown):Record<string,unknown> {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new CrmError(400,'Expected object.');
 return value as Record<string,unknown>;
}
export function healthInput(value:unknown) {
 const body=record(value);
 if(Object.keys(body).some(k=>!['role','runId','phase','emittedAt','counts','evidence','codeSha'].includes(k)))throw new CrmError(400,'Unsupported receipt field.');
 const role=typeof body.role==='string'?body.role:'';
 if(!Object.hasOwn(fields,role))throw new CrmError(400,'Invalid role.');
 if(typeof body.runId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(body.runId))throw new CrmError(400,'Invalid run ID.');
 const phase=typeof body.phase==='string'?body.phase:'';
 if(!['started','completed','shortfall','needs_review','failed'].includes(phase))throw new CrmError(400,'Invalid phase.');
 let emittedAt:string|null=null;
 if(body.emittedAt!==undefined&&body.emittedAt!==null) {
  if(typeof body.emittedAt!=='string'||body.emittedAt.length>40||!/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/.test(body.emittedAt)||!Number.isFinite(Date.parse(body.emittedAt))||Date.parse(body.emittedAt)>Date.now()+30_000)throw new CrmError(400,'Invalid producer timestamp.');
  emittedAt=new Date(body.emittedAt).toISOString();
 }
 const counts=body.counts===undefined?{}:record(body.counts);
 for(const [key,n]of Object.entries(counts))if(!fields[role].includes(key)||typeof n!=='number'||!Number.isSafeInteger(n)||n<0||n>1_000_000_000)throw new CrmError(400,'Invalid aggregate count.');
 let evidence:null|{kind:string;ref:string}=null;
 if(body.evidence!==undefined&&body.evidence!==null) {
  const item=record(body.evidence), expected=evidenceTypes[role];
  if(Object.keys(item).some(k=>!['kind','ref'].includes(k))||item.kind!==expected.kind||typeof item.ref!=='string'||!expected.ref.test(item.ref))throw new CrmError(400,'Invalid typed evidence reference.');
  evidence={kind:expected.kind,ref:item.ref};
 }
 if(phase==='completed'&&!evidence)throw new CrmError(400,'Completed receipt requires evidence.');
 let codeSha:string|null=null;
 if(body.codeSha!==undefined&&body.codeSha!==null) {
  if(typeof body.codeSha!=='string'||!/^[a-f0-9]{40}$/.test(body.codeSha))throw new CrmError(400,'Invalid code revision.');
  codeSha=body.codeSha;
 }
 return {role,runId:body.runId,phase,emittedAt,counts,evidence,codeSha};
}
export function readHealth() {return rpc<Record<string,unknown>>('crm_role_health_read',{});}
export async function recordHealth(value:unknown) {
 const receipt=await rpc<Record<string,unknown>>('crm_role_health_record',{p_body:healthInput(value)});
 if(typeof receipt.error==='string')throw new CrmError(409,receipt.error);
 return receipt;
}
