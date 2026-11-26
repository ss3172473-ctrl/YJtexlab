import type { NextRequest } from 'next/server';
import { inboxBody, inboxState, inboxThreads, inboxTransition, requireInbox } from '@/lib/crm/inbox';
import { failure } from '@/lib/crm/http';
import { json } from '@/app/api/swatches/session';
export const runtime='nodejs';
export async function GET(request:NextRequest) {
  try {requireInbox(request.headers);return json({contractVersion:1,...await (request.nextUrl.searchParams.get('view')==='threads'?inboxThreads():inboxState())});}
  catch(error){return failure(error);}
}
export async function POST(request:NextRequest) {
  try {requireInbox(request.headers);return json({contractVersion:1,receipt:await inboxTransition(await inboxBody(request))});}
  catch(error){return failure(error);}
}
