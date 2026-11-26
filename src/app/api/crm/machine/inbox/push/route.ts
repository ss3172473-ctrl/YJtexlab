import type { NextRequest } from 'next/server';
import { requireInbox } from '@/lib/crm/inbox';
import { gmailPushState } from '@/lib/crm/gmail-push';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try { requireInbox(request.headers); return json({ contractVersion: 1, ...await gmailPushState() }); }
  catch (error) { return failure(error); }
}
