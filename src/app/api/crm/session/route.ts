import type { NextRequest } from 'next/server';
import { adminCookie, allowedAdminEmail, assertOrigin, bodyObject, requireAdmin, verifiedAdminToken, verifiedTokenLifetime } from '@/lib/crm/auth';
import { CrmError, supabase } from '@/lib/crm/client';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
import { accessAttemptSource, createAccessAttemptLimiter } from '@/app/api/swatches/access/attempt-guard';
export const runtime = 'nodejs';
const sendLimit = createAccessAttemptLimiter({ limit: 3, windowMs: 15 * 60_000 });
const verifyLimit = createAccessAttemptLimiter({ limit: 10, windowMs: 15 * 60_000 });
function limit(request: NextRequest, consume: ReturnType<typeof createAccessAttemptLimiter>) {
  const wait = consume(accessAttemptSource(request.headers, process.env.VERCEL === '1'));
  if (wait) throw new CrmError(429, '인증 시도가 많습니다. 잠시 후 다시 시도해 주세요.');
}
export async function GET(request: NextRequest) {
  try { const user = await requireAdmin(request); return json({ authenticated: true, email: user.email }); }
  catch (error) { if (error instanceof CrmError && [401,403].includes(error.status)) return json({ authenticated: false }); return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request); limit(request, sendLimit); const body = await bodyObject(request);
    const email = allowedAdminEmail(body.email);
    if (!email) throw new CrmError(403, '등록된 관리자 이메일을 사용해 주세요.');
    await supabase('/auth/v1/otp?redirect_to=' + encodeURIComponent('https://yjtexlab.com/admin/crm'), { method: 'POST', body: JSON.stringify({ email, create_user: false }) });
    return json({ ok: true });
  } catch (error) { return failure(error); }
}
export async function PUT(request: NextRequest) {
  try {
    assertOrigin(request); limit(request, verifyLimit); const body = await bodyObject(request);
    if (body.accessToken !== undefined) {
      const user = await verifiedAdminToken(body.accessToken);
      const token = body.accessToken as string;
      const response = json({ authenticated: true, email: user.email });
      response.cookies.set(adminCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/crm', maxAge: verifiedTokenLifetime(token) });
      return response;
    }
    const email = allowedAdminEmail(body.email);
    if (!email || typeof body.token !== 'string' || !/^\d{6,10}$/.test(body.token)) throw new CrmError(400, '이메일과 인증번호를 확인해 주세요.');
    const result = await supabase<{ access_token: string; expires_in: number; user: {email?: string; email_confirmed_at?: string; is_anonymous?: boolean} }>('/auth/v1/verify', { method: 'POST', body: JSON.stringify({ email, token: body.token, type: 'email' }) });
    const user = await verifiedAdminToken(result.access_token);
    if (user.email !== email) throw new CrmError(403, '관리 권한이 없습니다.');
    const response = json({ authenticated: true, email: user.email });
    response.cookies.set(adminCookie, result.access_token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/crm', maxAge: verifiedTokenLifetime(result.access_token) });
    return response;
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    assertOrigin(request);
    const token = request.cookies.get(adminCookie)?.value;
    if (token) await supabase('/auth/v1/logout?scope=local', { method: 'POST' }, token);
    const response = json({ authenticated: false });
    response.cookies.set(adminCookie, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/crm', maxAge: 0 });
    return response;
  } catch (error) { return failure(error); }
}
