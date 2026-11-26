-- Immutable proposals; only a verified Slack callback may authorize an item.
create table public.crm_approval_actions (
 id uuid primary key default gen_random_uuid(), operation_id text not null unique,
 request_digest text not null check(request_digest ~ '^[a-f0-9]{64}$'),
 kind text not null check(kind in ('reply','price')),
 company_id uuid not null references public.crm_companies(id),
 contact_id uuid references public.crm_contacts(id),
 inbound_message_id uuid references public.crm_inbound_messages(id),
 expected_updated_at timestamptz not null,
 payload jsonb not null, payload_digest text not null check(payload_digest ~ '^[a-f0-9]{64}$'),
 state text not null default 'draft' check(state in ('draft','approved','rejected','executing','succeeded','uncertain')),
 slack_message_ts text unique,
 approved_by text, approved_at timestamptz,
 execution_id uuid, execution_started_at timestamptz,
 result jsonb, failure_reason text,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '24 hours'
);
alter table public.crm_approval_actions enable row level security;
revoke all on public.crm_approval_actions from public,anon,authenticated;
grant all on public.crm_approval_actions to service_role;
create index crm_approval_pending on public.crm_approval_actions(state,approved_at);

create function public.crm_approval_operation(p_action text,p_id uuid,p_body jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.crm_approval_actions; c public.crm_companies; t public.crm_contacts;
 m public.crm_inbound_messages; proposal jsonb; receipt jsonb; new_state text;
begin
 if p_action='create' then
  if p_body->>'operationId' is null or p_body->>'operationId' !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$'
   or p_body->>'requestDigest' is null or p_body->>'requestDigest' !~ '^[a-f0-9]{64}$'
   or p_body->>'kind' not in ('reply','price') then return jsonb_build_object('error','invalid_draft'); end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm-approval:'||(p_body->>'operationId'),0));
  select * into a from public.crm_approval_actions where operation_id=p_body->>'operationId';
  if found then
   if a.request_digest<>p_body->>'requestDigest' then return jsonb_build_object('error','operation_payload_conflict'); end if;
   return jsonb_build_object('id',a.id,'kind',a.kind,'state',a.state,'payload',a.payload,'payloadDigest',a.payload_digest,'expiresAt',a.expires_at,'messageTs',a.slack_message_ts);
  end if;
  select * into c from public.crm_companies where id=(p_body->>'companyId')::uuid for update;
  if not found then return jsonb_build_object('error','not_found'); end if;
  if c.updated_at is distinct from (p_body->>'expectedUpdatedAt')::timestamptz then return jsonb_build_object('error','stale_company'); end if;
  proposal=jsonb_build_object('kind',p_body->>'kind','companyId',c.id,'companyName',c.name,'expectedUpdatedAt',c.updated_at);
  if p_body->>'kind'='reply' then
   select * into t from public.crm_contacts where id=(p_body->>'contactId')::uuid and company_id=c.id;
   if not found or t.suppressed then return jsonb_build_object('error','contact_not_eligible'); end if;
   select * into m from public.crm_inbound_messages where id=(p_body->>'inboundMessageId')::uuid;
   if not found or m.company_id is distinct from c.id or m.contact_id is distinct from t.id
    or m.match_status<>'matched' or m.classification<>'reply' or m.from_email<>t.email
    or m.receipt_digest is distinct from p_body->>'inboxDigest' or m.mailbox<>'hello@yjtexlab.com'
    then return jsonb_build_object('error','inbound_binding_mismatch'); end if;
   if length(btrim(p_body->>'subject')) not between 1 and 998 or p_body->>'subject' ~ '[\r\n]'
    or length(btrim(p_body->>'textBody')) not between 1 and 6000 then return jsonb_build_object('error','invalid_reply'); end if;
   proposal=proposal||jsonb_build_object('contactId',t.id,'to',t.email,'mailbox',m.mailbox,'inboundMessageId',m.id,
    'inboxDigest',m.receipt_digest,'providerThreadId',m.provider_thread_id,'inReplyTo',m.rfc_message_id,'references',m.reference_ids,
    'subject',p_body->>'subject','textBody',p_body->>'textBody');
  else
   if jsonb_typeof(p_body->'canViewPrices') is distinct from 'boolean' then return jsonb_build_object('error','invalid_price'); end if;
   proposal=proposal||jsonb_build_object('canViewPrices',(p_body->>'canViewPrices')::boolean,'previousCanViewPrices',c.can_view_prices);
  end if;
  insert into public.crm_approval_actions(operation_id,request_digest,kind,company_id,contact_id,inbound_message_id,expected_updated_at,payload,payload_digest)
   values(p_body->>'operationId',p_body->>'requestDigest',p_body->>'kind',c.id,t.id,m.id,c.updated_at,proposal,
    pg_catalog.encode(pg_catalog.sha256(pg_catalog.convert_to(proposal::text,'UTF8')),'hex')) returning * into a;
  insert into public.crm_audit_events(company_id,actor,action,details) values(c.id,'machine:approval-worker','approval_drafted',jsonb_build_object('approval_id',a.id,'kind',a.kind,'payload_digest',a.payload_digest));
  return jsonb_build_object('id',a.id,'kind',a.kind,'state',a.state,'payload',a.payload,'payloadDigest',a.payload_digest,'expiresAt',a.expires_at,'messageTs',a.slack_message_ts);
 end if;
 select * into a from public.crm_approval_actions where id=p_id for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if p_action='bind' then
  if a.payload_digest is distinct from p_body->>'payloadDigest' or p_body->>'messageTs' is null or p_body->>'messageTs' !~ '^[0-9]{10,}\.[0-9]{6}$' then return jsonb_build_object('error','card_binding_mismatch'); end if;
  if a.slack_message_ts is not null and a.slack_message_ts<>p_body->>'messageTs' then return jsonb_build_object('error','card_already_bound'); end if;
  if a.state<>'draft' or a.expires_at<=now() then return jsonb_build_object('error','draft_not_pending'); end if;
  update public.crm_approval_actions set slack_message_ts=p_body->>'messageTs' where id=a.id;
  return jsonb_build_object('id',a.id,'state',a.state,'messageTs',p_body->>'messageTs');
 end if;
 if p_action='complete' then
  if a.kind<>'reply' or a.execution_id is null or a.execution_id is distinct from (p_body->>'executionId')::uuid then return jsonb_build_object('error','execution_binding_mismatch'); end if;
  receipt=jsonb_build_object('providerMessageId',p_body->>'providerMessageId');
  if a.state in ('succeeded','uncertain') then
   if a.state=p_body->>'outcome' and a.result=receipt then return jsonb_build_object('id',a.id,'state',a.state,'result',a.result); end if;
   return jsonb_build_object('error','terminal_execution');
  end if;
  if a.state<>'executing' or p_body->>'outcome' not in ('succeeded','uncertain') then return jsonb_build_object('error','execution_not_claimed'); end if;
  if p_body->>'outcome'='succeeded' and (p_body->>'providerMessageId' is null or p_body->>'providerMessageId' !~ '^[A-Za-z0-9_-]{1,200}$') then return jsonb_build_object('error','provider_receipt_required'); end if;
  update public.crm_approval_actions set state=p_body->>'outcome',result=receipt where id=a.id;
  insert into public.crm_audit_events(company_id,actor,action,details) values(a.company_id,'machine:approval-worker','approved_reply_'||(p_body->>'outcome'),jsonb_build_object('approval_id',a.id,'execution_id',a.execution_id));
  return jsonb_build_object('id',a.id,'state',p_body->>'outcome','result',receipt);
 end if;
 if p_action not in ('claim','execute_price') then return jsonb_build_object('error','unsupported_operation'); end if;
 if p_action='execute_price' and a.kind='price' and a.state='succeeded' then return jsonb_build_object('id',a.id,'state',a.state,'result',a.result); end if;
 if (p_action='claim' and a.kind<>'reply') or (p_action='execute_price' and a.kind<>'price') then return jsonb_build_object('error','kind_mismatch'); end if;
 if a.state<>'approved' or a.approved_by is distinct from 'U0CAK75RSAC' or a.approved_at is null then return jsonb_build_object('error','item_not_approved'); end if;
 if a.expires_at<=now() or a.approved_at<now()-interval '1 hour' then
  update public.crm_approval_actions set state='rejected',failure_reason='approval_expired' where id=a.id;
  return jsonb_build_object('error','approval_expired');
 end if;
 select * into c from public.crm_companies where id=a.company_id for update;
 if c.updated_at<>a.expected_updated_at then
  update public.crm_approval_actions set state='rejected',failure_reason='stale_company' where id=a.id;
  return jsonb_build_object('error','stale_company');
 end if;
 if a.kind='reply' then
  select * into t from public.crm_contacts where id=a.contact_id and company_id=a.company_id for update;
  select * into m from public.crm_inbound_messages where id=a.inbound_message_id;
  if t.id is null or t.suppressed or t.email<>a.payload->>'to' or m.receipt_digest is distinct from a.payload->>'inboxDigest'
   or m.company_id is distinct from a.company_id or m.contact_id is distinct from a.contact_id or m.classification<>'reply' or m.match_status<>'matched'
   then
    update public.crm_approval_actions set state='rejected',failure_reason='reply_context_changed' where id=a.id;
    return jsonb_build_object('error','reply_context_changed');
  end if;
  update public.crm_approval_actions set state='executing',execution_id=gen_random_uuid(),execution_started_at=clock_timestamp() where id=a.id returning * into a;
  insert into public.crm_audit_events(company_id,actor,action,details) values(a.company_id,'machine:approval-worker','approved_reply_claimed',jsonb_build_object('approval_id',a.id,'execution_id',a.execution_id));
  return jsonb_build_object('id',a.id,'state',a.state,'executionId',a.execution_id,'payload',a.payload,'payloadDigest',a.payload_digest);
 end if;
 -- Price effect and receipt commit together: no external side effect to repeat.
 update public.crm_companies set can_view_prices=(a.payload->>'canViewPrices')::boolean,updated_at=clock_timestamp() where id=a.company_id returning * into c;
 receipt=jsonb_build_object('companyId',c.id,'canViewPrices',c.can_view_prices,'companyUpdatedAt',c.updated_at);
 update public.crm_approval_actions set state='succeeded',execution_id=gen_random_uuid(),execution_started_at=clock_timestamp(),result=receipt where id=a.id;
 insert into public.crm_audit_events(company_id,actor,action,details) values(a.company_id,'slack:'||a.approved_by,'price_permission_approved',jsonb_build_object('approval_id',a.id,'before',a.payload->'previousCanViewPrices','after',c.can_view_prices));
 return jsonb_build_object('id',a.id,'state','succeeded','result',receipt);
end $$;
revoke all on function public.crm_approval_operation(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.crm_approval_operation(text,uuid,jsonb) to service_role;

create function public.crm_decide_approval(p_id uuid,p_digest text,p_decision text,p_message_ts text,p_actor text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.crm_approval_actions; desired text;
begin
 if p_actor is distinct from 'U0CAK75RSAC' or p_decision not in ('approve','reject') then return jsonb_build_object('error','invalid_approver'); end if;
 select * into a from public.crm_approval_actions where id=p_id for update;
 if not found then return jsonb_build_object('error','not_found'); end if;
 if a.payload_digest is distinct from p_digest or a.slack_message_ts is null or a.slack_message_ts is distinct from p_message_ts then return jsonb_build_object('error','card_binding_mismatch'); end if;
 desired=case when p_decision='approve' then 'approved' else 'rejected' end;
 if a.state=desired and a.approved_by=p_actor then return jsonb_build_object('id',a.id,'state',a.state); end if;
 if a.state<>'draft' then return jsonb_build_object('error','already_decided'); end if;
 if a.expires_at<=now() then return jsonb_build_object('error','draft_expired'); end if;
 update public.crm_approval_actions set state=desired,approved_by=p_actor,approved_at=clock_timestamp() where id=a.id;
 insert into public.crm_audit_events(company_id,actor,action,details) values(a.company_id,'slack:'||p_actor,'item_'||desired,jsonb_build_object('approval_id',a.id,'kind',a.kind,'payload_digest',a.payload_digest));
 return jsonb_build_object('id',a.id,'state',desired);
end $$;
revoke all on function public.crm_decide_approval(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.crm_decide_approval(uuid,text,text,text,text) to service_role;
