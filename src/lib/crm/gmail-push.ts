import 'server-only';
import { createHash } from 'node:crypto';
import { google } from 'googleapis';
import type { NextRequest } from 'next/server';
import { CrmError, rpc, supabaseEnabled } from './client';

export const gmailPushAudience = 'https://yjtexlab.com/api/crm/gmail/push';
const issuers = ['https://accounts.google.com', 'accounts.google.com'];
// Reuse Google's vetted verifier and public-certificate cache; no new dependency.
const verifier = new google.auth.OAuth2({ issuers, transporterOptions: { timeout: 5000, retry: false } });
const mailbox = 'hello@yjtexlab.com';
export function pushConfiguration() {
  const email = process.env.CRM_GMAIL_PUSH_SERVICE_ACCOUNT;
  const subject = process.env.CRM_GMAIL_PUSH_SERVICE_ACCOUNT_ID;
  const subscription = process.env.CRM_GMAIL_PUSH_SUBSCRIPTION;
  if (!supabaseEnabled() || !email || !/^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]@[a-z0-9-]+\.iam\.gserviceaccount\.com$/.test(email)
    || !subject || !/^\d{10,30}$/.test(subject)
    || !subscription || !/^projects\/[a-zA-Z0-9:._-]+\/subscriptions\/[a-zA-Z][a-zA-Z0-9._~+%-]{2,254}$/.test(subscription))
    throw new CrmError(503, 'Gmail push connection is not configured.');
  return { email, subject, subscription };
}
export async function verifyGmailPush(headers: Headers) {
  const config = pushConfiguration();
  const authorization = headers.get('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (token.length > 10000 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new CrmError(401, 'Google push identity required.');
  try {
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid || header.kid.length > 200) throw new Error();
    const ticket = await verifier.verifyIdToken({ idToken: token, audience: gmailPushAudience, maxExpiry: 3900 });
    const claims = ticket.getPayload();
    const now = Math.floor(Date.now() / 1000);
    if (!claims || !issuers.includes(claims.iss) || claims.aud !== gmailPushAudience
      || claims.email !== config.email || claims.email_verified !== true || claims.sub !== config.subject
      || !Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)
      || claims.exp <= now || claims.iat > now + 60 || claims.exp - claims.iat > 3900 || claims.exp <= claims.iat) throw new Error();
  } catch {
    // Never expose library errors containing the JWT or decoded identity claims.
    throw new CrmError(401, 'Google push identity could not be verified.');
  }
  return config;
}
function object(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CrmError(400, 'Invalid push notification.');
  return value as Record<string, unknown>;
}
export function notificationInput(value: unknown, expectedSubscription: string) {
  const body = object(value), message = object(body.message);
  if (body.subscription !== expectedSubscription) throw new CrmError(403, 'Unexpected push subscription.');
  if (typeof message.messageId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(message.messageId)) throw new CrmError(400, 'Invalid notification ID.');
  if (typeof message.publishTime !== 'string' || message.publishTime.length > 50 || !/^\d{4}-\d\d-\d\dT.+(?:Z|[+-]\d\d:\d\d)$/.test(message.publishTime)
    || !Number.isFinite(Date.parse(message.publishTime)) || Date.parse(message.publishTime) > Date.now() + 300000) throw new CrmError(400, 'Invalid notification time.');
  if (typeof message.data !== 'string' || !message.data || message.data.length > 4096 || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(message.data)) throw new CrmError(400, 'Invalid notification data.');
  let data;
  try {
    const bytes = Buffer.from(message.data, 'base64');
    // Buffer's permissive decoder must not silently accept truncated/invalid data.
    if (bytes.toString('base64url') !== message.data.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')) throw new Error();
    data = object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
  } catch { throw new CrmError(400, 'Invalid notification data.'); }
  if (Object.keys(data).some(k => !['emailAddress', 'historyId'].includes(k)) || data.emailAddress !== mailbox) throw new CrmError(403, 'Unexpected notification mailbox.');
  // Some notification producers encode history IDs as JSON numbers. Only normalize
  // safe integers: larger numeric literals may already have lost precision in JSON.parse.
  const historyId = typeof data.historyId === 'number' && Number.isSafeInteger(data.historyId)
    ? String(data.historyId) : data.historyId;
  if (typeof historyId !== 'string' || !/^[1-9][0-9]{0,39}$/.test(historyId)) throw new CrmError(400, 'Invalid mailbox history ID.');
  const notification = { subscription: expectedSubscription, messageId: message.messageId, mailbox, historyId, publishedAt: new Date(message.publishTime).toISOString() };
  return { ...notification, digest: createHash('sha256').update(JSON.stringify(notification)).digest('hex') };
}
export async function pushBody(request: NextRequest) {
  if (Number(request.headers.get('content-length') || 0) > 32768) throw new CrmError(413, 'Push notification too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new CrmError(400, 'Push notification body required.');
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    for (;;) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > 32768) throw new CrmError(413, 'Push notification too large.'); chunks.push(part.value); }
    try { return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)))); }
    catch { throw new CrmError(400, 'Invalid push JSON.'); }
  } finally { void reader.cancel().catch(() => undefined); }
}
export async function recordPush(notification: ReturnType<typeof notificationInput>) {
  const result = await rpc<Record<string, unknown>>('crm_record_gmail_push', { p_body: notification });
  if (result.error) throw new CrmError(409, 'Push notification conflicts with its recorded receipt.');
  return result;
}
export function gmailPushState() { return rpc<Record<string, unknown>>('crm_gmail_push_state', {}); }
