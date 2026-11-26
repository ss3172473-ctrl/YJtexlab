import type { NextRequest } from 'next/server';
import { assertOrigin, bodyObject, requireAdmin } from '@/lib/crm/auth';
import { createCompany, emailInput, listCompanies, nameInput } from '@/lib/crm/companies';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try { await requireAdmin(request); const offset = Number(request.nextUrl.searchParams.get('offset') ?? '0'); return json(await listCompanies(request.nextUrl.searchParams.get('q') ?? '', Number.isSafeInteger(offset) && offset >= 0 && offset <= 2147483647 ? offset : 0, request.nextUrl.searchParams.get('status') ?? 'all')); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try { assertOrigin(request); const actor = await requireAdmin(request); const body = await bodyObject(request); return json({ company: await createCompany(nameInput(body.name), emailInput(body.email), actor.id) }, 201); }
  catch (error) { return failure(error); }
}
