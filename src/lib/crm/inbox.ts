import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { CrmError, rpc, supabaseEnabled } from './client';
export const inboxMailbox = 'hello@yjtexlab.com';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const history = /^[0-9]{1,40}$/;
const messageId = /^<[^\s<>]{1,250}@[^\s<>]{1,250}>$/;
const email = /^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/;
export function requireInbox(headers: Headers) {
  const configured = process.env.CRM_MACHINE_TOKEN;
  if (!supabaseEnabled() || !configured || configured.length < 32) throw new CrmError(503, 'CRM inbox connection is not configured.');
  const raw = headers.get('authorization') ?? '';
  const supplied = raw.startsWith('Bearer ') ? raw.slice(7) : '';
  const hash = (s: string) => createHash('sha256').update(s).digest();
  if (supplied.length > 512 || !timingSafeEqual(hash(supplied),hash(configured))) throw new CrmError(401,'CRM inbox authentication required.');
}
function string(value: unknown, label: string, max: number, pattern?: RegExp) {
  if (typeof value !== 'string' || value.length > max || (pattern && !pattern.test(value))) throw new CrmError(400,`Invalid ${label}.`);
  return value;
}
function address(value: unknown) {
  const v=string(value,'email',254,email);
  if(v !== v.toLowerCase()) throw new CrmError(400,'Email must be normalized.');
  return v;
}
function object(value: unknown): Record<string,unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CrmError(400,'Expected object.');
  return value as Record<string,unknown>;
}
function only(body: Record<string,unknown>, fields: string[]) {
  if(Object.keys(body).some(k=>!fields.includes(k))) throw new CrmError(400,'Unsupported inbox field.');
}
export function inboxMessage(value: unknown) {
  const body=object(value);
  only(body,['providerMessageId','providerThreadId','rfcMessageId','fromEmail','toEmails','inReplyTo','references','receivedAt','subject','textBody','classification','classificationEvidence']);
  const id=string(body.providerMessageId,'providerMessageId',200,/^[A-Za-z0-9_-]+$/);
  const thread=string(body.providerThreadId,'providerThreadId',200,/^[A-Za-z0-9_-]+$/);
  const rfc=body.rfcMessageId === null ? null : string(body.rfcMessageId,'rfcMessageId',512,messageId);
  const from=address(body.fromEmail);
  if(from===inboxMailbox || !Array.isArray(body.toEmails) || body.toEmails.length<1 || body.toEmails.length>30) throw new CrmError(400,'Invalid inbound recipients.');
  const to=Array.from(new Set(body.toEmails.map(address))).sort();
  if(!to.includes(inboxMailbox)) throw new CrmError(400,'Message is not addressed to company mailbox.');
  const reply=body.inReplyTo === null ? null : string(body.inReplyTo,'inReplyTo',512,messageId);
  if(!Array.isArray(body.references) || body.references.length>100) throw new CrmError(400,'Invalid References.');
  const references=body.references.map(v=>string(v,'reference',512,messageId));
  const received=string(body.receivedAt,'receivedAt',40,/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/);
  if(!Number.isFinite(Date.parse(received)) || Date.parse(received)>Date.now()+30_000) throw new CrmError(400,'Invalid receipt time.');
  const subject=string(body.subject,'subject',500);
  const textBody=string(body.textBody,'textBody',16_000);
  const classification=string(body.classification,'classification',30);
  if(!['reply','auto_response','optout','bounce','other'].includes(classification)) throw new CrmError(400,'Invalid classification.');
  const classificationEvidence=string(body.classificationEvidence,'classificationEvidence',1000);
  const payload={providerMessageId:id,providerThreadId:thread,rfcMessageId:rfc,fromEmail:from,toEmails:to,inReplyTo:reply,references,receivedAt:new Date(received).toISOString(),subject,textBody,classification,classificationEvidence};
  return {...payload,digest:createHash('sha256').update(JSON.stringify(payload)).digest('hex')};
}
export function inboxInput(value: unknown) {
  const body=object(value);
  const action=String(body.action);
  const fields: Record<string,string[]>={acquire:['action','runId'],renew:['action','leaseToken'],release:['action','leaseToken'],ingest:['action','leaseToken','messages'],checkpoint:['action','leaseToken','expectedHistoryId','historyId','expectedInventoryRevision']};
  if(!fields[action]) throw new CrmError(400,'Invalid inbox action.');
  only(body,fields[action]);
  if(action==='acquire') return {action,runId:string(body.runId,'runId',128,/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/)};
  const leaseToken=string(body.leaseToken,'leaseToken',36,uuid);
  if(action==='ingest') {
    if(!Array.isArray(body.messages) || body.messages.length<1 || body.messages.length>20) throw new CrmError(400,'Expected1–20 inbox messages.');
    return {action,leaseToken,messages:body.messages.map(inboxMessage)};
  }
  if(action==='checkpoint') return {action,leaseToken,expectedInventoryRevision:string(body.expectedInventoryRevision,'expectedInventoryRevision',32,/^[a-f0-9]{32}$/),expectedHistoryId:body.expectedHistoryId===null?null:string(body.expectedHistoryId,'expectedHistoryId',40,history),historyId:string(body.historyId,'historyId',40,history)};
  return {action,leaseToken};
}
export async function inboxBody(request: NextRequest) {
  const reader=request.body?.getReader();
  if(!reader) throw new CrmError(400,'Body required.');
  let bytes=0; const chunks:Uint8Array[]=[];
  try {
    for(;;) {const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>262_144)throw new CrmError(413,'Inbox request too large.');chunks.push(value);}
    try {return object(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{throw new CrmError(400,'Invalid inbox JSON.');}
  } finally {void reader.cancel().catch(()=>undefined);}
}
export function inboxThreads() {return rpc<Record<string,unknown>>('crm_inbox_threads',{});}
export function inboxState() {return rpc<Record<string,unknown>>('crm_inbox_state',{});}
export async function inboxTransition(body: Record<string,unknown>) {
  const result=await rpc<Record<string,unknown>>('crm_inbox_transition',{p_body:inboxInput(body)});
  if(typeof result.error==='string') throw new CrmError(409,result.error);
  return result;
}
