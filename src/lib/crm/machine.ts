import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { CrmError, rpc, supabaseEnabled } from './client';
import { emailInput, nameInput } from './companies';
import { crmFingerprint, encryptCode, newCode } from './crypto';

export function requireCollector(headers: Headers) {
  const configured = process.env.CRM_COLLECTOR_TOKEN;
  if (!supabaseEnabled() || !configured || configured.length < 32) throw new CrmError(503, 'Collector connection is not configured.');
  const value = headers.get('authorization') ?? '';
  const supplied = value.startsWith('Bearer ') ? value.slice(7) : '';
  const digest = (s: string) => createHash('sha256').update(s).digest();
  if (supplied.length > 512 || !timingSafeEqual(digest(supplied), digest(configured))) throw new CrmError(401, 'Collector authentication required.');
}
export function registrationInput(body: Record<string, unknown>) {
  if (Object.keys(body).some(key => !['operationId','name','email','sourceUrl','provenance'].includes(key))) throw new CrmError(400, 'Unsupported collector field.');
  if (typeof body.operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(body.operationId)) throw new CrmError(400, 'Invalid operation ID.');
  const name = nameInput(body.name), email = emailInput(body.email);
  if (typeof body.sourceUrl !== 'string' || body.sourceUrl.length > 2000) throw new CrmError(400, 'Invalid source URL.');
  let sourceUrl: string;
  try {
    const url = new URL(body.sourceUrl);
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) throw new Error();
    url.hash = ''; sourceUrl = url.toString();
  } catch { throw new CrmError(400, 'Invalid source URL.'); }
  if (typeof body.provenance !== 'string' || !body.provenance.trim() || body.provenance.length > 2000) throw new CrmError(400, 'Collection evidence is required.');
  const payload = { name, email, sourceUrl, provenance: body.provenance.trim() };
  return { operationId: body.operationId, ...payload, digest: createHash('sha256').update(JSON.stringify(payload)).digest('hex') };
}
export async function registerCollectedCompany(body: Record<string, unknown>) {
  const input = registrationInput(body);
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = newCode();
    try {
      const receipt = await rpc<Record<string, unknown>>('crm_register_collected_company', {
        p_operation: input.operationId, p_digest: input.digest, p_name: input.name, p_email: input.email,
        p_source_url: input.sourceUrl, p_provenance: input.provenance,
        p_hash: crmFingerprint(code), p_encrypted: encryptCode(code),
      });
      if (receipt.error === 'operation_payload_conflict') throw new CrmError(409, 'Operation ID already belongs to a different payload.');
      if (receipt.error === 'ambiguous_contact') throw new CrmError(409, 'Contact matches multiple companies; owner review required.');
      return receipt;
    } catch (error) {
      if (!(error instanceof CrmError) || error.status !== 409 || error.message !== '이미 등록된 이메일 또는 코드입니다.' || attempt === 7) throw error;
    }
  }
  throw new CrmError(503, 'Registration unavailable.');
}
