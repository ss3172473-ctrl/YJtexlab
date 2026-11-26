-- Durable inbound receipts only. Approval execution is deliberately not granted
-- by this migration: classification never sends mail or changes pricing.
create table public.crm_mail_sync (
 mailbox text primary key check(mailbox='hello@yjtexlab.com'),
 history_id text check(history_id ~ '^[0-9]{1,40}$'),
 lease_token uuid,
 lease_run_id text,
 lease_expires_at timestamptz,
 last_completed_at timestamptz,
 updated_at timestamptz not null default now()
);
create table public.crm_inbound_messages (
 id uuid primary key default gen_random_uuid(),
 mailbox text not null check(mailbox='hello@yjtexlab.com'),
 provider_message_id text not null,
 provider_thread_id text not null,
 rfc_message_id text,
 from_email text not null,
 to_emails text[] not null,
 in_reply_to text,
 reference_ids text[] not null default '{}',
 received_at timestamptz not null,
 subject text not null,
 text_body text not null,
 classification text not null check(classification in ('reply','auto_response','optout','bounce','other')),
 classification_evidence text not null,
 receipt_digest text not null check(receipt_digest ~ '^[a-f0-9]{64}$'),
 company_id uuid references public.crm_companies(id),
 contact_id uuid references public.crm_contacts(id),
 match_status text not null check(match_status in ('matched','unmatched','ambiguous')),
 created_at timestamptz not null default now(),
 unique(mailbox,provider_message_id)
);
create index crm_inbound_company_received on public.crm_inbound_messages(company_id,received_at);
create index crm_inbound_thread on public.crm_inbound_messages(mailbox,provider_thread_id);
create index crm_inbound_contact on public.crm_inbound_messages(contact_id);
alter table public.crm_mail_sync enable row level security;
alter table public.crm_inbound_messages enable row level security;
revoke all on public.crm_mail_sync,public.crm_inbound_messages from public,anon,authenticated;
grant all on public.crm_mail_sync,public.crm_inbound_messages to service_role;

create function public.crm_inbox_state() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce((select jsonb_build_object('mailbox',mailbox,'historyId',history_id,'leaseExpiresAt',lease_expires_at,'lastCompletedAt',last_completed_at) from public.crm_mail_sync where mailbox='hello@yjtexlab.com'),jsonb_build_object('mailbox','hello@yjtexlab.com','historyId',null,'leaseExpiresAt',null,'lastCompletedAt',null))
$$;
-- Includes unfinished operations so a Gmail send cannot disappear between
-- inventory discovery and cursor advancement merely because its receipt is late.
create function public.crm_inbox_inventory_revision() returns text language sql stable security invoker set search_path='' as $$
 select md5(coalesce(jsonb_agg(jsonb_build_array(operation_id,state,provider_message_id,provider_thread_id,message_id,email,updated_at) order by operation_id),'[]'::jsonb)::text) from public.crm_sender_operations
$$;
create function public.crm_inbox_threads() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('mailbox','hello@yjtexlab.com','complete',true,'inventoryRevision',public.crm_inbox_inventory_revision(),'threads',coalesce(jsonb_agg(jsonb_build_object('providerThreadId',provider_thread_id,'providerMessageId',provider_message_id,'rfcMessageId',message_id,'rfcMessageIdSource','submitted','providerRfcMessageId',null,'recipientEmail',email) order by created_at,operation_id),'[]'::jsonb))
 from public.crm_sender_operations where state='sent' and provider_message_id is not null
$$;

