import 'server-only';
import { customerCode } from '@/app/swatches/customer-code';
import { CrmError, rpc } from './client';
import { companyId, resolveFingerprint } from './companies';
import { crmFingerprint, decryptCode } from './crypto';

type Snapshot = { companyId: string; name: string; companyUpdatedAt: string; contactId: string; email: string; credentialId: string; encryptedCode: string; codeHash: string; canViewPrices: boolean };
export async function verifyCollectedAccess(id: string, body: Record<string, unknown>) {
  companyId(id);
  if (Object.keys(body).some(key => key !== 'operationId') || typeof body.operationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$/.test(body.operationId)) throw new CrmError(400, 'Invalid verification request.');
  const params = { p_company: id, p_operation: body.operationId };
  const prepared = await rpc<{ snapshot?: Snapshot; error?: string }>('crm_collector_verify_access', params);
  if (prepared.error || !prepared.snapshot) throw new CrmError(409, 'Collector access snapshot is unavailable.');
  const snap = prepared.snapshot;
  let code: string | null;
  try { code = customerCode(decryptCode(snap.encryptedCode)); }
  catch { throw new CrmError(503, 'Access credential verification failed.'); }
  if (!code || snap.companyId !== id || crmFingerprint(code) !== snap.codeHash) throw new CrmError(503, 'Access credential verification failed.');
  // The same resolver used by /api/swatches/access; this does not claim a browser render check.
  const resolved = await resolveFingerprint(snap.codeHash);
  if (!resolved || resolved.id !== id || resolved.name !== snap.name || resolved.email !== snap.email || resolved.canViewPrices !== snap.canViewPrices) throw new CrmError(503, 'Access identity verification failed.');
  const receipt = await rpc<Record<string, unknown>>('crm_collector_verify_access', { ...params, p_expected: snap });
  if (receipt.error) throw new CrmError(409, 'Access changed during verification. Retry with the current company.');
  return receipt;
}
