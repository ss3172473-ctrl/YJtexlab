-- Push notifications are hints, never the processed Gmail history cursor.
create table public.crm_gmail_push_receipts (
 subscription text not null,
 message_id text not null,
 mailbox text not null check(mailbox='hello@yjtexlab.com'),
 history_id text not null check(history_id ~ '^[1-9][0-9]{0,39}$'),
 published_at timestamptz not null,
 payload_digest text not null check(payload_digest ~ '^[a-f0-9]{64}$'),
 received_at timestamptz not null default now(),
 primary key(subscription,message_id)
);
create table public.crm_gmail_push_signals (
 mailbox text primary key check(mailbox='hello@yjtexlab.com'),
 latest_history_id text not null check(latest_history_id ~ '^[1-9][0-9]{0,39}$'),
 last_notification_at timestamptz not null,
 notification_count bigint not null default 1 check(notification_count>0)
);
alter table public.crm_gmail_push_receipts enable row level security;
alter table public.crm_gmail_push_signals enable row level security;
revoke all on public.crm_gmail_push_receipts,public.crm_gmail_push_signals from public,anon,authenticated;
grant all on public.crm_gmail_push_receipts,public.crm_gmail_push_signals to service_role;

create function public.crm_record_gmail_push(p_body jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare old public.crm_gmail_push_receipts; receipt public.crm_gmail_push_receipts;
begin
 if coalesce(p_body->>'subscription','') !~ '^projects/[a-zA-Z0-9:._-]+/subscriptions/[a-zA-Z][a-zA-Z0-9._~+%-]{2,254}$'
  or coalesce(p_body->>'messageId','') !~ '^[A-Za-z0-9_-]{1,200}$'
  or p_body->>'mailbox' is distinct from 'hello@yjtexlab.com'
  or coalesce(p_body->>'historyId','') !~ '^[1-9][0-9]{0,39}$'
  or coalesce(p_body->>'digest','') !~ '^[a-f0-9]{64}$'
  or p_body->>'publishedAt' is null then return jsonb_build_object('error','invalid_notification'); end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gmail-push:'||(p_body->>'subscription')||':'||(p_body->>'messageId'),0));
 select * into old from public.crm_gmail_push_receipts where subscription=p_body->>'subscription' and message_id=p_body->>'messageId';
 if found then
  if old.payload_digest<>p_body->>'digest' then return jsonb_build_object('error','notification_payload_conflict'); end if;
  return jsonb_build_object('accepted',true,'duplicate',true);
 end if;
 insert into public.crm_gmail_push_receipts(subscription,message_id,mailbox,history_id,published_at,payload_digest)
 values(p_body->>'subscription',p_body->>'messageId','hello@yjtexlab.com',p_body->>'historyId',(p_body->>'publishedAt')::timestamptz,p_body->>'digest') returning * into receipt;
 insert into public.crm_gmail_push_signals(mailbox,latest_history_id,last_notification_at)
 values(receipt.mailbox,receipt.history_id,receipt.received_at)
 on conflict(mailbox) do update set
  latest_history_id=case when excluded.latest_history_id::numeric>public.crm_gmail_push_signals.latest_history_id::numeric then excluded.latest_history_id else public.crm_gmail_push_signals.latest_history_id end,
  last_notification_at=greatest(excluded.last_notification_at,public.crm_gmail_push_signals.last_notification_at),
  notification_count=public.crm_gmail_push_signals.notification_count+1;
 return jsonb_build_object('accepted',true,'duplicate',false);
end $$;
revoke all on function public.crm_record_gmail_push(jsonb) from public,anon,authenticated;
grant execute on function public.crm_record_gmail_push(jsonb) to service_role;

create function public.crm_gmail_push_state() returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('mailbox','hello@yjtexlab.com','latestNotifiedHistoryId',p.latest_history_id,
  'lastNotificationAt',p.last_notification_at,'notificationCount',coalesce(p.notification_count,0),
  'processedHistoryId',m.history_id,
  'pending',p.latest_history_id is not null and (m.history_id is null or p.latest_history_id::numeric>m.history_id::numeric),
  'execution','existing_inbox_worker_schedule')
 from (select 'hello@yjtexlab.com'::text mailbox) identity
 left join public.crm_gmail_push_signals p using(mailbox)
 left join public.crm_mail_sync m using(mailbox)
$$;
revoke all on function public.crm_gmail_push_state() from public,anon,authenticated;
grant execute on function public.crm_gmail_push_state() to service_role;
