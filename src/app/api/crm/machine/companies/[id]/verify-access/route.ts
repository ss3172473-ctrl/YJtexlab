import type { NextRequest } from 'next/server';
import { bodyObject } from '@/lib/crm/auth';
import { requireCollector } from '@/lib/crm/machine';
import { verifyCollectedAccess } from '@/lib/crm/collector-access-check';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{id: string}> }) {
  try {
    requireCollector(request.headers);
    const { id } = await context.params;
    return json({ receipt: await verifyCollectedAccess(id, await bodyObject(request)) });
  } catch (error) { return failure(error); }
}
