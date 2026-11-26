import type { NextRequest } from 'next/server';
import { bodyObject } from '@/lib/crm/auth';
import { requireCollector, registerCollectedCompany } from '@/lib/crm/machine';
import { supabase } from '@/lib/crm/client';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try { requireCollector(request.headers); await supabase('/rest/v1/crm_collector_operations?select=operation_id&limit=0'); return json({ ready: true, scope: 'collector:register', contractVersion: 1 }); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    requireCollector(request.headers);
    return json({ receipt: await registerCollectedCompany(await bodyObject(request)) });
  } catch (error) { return failure(error); }
}
