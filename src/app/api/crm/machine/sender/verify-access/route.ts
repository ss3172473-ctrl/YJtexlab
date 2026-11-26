import type { NextRequest } from 'next/server';
import { bodyObject } from '@/lib/crm/auth';
import { requireSender } from '@/lib/crm/sender';
import { verifySenderAccess } from '@/lib/crm/sender-access-check';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    requireSender(request.headers);
    return json({ contractVersion: 1, proof: await verifySenderAccess(await bodyObject(request)) });
  } catch (error) { return failure(error); }
}
