import 'server-only';
import type { NextRequest } from 'next/server';
import { CrmError, supabase } from './client';
import { sameOrigin } from '@/app/api/swatches/session';
export const adminEmail = 'yjtexlab@gmail.com';
export const adminCookie = 'yj_crm_admin';
type User = { id: string; email?: string; email_confirmed_at?: string; is_anonymous?: boolean };
export function assertOrigin(request: NextRequest) {
  if (!sameOrigin(request)) throw new CrmError(403, '허용되지 않은 요청입니다.');
}
export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(adminCookie)?.value;
  if (!token) throw new CrmError(401, '로그인이 필요합니다.');
  const user = await supabase<User>('/auth/v1/user', {}, token);
  if (user.email?.toLowerCase() !== adminEmail || !user.email_confirmed_at || user.is_anonymous)
    throw new CrmError(403, '관리 권한이 없습니다.');
  return { id: user.id, email: adminEmail };
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
