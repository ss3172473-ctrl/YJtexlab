import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { CrmError } from './client';
export const crmSlack = { app: 'A0CM3GV4D34', team: 'T0C99EN4JHM', channel: 'C0CLX6YM77D', approver: 'U0CAK75RSAC' } as const;
export function verifySlackSignature(raw: string, headers: Headers, nowSeconds = Math.floor(Date.now() / 1000)) {
  const secret = process.env.CRM_SLACK_SIGNING_SECRET;
  if (!secret || secret.length < 16) throw new CrmError(503, 'Slack approval connection unavailable.');
  const timestamp = headers.get('x-slack-request-timestamp') ?? '';
  const signature = headers.get('x-slack-signature') ?? '';
  if (!/^\d{10}$/.test(timestamp) || Math.abs(nowSeconds - Number(timestamp)) > 300 || !/^v0=[a-f0-9]{64}$/.test(signature)) throw new CrmError(401, 'Invalid Slack signature.');
  const expected = 'v0=' + createHmac('sha256', secret).update(`v0:${timestamp}:${raw}`).digest('hex');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new CrmError(401, 'Invalid Slack signature.');
}
export function slackDecision(raw: string) {
  let payload;
  try { payload = JSON.parse(new URLSearchParams(raw).get('payload') ?? ''); }
  catch { throw new CrmError(400, 'Invalid Slack payload.'); }
  if (payload?.type !== 'block_actions' || payload.api_app_id !== crmSlack.app || payload.team?.id !== crmSlack.team || payload.user?.id !== crmSlack.approver || payload.user?.is_bot === true || payload.channel?.id !== crmSlack.channel || payload.container?.channel_id !== crmSlack.channel || payload.container?.type !== 'message' || payload.container?.is_ephemeral === true || !Array.isArray(payload.actions) || payload.actions.length !== 1) throw new CrmError(403, 'Approval actor or context is not allowed.');
  const messageTs = payload.container.message_ts;
  if (typeof messageTs !== 'string' || !/^\d{10,}\.[0-9]{6}$/.test(messageTs) || payload.message?.ts !== messageTs) throw new CrmError(400, 'Invalid approval message binding.');
  const action = payload.actions[0];
  const match = typeof action.value === 'string' && /^([a-f0-9-]{36}):([a-f0-9]{64})$/.exec(action.value);
  if (!match || !['crm_approve','crm_reject'].includes(action.action_id)) throw new CrmError(400, 'Invalid approval action.');
  return { id: match[1], digest: match[2], decision: action.action_id === 'crm_approve' ? 'approve' : 'reject', messageTs, actor: crmSlack.approver };
}
