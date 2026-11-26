import type { NextRequest } from 'next/server';
import { assertOrigin, bodyObject, requireAdmin } from '@/lib/crm/auth';
import { manageCode } from '@/lib/crm/companies';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try { assertOrigin(request); const actor = await requireAdmin(request); const {id} = await context.params; const body = await bodyObject(request); return json(await manageCode(id, body.action, actor.id, body.expectedUpdatedAt)); }
  catch (error) { return failure(error); }
}
