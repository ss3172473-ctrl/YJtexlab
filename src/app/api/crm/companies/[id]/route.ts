import type { NextRequest } from 'next/server';
import { assertOrigin, bodyObject, requireAdmin } from '@/lib/crm/auth';
import { updateCompany } from '@/lib/crm/companies';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function PATCH(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try { assertOrigin(request); const actor = await requireAdmin(request); const {id} = await context.params; return json({ company: await updateCompany(id, await bodyObject(request), actor.id) }); }
  catch (error) { return failure(error); }
}
