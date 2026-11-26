import type { NextRequest } from 'next/server';
import { verifyGmailPush, pushBody, notificationInput, recordPush } from '@/lib/crm/gmail-push';
import { failure } from '@/lib/crm/http';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const config = await verifyGmailPush(request.headers);
    await recordPush(notificationInput(await pushBody(request), config.subscription));
    // ACK only after durable commit. No mail fetch, cursor advance or action here.
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return failure(error); }
}
