# Gmail push notification boundary

This endpoint persists an authenticated **work signal**, not email content or a processed history cursor. Production activation and Google Cloud setup must be verified separately. The existing Livis inbox worker schedule remains the processing fallback; this change does not start that worker immediately or change collection Cron.

## Endpoints and configuration

- Pub/Sub wrapped JSON push: `POST https://yjtexlab.com/api/crm/gmail/push`.
- Required OIDC audience: exactly `https://yjtexlab.com/api/crm/gmail/push`.
- `CRM_GMAIL_PUSH_SERVICE_ACCOUNT`: the dedicated push-auth service-account email.
- `CRM_GMAIL_PUSH_SERVICE_ACCOUNT_ID`: that account's immutable numeric `uniqueId` / OIDC `sub`.
- `CRM_GMAIL_PUSH_SUBSCRIPTION`: exact `projects/.../subscriptions/...` resource.
- Existing `CRM_BACKEND=supabase` and server Supabase credentials remain required.
- Existing inbox worker token may inspect `GET /api/crm/machine/inbox/push`. It cannot impersonate Pub/Sub or publish notifications.

The already-installed `googleapis` library supplies `google.auth.OAuth2.verifyIdToken`. It verifies Google signatures using the library's cached public certificates, issuer, audience and token times. The endpoint additionally requires RS256, exact service-account email, `email_verified=true`, exact `sub`, valid lifetime and current expiration. No extra dependency, account private key or unauthenticated webhook secret is introduced.

The JSON payload is size bounded. Only the expected subscription and Gmail `emailAddress=hello@yjtexlab.com` are accepted. `historyId` stays a decimal string, including values beyond JavaScript's safe-integer range. Gmail message bodies, subject lines and recipient lists are rejected from the notification data contract.

## Durability and worker behavior

`crm_gmail_push_receipts` deduplicates `(subscription,messageId)` and rejects a changed payload for the same ID. `crm_gmail_push_signals` maintains the maximum notified history ID even when delivery order is reversed. Both tables use RLS and service-role-only grants. A 204 acknowledgement is returned only after the database transaction commits; failures cause Pub/Sub retries.

Neither function changes `crm_mail_sync.history_id`, its lease or any inbound/approval/mail state. The inbox worker must use its existing `history.list`, inventory fence and durable ingestion/checkpoint process. It must never copy `latestNotifiedHistoryId` directly into its processed cursor. Repeated delivery of the same JWT is normal for Pub/Sub; message receipts, rather than JWT uniqueness, provide idempotency.

Inspection returns `latestNotifiedHistoryId`, `lastNotificationAt`, `notificationCount`, `processedHistoryId` and `pending`. `pending` is a hint that a notification is newer than the processed cursor. An immediate Livis wake-up transport is **not implemented** here. Maintain polling when push is delayed, unavailable or dropped. Receipt retention/cleanup is not installed automatically.

## Google Cloud activation checklist

1. Verify the intended Google Cloud project and its billing/usage conditions. Do not infer that Pub/Sub configuration is free or enable billing without authority.
2. Create/reuse a dedicated Gmail topic and grant the Gmail publisher `gmail-api-push@system.gserviceaccount.com` publisher access on that topic.
3. Create/reuse a dedicated push-auth service account; record its email and immutable unique ID. Grant the relevant Pub/Sub service agent the documented OIDC token-creation permission on that account with the minimum necessary resource scope. The subscription configurator also needs the documented service-account permissions.
4. Create/reuse the exact authenticated wrapped push subscription with the fixed endpoint and audience above. Apply the three non-secret identity settings to the server. Do not disable auth to troubleshoot delivery.
5. Call Gmail `users.watch` for the verified company mailbox with the correct topic in the Google project required by the Gmail API credential. Preserve the returned watch expiration separately from the processed cursor.
6. Verify Google's initial watch notification through the live endpoint and durable receipt. Then verify a controlled real mailbox event is ingested by the existing worker without skipped history or duplicate processing.
7. Renew the watch before expiration: Google requires renewal at least every seven days and recommends daily renewal. A renewal job is separate setup, not created by this migration.

## Evidence and sources

Local tests cover real RSA signature verification through Google's verifier, audience/issuer/email/sub/expiry failures, unsigned/tampered tokens, mailbox/subscription binding, malformed/oversized bodies and durable-before-ACK ordering. Isolated PostgreSQL tests cover duplicate/conflicting receipts, reversed order, very large history IDs, unchanged processing cursor/lease, six concurrent identical notifications and eight public/authenticated access denials. These are not proof of live Google Cloud delivery.

Official references inspected 2026-11-26:
- https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions
- https://developers.google.com/workspace/gmail/api/guides/push
- https://developers.google.com/identity/openid-connect/openid-connect
