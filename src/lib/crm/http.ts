import { json } from '@/app/api/swatches/session';
import { CrmError } from './client';
export function failure(error: unknown) {
  return json({ error: error instanceof CrmError ? error.message : '고객 관리 요청을 처리하지 못했습니다.' }, error instanceof CrmError ? error.status : 503);
}
