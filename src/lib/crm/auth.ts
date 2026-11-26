import 'server-only';
import type { NextRequest } from 'next/server';
import { CrmError, supabase } from './client';
import { sameOrigin } from '@/app/api/swatches/session';
export const adminEmails = ['yjtexlab@gmail.com', 'hello@yjtexlab.com'] as const;
export function allowedAdminEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return adminEmails.some(allowed => allowed === email) ? email : null;
}
export const adminCookie = 'yj_crm_admin';
type User = { id: string; email?: string; email_confirmed_at?: string; is_anonymous?: boolean };
export function assertOrigin(request: NextRequest) {
  if (!sameOrigin(request)) throw new CrmError(403, '허용되지 않은 요청입니다.');
}
export async function verifiedAdminToken(token: unknown) {
  if (typeof token !== 'string' || token.length > 7000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
    throw new CrmError(401, '로그인이 필요합니다.');
  const user = await supabase<User>('/auth/v1/user', {}, token);
  const email = allowedAdminEmail(user.email);
  if (!email || !user.email_confirmed_at || user.is_anonymous)
    throw new CrmError(403, '관리 권한이 없습니다.');
  return { id: user.id, email };
}
export async function requireAdmin(request: NextRequest) {
  return verifiedAdminToken(request.cookies.get(adminCookie)?.value);
}
// Decode expiry only after /user has authenticated the same token. Identity and
// authorization never come from unverified claims or user_metadata.
export function verifiedTokenLifetime(token: string) {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    if (!Number.isSafeInteger(exp)) throw new Error();
    const remaining = exp - Math.floor(Date.now() / 1000);
    if (remaining <= 0) throw new Error();
    return Math.min(remaining, 3600);
  } catch { throw new CrmError(401, '로그인 링크가 만료되었습니다. 새 링크를 요청해 주세요.'); }
}
export async function bodyObject(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 10_000) throw new CrmError(413, '요청이 너무 큽니다.');
  const text = await request.text();
  if (text.length > 10_000) throw new CrmError(413, '요청이 너무 큽니다.');
  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new CrmError(400, '입력 내용을 확인해 주세요.'); }
}
