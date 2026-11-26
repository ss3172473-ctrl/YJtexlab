import 'server-only';
import { CrmError, rpc, supabase } from './client';
import { crmFingerprint, decryptCode, encryptCode, newCode } from './crypto';
import type { Company } from '@/app/api/swatches/sheets';

type Contact = { id: string; email: string; is_primary: boolean; suppressed: boolean };
type Row = { id: string; name: string; can_view_prices: boolean; updated_at: string; crm_contacts: Contact[]; crm_access_credentials?: { id: string; revoked_at: string | null }[] };
const select = 'id,name,can_view_prices,updated_at,crm_contacts(id,email,is_primary,suppressed),crm_access_credentials(id,revoked_at)';
export function companyDto(row: Row) {
  return { id: row.id, name: row.name, canViewPrices: row.can_view_prices, updatedAt: row.updated_at,
    contacts: row.crm_contacts.map(c => ({ id: c.id, email: c.email, isPrimary: c.is_primary, suppressed: c.suppressed })),
    codeIssued: Boolean(row.crm_access_credentials?.some(c => !c.revoked_at)) };
}
export function companyId(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new CrmError(400, '업체를 확인해 주세요.');
  return value;
}
export function nameInput(value: unknown) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 200) throw new CrmError(400, '업체명을 확인해 주세요.');
  return value.trim();
}
export function emailInput(value: unknown) {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@;,]+@[^\s@;,]+\.[^\s@;,]+$/.test(value.trim())) throw new CrmError(400, '이메일 주소 하나를 입력해 주세요.');
  return value.trim().toLowerCase();
}
export async function listCompanies(query = '', offset = 0) {
  const rows = await rpc<Row[]>('crm_list_companies', { p_query: query.trim().slice(0,200), p_offset: offset, p_limit: 101 });
  return { companies: rows.slice(0,100).map(companyDto), nextOffset: rows.length > 100 ? offset + 100 : null };
}
export async function getCompany(id: string) {
  const rows = await supabase<Row[]>(`/rest/v1/crm_companies?id=eq.${companyId(id)}&select=${select}`);
  if (rows.length !== 1) throw new CrmError(404, '업체를 찾을 수 없습니다.');
  return companyDto(rows[0]);
}
export async function createCompany(name: string, email: string, actor: string) {
  const id = await rpc<string>('crm_save_company', { p_id: null, p_name: name, p_email: email, p_prices: null, p_expected: null, p_actor: actor });
  return getCompany(id);
}
export async function updateCompany(id: string, body: Record<string, unknown>, actor: string) {
  if (typeof body.expectedUpdatedAt !== 'string') throw new CrmError(400, '변경 전 업체 상태를 확인해 주세요.');
  if (body.canViewPrices !== undefined && typeof body.canViewPrices !== 'boolean') throw new CrmError(400, '가격 공개 설정을 확인해 주세요.');
  await rpc('crm_save_company', { p_id: companyId(id), p_name: body.name === undefined ? null : nameInput(body.name), p_email: body.email === undefined ? null : emailInput(body.email), p_prices: body.canViewPrices ?? null, p_expected: body.expectedUpdatedAt, p_actor: actor });
  return getCompany(id);
}
export async function manageCode(id: string, action: unknown, actor: string, expected?: unknown) {
  if (!['issue','reissue','revoke'].includes(String(action))) throw new CrmError(400, '코드 작업을 확인해 주세요.');
  if (expected !== undefined && typeof expected !== 'string') throw new CrmError(400, '업체 상태를 확인해 주세요.');
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = action === 'revoke' ? '' : newCode();
    try {
      const result = await rpc<{ encrypted_code: string | null }>('crm_manage_code', {
        p_id: companyId(id), p_action: action, p_actor: actor, p_expected: expected ?? null,
        p_hash: code ? crmFingerprint(code) : null, p_encrypted: code ? encryptCode(code) : null,
      });
      return result.encrypted_code ? { code: decryptCode(result.encrypted_code) } : {};
    } catch (error) {
      if (!(error instanceof CrmError) || error.status !== 409 || error.message !== '이미 등록된 이메일 또는 코드입니다.' || attempt === 7) throw error;
    }
  }
  throw new CrmError(503, '코드를 발급하지 못했습니다.');
}
export async function resolveFingerprint(fingerprint: string): Promise<Company | null> {
  if (!/^[\w-]{43}$/.test(fingerprint)) return null;
  type Credential = { company_id: string; crm_companies: Row };
  const rows = await supabase<Credential[]>(`/rest/v1/crm_access_credentials?code_hash=eq.${fingerprint}&revoked_at=is.null&select=company_id,crm_companies(id,name,can_view_prices,updated_at,crm_contacts(id,email,is_primary,suppressed))&limit=2`);
  if (rows.length !== 1) return null;
  const row = rows[0].crm_companies;
  const contact = row.crm_contacts.find(c => c.is_primary);
  // Suppression controls email delivery, not catalog access; revoke is explicit.
  return { id: row.id, name: row.name, email: contact?.email ?? '', code: '', canViewPrices: row.can_view_prices };
}
export async function logCrmAccess(company: Company, campaign: string) {
  await supabase('/rest/v1/crm_access_events', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ company_id: company.id, campaign }) });
}
