import 'server-only';
import { createHash } from 'node:crypto';
import { customerCode } from '@/app/swatches/customer-code';
import { customerWelcomeName } from '@/app/swatches/welcome-name';
import { CrmError, rpc } from './client';
import { resolveFingerprint } from './companies';
import { crmFingerprint, decryptCode } from './crypto';

const keys = ['companyId', 'contactId', 'credentialId', 'companyUpdatedAt', 'name', 'email', 'codeSha256'] as const;
type Input = Record<typeof keys[number], string>;
type Snapshot = Omit<Input, 'codeSha256'> & { encryptedCode: string; codeHash: string };
function input(body: Record<string, unknown>): Input {
  if (Object.keys(body).length !== keys.length || Object.keys(body).some(k => !keys.includes(k as keyof Input))
    || keys.some(k => typeof body[k] !== 'string')) throw new CrmError(400, 'Invalid access verification request.');
  const value = body as Input;
  for (const key of ['companyId', 'contactId', 'credentialId'] as const)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value[key])) throw new CrmError(400, 'Invalid access verification identity.');
  if (!/^[^\r\n\x00]{1,200}$/.test(value.name) || !/^[^\s@;,<>]+@[^\s@;,<>]+\.[^\s@;,<>]+$/.test(value.email)
    || value.email.length > 254 || value.email !== value.email.toLowerCase()
    || !/^[a-f0-9]{64}$/.test(value.codeSha256)
    || value.companyUpdatedAt.length > 50 || !/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/.test(value.companyUpdatedAt)
    || !Number.isFinite(Date.parse(value.companyUpdatedAt))) throw new CrmError(400, 'Invalid access verification snapshot.');
  return value;
}
function assertSnapshot(snapshot: Snapshot | null, expected: Input): asserts snapshot is Snapshot {
  if (!snapshot || keys.some(k => k !== 'codeSha256' && snapshot[k] !== expected[k]))
    throw new CrmError(409, 'Sender access snapshot is stale or unavailable.');
}
export async function verifySenderAccess(body: Record<string, unknown>) {
  const expected = input(body);
  const params = { p_company: expected.companyId };
  const snapshot = await rpc<Snapshot | null>('crm_sender_snapshot', params);
  assertSnapshot(snapshot, expected);
  let code: string | null;
  try { code = customerCode(decryptCode(snapshot.encryptedCode)); }
  catch { throw new CrmError(503, 'Access credential integrity validation failed.'); }
  if (!code || crmFingerprint(code) !== snapshot.codeHash) throw new CrmError(503, 'Access credential integrity validation failed.');
  if (createHash('sha256').update(code).digest('hex') !== expected.codeSha256) throw new CrmError(409, 'Sender access code changed.');
  // Same read-only resolver and welcome formatting as /api/swatches/access.
  // Do not invoke the public handler: it creates sessions and access analytics.
  const resolved = await resolveFingerprint(snapshot.codeHash);
  if (!resolved || resolved.id !== expected.companyId || resolved.name !== expected.name || resolved.email !== expected.email)
    throw new CrmError(409, 'Sender access identity does not match.');
  const welcomeCompany = customerWelcomeName(resolved.name);
  const current = await rpc<Snapshot | null>('crm_sender_snapshot', params);
  assertSnapshot(current, expected);
  if (current.codeHash !== snapshot.codeHash || current.encryptedCode !== snapshot.encryptedCode)
    throw new CrmError(409, 'Sender access changed during verification.');
  // This observation is not a delivery lease. Existing claim/begin guards remain authoritative.
  return { ...expected, accessGranted: true, welcomeCompany, checkedAt: new Date().toISOString(), method: 'server_access_resolver', browserVerified: false };
}