create function public.crm_inbox_transition(p_body jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare sync public.crm_mail_sync; action text=p_body->>'action'; clock_at timestamptz=clock_timestamp();
 msg jsonb; old public.crm_inbound_messages; cid uuid; tid uuid; candidate_count integer; contact_companies integer;
 match_state text; inserted integer=0; duplicated integer=0; receipts jsonb='[]'::jsonb;
begin
 if action is null or action not in ('acquire','renew','release','ingest','checkpoint') then return jsonb_build_object('error','invalid_action'); end if;
 insert into public.crm_mail_sync(mailbox) values('hello@yjtexlab.com') on conflict(mailbox) do nothing;
 select * into sync from public.crm_mail_sync where mailbox='hello@yjtexlab.com' for update;
 if action='acquire' then
  if coalesce(p_body->>'runId','') !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$' then return jsonb_build_object('error','invalid_run_id'); end if;
  if sync.lease_expires_at>clock_at then
   if sync.lease_run_id<>p_body->>'runId' then return jsonb_build_object('error','inbox_lease_busy'); end if;
  else
   update public.crm_mail_sync set lease_token=gen_random_uuid(),lease_run_id=p_body->>'runId',lease_expires_at=clock_at+interval '120 seconds',updated_at=clock_at where mailbox=sync.mailbox returning * into sync;
  end if;
  return jsonb_build_object('mailbox',sync.mailbox,'historyId',sync.history_id,'leaseToken',sync.lease_token,'leaseExpiresAt',sync.lease_expires_at);
 end if;
 if sync.lease_token is null or sync.lease_token::text is distinct from p_body->>'leaseToken' or sync.lease_expires_at<=clock_at then return jsonb_build_object('error','inbox_lease_expired_or_not_owned'); end if;
 if action='renew' then
  update public.crm_mail_sync set lease_expires_at=clock_at+interval '120 seconds',updated_at=clock_at where mailbox=sync.mailbox returning * into sync;
 elsif action='release' then
  update public.crm_mail_sync set lease_token=null,lease_run_id=null,lease_expires_at=null,updated_at=clock_at where mailbox=sync.mailbox returning * into sync;
 elsif action='checkpoint' then
  -- SHARE conflicts with sender INSERT/UPDATE row-exclusive table locks. Hold it
  -- through this transaction's cursor update; a concurrent accepted receipt
  -- either appears in this revision or forces the checkpoint to fail.
  lock table public.crm_sender_operations in share mode;
  if coalesce(p_body->>'expectedInventoryRevision','') !~ '^[a-f0-9]{32}$'
   or public.crm_inbox_inventory_revision()<>p_body->>'expectedInventoryRevision' then return jsonb_build_object('error','inbox_inventory_changed'); end if;
  if exists(select 1 from public.crm_sender_operations where state<>'sent') then return jsonb_build_object('error','inbox_outreach_unresolved'); end if;
  if sync.history_id is distinct from p_body->>'expectedHistoryId' then return jsonb_build_object('error','inbox_cursor_conflict'); end if;
  if coalesce(p_body->>'historyId','') !~ '^[0-9]{1,40}$' then return jsonb_build_object('error','invalid_history_id'); end if;
  if sync.history_id is not null and (p_body->>'historyId')::numeric<sync.history_id::numeric then return jsonb_build_object('error','inbox_cursor_regression'); end if;
  update public.crm_mail_sync set history_id=p_body->>'historyId',lease_token=null,lease_run_id=null,lease_expires_at=null,last_completed_at=clock_at,updated_at=clock_at where mailbox=sync.mailbox returning * into sync;
 elsif action='ingest' then
  if jsonb_typeof(p_body->'messages') is distinct from 'array' or jsonb_array_length(p_body->'messages') not between 1 and 20 then return jsonb_build_object('error','invalid_batch'); end if;
  -- Preflight the whole batch before writes; errors never commit partial batches.
  if exists(select 1 from jsonb_array_elements(p_body->'messages') m group by m->>'providerMessageId' having count(distinct m->>'digest')>1) then return jsonb_build_object('error','inbox_receipt_conflict'); end if;
  for msg in select value from jsonb_array_elements(p_body->'messages') loop
   if coalesce(msg->>'digest','') !~ '^[a-f0-9]{64}$' or coalesce(msg->>'providerMessageId','') !~ '^[A-Za-z0-9_-]{1,200}$'
    or coalesce(msg->>'providerThreadId','') !~ '^[A-Za-z0-9_-]{1,200}$'
    or coalesce(msg->>'fromEmail','')='' or msg->>'fromEmail'='hello@yjtexlab.com'
    or not coalesce((msg->'toEmails') ? 'hello@yjtexlab.com',false)
    or coalesce(msg->>'classification','') not in ('reply','auto_response','optout','bounce','other')
    or length(coalesce(msg->>'textBody',''))>16000 or length(coalesce(msg->>'subject',''))>500 then return jsonb_build_object('error','invalid_message'); end if;
   select * into old from public.crm_inbound_messages where mailbox=sync.mailbox and provider_message_id=msg->>'providerMessageId';
   if old.id is not null and old.receipt_digest<>msg->>'digest' then return jsonb_build_object('error','inbox_receipt_conflict'); end if;
  end loop;
  for msg in select value from jsonb_array_elements(p_body->'messages') loop
   select * into old from public.crm_inbound_messages where mailbox=sync.mailbox and provider_message_id=msg->>'providerMessageId';
   if old.id is not null then
    duplicated=duplicated+1;
    receipts=receipts||jsonb_build_array(jsonb_build_object('providerMessageId',old.provider_message_id,'id',old.id,'matchStatus',old.match_status,'companyId',old.company_id,'duplicate',true));
    continue;
   end if;
   cid=null;tid=null;match_state='unmatched';
   -- Never match email alone. Known accepted outreach thread/reference plus
   -- exact recipient email is required, and duplicate contact ownership blocks.
   select count(distinct company_id) into contact_companies from public.crm_contacts where email=msg->>'fromEmail';
   select count(distinct o.company_id) into candidate_count from public.crm_sender_operations o
    join public.crm_contacts t on t.id=o.contact_id and t.company_id=o.company_id and t.email=o.email
    where o.state='sent' and o.email=msg->>'fromEmail' and (msg->>'receivedAt')::timestamptz>=o.created_at
    and (o.provider_thread_id=msg->>'providerThreadId' or o.message_id=msg->>'inReplyTo' or (msg->'references') ? o.message_id);
   if candidate_count>1 or (candidate_count>0 and contact_companies>1) then match_state='ambiguous';
   elsif candidate_count=1 then
    select o.company_id,o.contact_id into cid,tid from public.crm_sender_operations o
     join public.crm_contacts t on t.id=o.contact_id and t.company_id=o.company_id and t.email=o.email
     where o.state='sent' and o.email=msg->>'fromEmail' and (msg->>'receivedAt')::timestamptz>=o.created_at
     and (o.provider_thread_id=msg->>'providerThreadId' or o.message_id=msg->>'inReplyTo' or (msg->'references') ? o.message_id) limit 1;
    match_state='matched';
   end if;
   insert into public.crm_inbound_messages(mailbox,provider_message_id,provider_thread_id,rfc_message_id,from_email,to_emails,in_reply_to,reference_ids,received_at,subject,text_body,classification,classification_evidence,receipt_digest,company_id,contact_id,match_status)
    values(sync.mailbox,msg->>'providerMessageId',msg->>'providerThreadId',msg->>'rfcMessageId',msg->>'fromEmail',array(select jsonb_array_elements_text(msg->'toEmails')),msg->>'inReplyTo',array(select jsonb_array_elements_text(msg->'references')),(msg->>'receivedAt')::timestamptz,msg->>'subject',msg->>'textBody',msg->>'classification',msg->>'classificationEvidence',msg->>'digest',cid,tid,match_state) returning * into old;
   inserted=inserted+1;
   receipts=receipts||jsonb_build_array(jsonb_build_object('providerMessageId',old.provider_message_id,'id',old.id,'matchStatus',old.match_status,'companyId',old.company_id,'duplicate',false));
  end loop;
  return jsonb_build_object('mailbox',sync.mailbox,'historyId',sync.history_id,'inserted',inserted,'duplicates',duplicated,'messages',receipts);
 end if;
 return jsonb_build_object('mailbox',sync.mailbox,'historyId',sync.history_id,'leaseToken',sync.lease_token,'leaseExpiresAt',sync.lease_expires_at,'lastCompletedAt',sync.last_completed_at);
end $$;
revoke all on function public.crm_inbox_state(),public.crm_inbox_threads(),public.crm_inbox_inventory_revision(),public.crm_inbox_transition(jsonb) from public,anon,authenticated;
grant execute on function public.crm_inbox_state(),public.crm_inbox_threads(),public.crm_inbox_inventory_revision(),public.crm_inbox_transition(jsonb) to service_role;
