import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CrmError, rpc, supabaseEnabled } from './client';
import { crmFingerprint, decryptCode } from './crypto';

export function requireSender(headers: Headers) {
  const configured = process.env.CRM_SENDER_TOKEN;
  if (!supabaseEnabled() || !configured || configured.length < 32) throw new CrmError(503, 'Sender connection is not configured.');
  const value = headers.get('authorization') ?? '';
  const supplied = value.startsWith('Bearer ') ? value.slice(7) : '';
  const hash = (s: string) => createHash('sha256').update(s).digest();
  if (supplied.length > 512 || !timingSafeEqual(hash(supplied), hash(configured))) throw new CrmError(401, 'Sender authentication required.');
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function required(body: Record<string, unknown>, key: string, pattern: RegExp, max = 300) {
  const value = body[key];
  if (typeof value !== 'string' || value.length > max || !pattern.test(value)) throw new CrmError(400, `Invalid ${key}.`);
}
export function senderInput(body: Record<string, unknown>) {
  const fields: Record<string, string[]> = {
    claim: ['action','operationId','companyId','contactId','credentialId','companyUpdatedAt','name','email','messageId','mimeSha256','inboundCheckedAt'],
    begin: ['action','operationId','leaseToken'],
    bounce: ['action','operationId','providerMessageId','messageId','email','bounceMessageId','bouncedAt','statusCode','originalMessageId'],
    receipt: ['action','operationId','leaseToken','outcome','providerMessageId','providerThreadId'],
  };
  const action = String(body.action), allowed = fields[action];
  if (!allowed || Object.keys(body).some(k => !allowed.includes(k))) throw new CrmError(400, 'Unsupported sender fields.');
  required(body,'operationId',/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/);
  if (action === 'bounce') {
    required(body,'originalMessageId',/^<[^\s<>]+@[^\s<>]+>$/);
    for (const k of ['providerMessageId','bounceMessageId']) required(body,k,/^[A-Za-z0-9_-]{1,200}$/);
    required(body,'messageId',/^<[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+>$/);
    required(body,'email',/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/,254);
    if (body.email !== String(body.email).toLowerCase()) throw new CrmError(400,'Email must be normalized.');
    required(body,'statusCode',/^5\.\d{1,3}\.\d{1,3}$/);
    required(body,'bouncedAt',/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/);
    if (!Number.isFinite(Date.parse(String(body.bouncedAt)))) throw new CrmError(400,'Invalid bouncedAt.');
  } else if (action === 'claim') {
    for (const k of ['companyId','contactId','credentialId']) required(body,k,uuid);
    required(body,'name',/^[^\r\n\x00]{1,200}$/);
    required(body,'email',/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/,254);
    if (body.email !== String(body.email).toLowerCase()) throw new CrmError(400,'Email must be normalized.');
    required(body,'messageId',/^<[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+>$/);
    required(body,'mimeSha256',/^[a-f0-9]{64}$/);
    for (const k of ['companyUpdatedAt','inboundCheckedAt']) {
      required(body,k,/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/);
      if (!Number.isFinite(Date.parse(String(body[k])))) throw new CrmError(400,`Invalid ${k}.`);
    }
  } else {
    required(body,'leaseToken',uuid);
    if (action === 'receipt') {
      if (!['sent','uncertain'].includes(String(body.outcome))) throw new CrmError(400,'Invalid outcome.');
      if (body.outcome === 'sent') required(body,'providerMessageId',/^[A-Za-z0-9_-]{1,200}$/);
      if (body.providerThreadId !== undefined) required(body,'providerThreadId',/^[A-Za-z0-9_-]{1,200}$/);
      if (body.outcome === 'uncertain' && (body.providerMessageId !== undefined || body.providerThreadId !== undefined)) throw new CrmError(400,'Uncertain receipt cannot assert provider delivery.');
    }
  }
  return body;
}
type Snapshot = Record<string, unknown> & { encryptedCode: string; codeHash: string };
function reveal(snapshot: Snapshot) {
  const { encryptedCode, codeHash, ...safe } = snapshot;
  const code = decryptCode(encryptedCode);
  if (crmFingerprint(code) !== codeHash) throw new CrmError(503, 'Credential integrity validation failed.');
  return { ...safe, code };
}
export async function senderCandidates() {
  return (await rpc<Snapshot[]>('crm_sender_candidates', {})).map(reveal);
}
export async function senderTransition(body: Record<string, unknown>) {
  const input = senderInput(body);
  const result = await rpc<Record<string, unknown>>(input.action === 'bounce' ? 'crm_sender_record_bounce' : 'crm_sender_transition', { p_body: input });
  if (typeof result.error === 'string') throw new CrmError(409, result.error);
  const { snapshot, ...receipt } = result;
  return { ...receipt, ...(snapshot ? { snapshot: reveal(snapshot as Snapshot) } : {}) };
}

export async function senderDeliveryReceipts() {
  return rpc<Record<string, unknown>[]>('crm_sender_delivery_receipts', {});
}
