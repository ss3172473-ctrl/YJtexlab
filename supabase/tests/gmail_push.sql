-- Disposable fixtures only. Apply all migrations in an isolated DB first.
begin;
set local role service_role;
do $$
declare n jsonb; outcome jsonb; before_sync jsonb; state jsonb;
begin
 insert into public.crm_mail_sync(mailbox,history_id) values('hello@yjtexlab.com','100') on conflict(mailbox) do update set history_id='100';
 select to_jsonb(s) into before_sync from public.crm_mail_sync s where mailbox='hello@yjtexlab.com';
 n=jsonb_build_object('subscription','projects/fixture/subscriptions/crm-push','messageId','push-fixture-1','mailbox','hello@yjtexlab.com','historyId','900719925474099312345','publishedAt','2026-11-26T00:00:00Z','digest',repeat('a',64));
 outcome=public.crm_record_gmail_push(n);assert (outcome->>'accepted')::boolean;assert not (outcome->>'duplicate')::boolean;
 outcome=public.crm_record_gmail_push(n);assert (outcome->>'duplicate')::boolean;
 assert public.crm_record_gmail_push(n||jsonb_build_object('digest',repeat('b',64)))->>'error'='notification_payload_conflict';
 perform public.crm_record_gmail_push(n||jsonb_build_object('messageId','push-fixture-2','historyId','200','digest',repeat('c',64)));
 state=public.crm_gmail_push_state();assert state->>'latestNotifiedHistoryId'='900719925474099312345';assert state->>'notificationCount'='2';assert (state->>'pending')::boolean;
 assert state->>'processedHistoryId'='100';
 assert (select to_jsonb(s) from public.crm_mail_sync s where mailbox='hello@yjtexlab.com')=before_sync,'push mutated processing cursor or lease';
 assert public.crm_record_gmail_push(n||jsonb_build_object('mailbox','other@example.test'))->>'error'='invalid_notification';
 assert (select count(*) from public.crm_gmail_push_receipts where subscription='projects/fixture/subscriptions/crm-push')=2;
 update public.crm_mail_sync set history_id='900719925474099312345' where mailbox='hello@yjtexlab.com';
 assert not (public.crm_gmail_push_state()->>'pending')::boolean;
end $$;
rollback;
