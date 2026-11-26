import 'server-only';

export class CrmError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function supabaseEnabled() { return process.env.CRM_BACKEND === 'supabase'; }
export function configuration() {
  const url = process.env.SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !service || !publishable)
    throw new CrmError(503, '고객 관리 연결이 아직 설정되지 않았습니다.');
  return { url, service, publishable };
}
export async function supabase<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const config = configuration();
  const authPath = path.startsWith('/auth/');
  const response = await fetch(config.url + path, {
    ...options, cache: 'no-store', signal: AbortSignal.timeout(15_000),
    headers: { apikey: authPath ? config.publishable : config.service,
      ...(token || !authPath ? { Authorization: `Bearer ${token ?? config.service}` } : {}),
      'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    if (result.code === '23505') throw new CrmError(409, '이미 등록된 이메일 또는 코드입니다.');
    if (result.message === 'stale_company') throw new CrmError(409, '다른 작업에서 변경되었습니다. 새로고침 후 다시 시도해 주세요.');
    if (response.status === 401 || response.status === 403) throw new CrmError(401, '다시 로그인해 주세요.');
    throw new CrmError(response.status === 429 ? 429 : 503, '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  // PostgREST return=minimal inserts may succeed with 201 and no body.
  const body = await response.text();
  return body.trim() ? JSON.parse(body) as T : undefined as T;
}
export function rpc<T>(name: string, body: object) {
  return supabase<T>(`/rest/v1/rpc/${name}`, { method: 'POST', body: JSON.stringify(body) });
}
