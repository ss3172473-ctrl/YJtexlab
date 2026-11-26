-- Durable first-touch ledger: expired/uncertain operations never become candidates again.
create table public.crm_sender_operations (
 operation_id text primary key,
 company_id uuid not null unique references public.crm_companies(id),
 contact_id uuid not null references public.crm_contacts(id),
 email text not null unique,
 credential_id uuid not null references public.crm_access_credentials(id),
 snapshot jsonb not null,
 message_id text not null unique,
 mime_sha256 text not null,
 inbound_checked_at timestamptz not null,
 lease_token uuid not null default gen_random_uuid(),
 lease_expires_at timestamptz not null default (clock_timestamp()+interval '5 minutes'),
 state text not null default 'claimed' check(state in ('claimed','sending','uncertain','sent')),
 provider_message_id text unique,
 provider_thread_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.crm_sender_operations enable row level security;
revoke all on public.crm_sender_operations from public,anon,authenticated;
grant all on public.crm_sender_operations to service_role;

create function public.crm_sender_snapshot(p_company uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('companyId',c.id,'name',c.name,'companyUpdatedAt',c.updated_at,
   'contactId',t.id,'email',t.email,'credentialId',a.id,'encryptedCode',a.encrypted_code,'codeHash',a.code_hash)
 from public.crm_companies c join public.crm_contacts t on t.company_id=c.id and t.is_primary
 join public.crm_access_credentials a on a.company_id=c.id and a.revoked_at is null
 where c.id=p_company and not t.suppressed
 and (c.source_key is null or btrim(coalesce(c.legacy_metadata->>'접촉 상태',''))<>'')
 and not exists(select 1 from public.crm_contacts x where x.email=t.email and (x.suppressed or x.company_id<>c.id))
 -- Imported rows retain historical evidence; any established contact is excluded.
 and regexp_replace(coalesce(c.legacy_metadata->>'접촉 상태',''),'\s','','g') in ('','미접촉','발송대기','수집완료')
 and not exists(select 1 from jsonb_each_text(c.legacy_metadata) m where m.key ~ '(발송.*(일|시)|최초.*접촉|최근.*접촉|접촉.*기록|발신.*계정)' and btrim(m.value)<>'')
$$;

create function public.crm_sender_candidates() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(s),'[]'::jsonb) from (
 select public.crm_sender_snapshot(c.id) s from public.crm_companies c
 where not exists(select 1 from public.crm_sender_operations o where o.company_id=c.id or o.email in (select email from public.crm_contacts where company_id=c.id))
 order by c.created_at,c.id
 ) q where s is not null
$$;

create function public.crm_sender_transition(p_body jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare op public.crm_sender_operations; snap jsonb; action text=p_body->>'action'; cid uuid; now_at timestamptz=clock_timestamp();
begin
 if action not in ('claim','begin','receipt') or action is null then return jsonb_build_object('error','invalid_action'); end if;
 if action='receipt' and (coalesce(p_body->>'outcome','') not in ('sent','uncertain') or (p_body->>'outcome'='sent' and coalesce(p_body->>'providerMessageId','')='') or (p_body->>'outcome'='uncertain' and p_body ? 'providerMessageId')) then return jsonb_build_object('error','invalid_receipt'); end if;
 -- Serialize first-touch claims, including duplicated emails across companies.
 perform pg_advisory_xact_lock(867225110);
 if action='claim' then
  select * into op from public.crm_sender_operations where operation_id=p_body->>'operationId' for update;
  if op.operation_id is not null then
   if op.company_id::text<>p_body->>'companyId' or op.contact_id::text<>p_body->>'contactId'
    or op.credential_id::text<>p_body->>'credentialId' or op.email<>p_body->>'email'
    or op.message_id<>p_body->>'messageId' or op.mime_sha256<>p_body->>'mimeSha256'
    or op.snapshot->>'name'<>p_body->>'name' or (op.snapshot->>'companyUpdatedAt')::timestamptz<>(p_body->>'companyUpdatedAt')::timestamptz then
    return jsonb_build_object('error','operation_payload_conflict'); end if;
  else
   cid=(p_body->>'companyId')::uuid;
   perform 1 from public.crm_companies where id=cid for update;
   perform 1 from public.crm_contacts where company_id=cid for share;
   perform 1 from public.crm_access_credentials where company_id=cid for share;
   snap=public.crm_sender_snapshot(cid);
   if snap is null or snap->>'name'<>p_body->>'name' or snap->>'email'<>p_body->>'email'
    or snap->>'contactId'<>p_body->>'contactId' or snap->>'credentialId'<>p_body->>'credentialId'
    or (snap->>'companyUpdatedAt')::timestamptz<>(p_body->>'companyUpdatedAt')::timestamptz then return jsonb_build_object('error','ineligible_or_stale'); end if;
   if (p_body->>'inboundCheckedAt')::timestamptz < now_at-interval '5 minutes' or (p_body->>'inboundCheckedAt')::timestamptz>now_at+interval '30 seconds' then return jsonb_build_object('error','inbound_check_expired'); end if;
   if exists(select 1 from public.crm_sender_operations where company_id=cid or email=snap->>'email') then return jsonb_build_object('error','prior_operation'); end if;
   insert into public.crm_sender_operations(operation_id,company_id,contact_id,email,credential_id,snapshot,message_id,mime_sha256,inbound_checked_at)
    values(p_body->>'operationId',cid,(snap->>'contactId')::uuid,snap->>'email',(snap->>'credentialId')::uuid,snap,p_body->>'messageId',p_body->>'mimeSha256',(p_body->>'inboundCheckedAt')::timestamptz) returning * into op;
  end if;
 else
  select * into op from public.crm_sender_operations where operation_id=p_body->>'operationId' for update;
  if op.operation_id is null or op.lease_token::text<>p_body->>'leaseToken' then return jsonb_build_object('error','unknown_operation'); end if;
  if action='begin' then
   if op.state<>'claimed' then return jsonb_build_object('error','already_started_no_retry'); end if;
   if op.lease_expires_at<now_at or op.inbound_checked_at<now_at-interval '5 minutes' then return jsonb_build_object('error','lease_expired'); end if;
   perform 1 from public.crm_companies where id=op.company_id for update;
   perform 1 from public.crm_contacts where company_id=op.company_id for share;
   perform 1 from public.crm_access_credentials where company_id=op.company_id for share;
   snap=public.crm_sender_snapshot(op.company_id);
   if snap is distinct from op.snapshot then return jsonb_build_object('error','ineligible_or_stale'); end if;
   update public.crm_sender_operations set state='sending',lease_expires_at=now_at+interval '60 seconds',updated_at=now_at where operation_id=op.operation_id returning * into op;
  elsif action='receipt' then
   if op.state='claimed' then return jsonb_build_object('error','not_started'); end if;
   if op.state='sent' then
    if p_body->>'outcome'<>'sent' or op.provider_message_id is distinct from p_body->>'providerMessageId' then return jsonb_build_object('error','receipt_conflict'); end if;
   else
    update public.crm_sender_operations set state=p_body->>'outcome',provider_message_id=p_body->>'providerMessageId',provider_thread_id=p_body->>'providerThreadId',updated_at=now_at where operation_id=op.operation_id returning * into op;
    insert into public.crm_audit_events(company_id,actor,action,details) values(op.company_id,'machine:sender','mail_'||op.state,jsonb_build_object('operationId',op.operation_id,'messageId',op.message_id,'providerMessageId',op.provider_message_id));
   end if;
  else return jsonb_build_object('error','invalid_action'); end if;
 end if;
 return jsonb_build_object('operationId',op.operation_id,'state',op.state,'leaseToken',op.lease_token,'leaseExpiresAt',op.lease_expires_at,'messageId',op.message_id,'mimeSha256',op.mime_sha256,'snapshot',op.snapshot,'providerMessageId',op.provider_message_id);
end $$;
revoke all on function public.crm_sender_snapshot(uuid),public.crm_sender_candidates(),public.crm_sender_transition(jsonb) from public,anon,authenticated;
grant execute on function public.crm_sender_snapshot(uuid),public.crm_sender_candidates(),public.crm_sender_transition(jsonb) to service_role;
