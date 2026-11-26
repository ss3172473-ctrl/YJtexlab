import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CrmError, rpc, supabase, supabaseEnabled } from './client';
import { companyId } from './companies';
export function requireApprovalWorker(headers: Headers) {
  const secret = process.env.CRM_APPROVAL_WORKER_TOKEN;
  if (!supabaseEnabled() || !secret || secret.length < 32) throw new CrmError(503, 'Approval worker is not configured.');
  const authorization = headers.get('authorization') ?? '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const hash = (s: string) => createHash('sha256').update(s).digest();
  if (supplied.length > 512 || !timingSafeEqual(hash(supplied),hash(secret))) throw new CrmError(401, 'Approval worker authentication required.');
}
function keys(body: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(body).some(k => !allowed.includes(k))) throw new CrmError(400, 'Unsupported approval field.');
}
function text(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || value.includes('\0')) throw new CrmError(400, `Invalid ${label}.`);
  return value.trim();
}
function timestamp(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw new CrmError(400, 'Invalid company version.');
  return value;
}
export function approvalInput(body: Record<string, unknown>) {
  const action = body.action;
  if (action === 'create') {
    keys(body,['action','operationId','kind','companyId','contactId','expectedUpdatedAt','inboundMessageId','inboxDigest','subject','textBody','canViewPrices']);
    if (typeof body.operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(body.operationId)) throw new CrmError(400,'Invalid operation ID.');
    const common = { operationId: body.operationId, kind: body.kind, companyId: companyId(String(body.companyId)), expectedUpdatedAt: timestamp(body.expectedUpdatedAt) };
    let payload;
    if (body.kind === 'reply') {
      if (body.canViewPrices !== undefined || typeof body.inboxDigest !== 'string' || !/^[a-f0-9]{64}$/.test(body.inboxDigest)) throw new CrmError(400,'Invalid reply draft.');
      const subject = text(body.subject,998,'subject');
      if (/[\r\n]/.test(subject)) throw new CrmError(400,'Invalid subject.');
      payload = { ...common, contactId: companyId(String(body.contactId)), inboundMessageId: companyId(String(body.inboundMessageId)), inboxDigest: body.inboxDigest, subject, textBody: text(body.textBody,6000,'reply body') };
    } else if (body.kind === 'price') {
      if (typeof body.canViewPrices !== 'boolean' || ['contactId','inboundMessageId','inboxDigest','subject','textBody'].some(k=>body[k]!==undefined)) throw new CrmError(400,'Invalid price draft.');
      payload = {...common,canViewPrices:body.canViewPrices};
    } else throw new CrmError(400,'Unsupported approval kind.');
    return { action, id: null, body: { ...payload, requestDigest: createHash('sha256').update(JSON.stringify(payload)).digest('hex') } };
  }
  const id = companyId(String(body.id));
  if (action === 'bind') {
    keys(body,['action','id','payloadDigest','messageTs']);
    if (typeof body.payloadDigest!=='string' || !/^[a-f0-9]{64}$/.test(body.payloadDigest) || typeof body.messageTs!=='string' || !/^\d{10,}\.[0-9]{6}$/.test(body.messageTs)) throw new CrmError(400,'Invalid card binding.');
    return { action,id,body:{payloadDigest:body.payloadDigest,messageTs:body.messageTs} };
  }
  if (action === 'claim' || action === 'execute_price') { keys(body,['action','id']);return {action,id,body:{}}; }
  if (action === 'complete') {
    keys(body,['action','id','executionId','outcome','providerMessageId']);
    if (!['succeeded','uncertain'].includes(String(body.outcome))) throw new CrmError(400,'Invalid execution outcome.');
    const executionId=companyId(String(body.executionId));
    const providerMessageId=body.outcome==='succeeded'?text(body.providerMessageId,200,'provider receipt'):null;
    if(providerMessageId && !/^[A-Za-z0-9_-]+$/.test(providerMessageId)) throw new CrmError(400,'Invalid provider receipt.');
    return {action,id,body:{executionId,outcome:body.outcome,providerMessageId}};
  }
  throw new CrmError(400,'Unsupported approval operation.');
}
function checked(result: Record<string, unknown>) {
  if (result.error) throw new CrmError(result.error === 'not_found' ? 404 : 409, `Approval cannot proceed: ${String(result.error)}.`);
  return result;
}
export async function approvalOperation(body: Record<string, unknown>) {
  const parsed=approvalInput(body);
  return checked(await rpc<Record<string,unknown>>('crm_approval_operation',{p_action:parsed.action,p_id:parsed.id,p_body:parsed.body}));
}
export async function approvedActions() {
  return supabase('/rest/v1/crm_approval_actions?state=eq.approved&select=id,kind,approved_at,expires_at&order=approved_at.asc&limit=100');
}
export async function decideApproval(decision: {id:string;digest:string;decision:string;messageTs:string;actor:string}) {
  return checked(await rpc<Record<string,unknown>>('crm_decide_approval',{p_id:decision.id,p_digest:decision.digest,p_decision:decision.decision,p_message_ts:decision.messageTs,p_actor:decision.actor}));
}
