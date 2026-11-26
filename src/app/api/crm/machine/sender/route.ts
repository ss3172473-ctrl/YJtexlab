import type { NextRequest } from 'next/server';
import { bodyObject } from '@/lib/crm/auth';
import { requireSender, senderCandidates, senderTransition } from '@/lib/crm/sender';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try { requireSender(request.headers); return json({ contractVersion: 1, candidates: await senderCandidates() }); }
  catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try { requireSender(request.headers); return json({ receipt: await senderTransition(await bodyObject(request)) }); }
  catch (error) { return failure(error); }
}
