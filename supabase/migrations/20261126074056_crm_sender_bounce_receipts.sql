-- Preserve provider acceptance independently of later confirmed permanent DSNs.
alter table public.crm_sender_operations add column sent_at timestamptz;
update public.crm_sender_operations set sent_at=updated_at where state='sent';
create function public.crm_sender_stamp_sent() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.state='sent' and old.sent_at is null then new.sent_at=clock_timestamp();
 else new.sent_at=old.sent_at; end if;
 return new;
end $$;
create trigger crm_sender_sent_at before update on public.crm_sender_operations for each row execute function public.crm_sender_stamp_sent();
revoke all on function public.crm_sender_stamp_sent() from public,anon,authenticated;
grant execute on function public.crm_sender_stamp_sent() to service_role;
create table public.crm_sender_bounces (
 operation_id text primary key references public.crm_sender_operations(operation_id),
 bounce_message_id text not null,
 original_message_id text not null,
 bounced_at timestamptz not null,
 status_code text not null check(status_code ~ '^5\.[0-9]{1,3}\.[0-9]{1,3}$'),
 recorded_at timestamptz not null default now()
);
alter table public.crm_sender_bounces enable row level security;
revoke all on public.crm_sender_bounces from public,anon,authenticated;
grant all on public.crm_sender_bounces to service_role;

create function public.crm_sender_delivery_receipts() returns jsonb language sql stable security invoker set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('operationId',o.operation_id,'providerMessageId',o.provider_message_id,
 'messageId',o.message_id,'email',o.email,'sentAt',o.sent_at,'bouncedAt',b.bounced_at,'bounceMessageId',b.bounce_message_id,'originalMessageId',b.original_message_id) order by o.sent_at,o.operation_id),'[]'::jsonb)
 from public.crm_sender_operations o left join public.crm_sender_bounces b using(operation_id) where o.state='sent'
$$;

-- Caller is the scoped worker after inspecting Gmail multipart/report DSN evidence.
-- Matching a recipient alone or subject text is insufficient: bind both original IDs.
create function public.crm_sender_record_bounce(p_body jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare op public.crm_sender_operations; prior public.crm_sender_bounces; event_at timestamptz;
begin
 if coalesce(p_body->>'statusCode','') !~ '^5\.[0-9]{1,3}\.[0-9]{1,3}$' or coalesce(p_body->>'bounceMessageId','') !~ '^[A-Za-z0-9_-]{1,200}$' or coalesce(p_body->>'originalMessageId','') !~ '^<[^[:space:]<>]+@[^[:space:]<>]+>$' or p_body->>'bouncedAt' is null then return jsonb_build_object('error','invalid_bounce'); end if;
 event_at=(p_body->>'bouncedAt')::timestamptz;
 perform pg_advisory_xact_lock(867225110);
 select * into op from public.crm_sender_operations where operation_id=p_body->>'operationId' for update;
 if op.operation_id is null or op.state<>'sent' or op.provider_message_id is distinct from p_body->>'providerMessageId'
 or op.message_id is distinct from p_body->>'messageId' or op.email is distinct from p_body->>'email' then return jsonb_build_object('error','bounce_identity_mismatch'); end if;
 if event_at<op.created_at or event_at>clock_timestamp()+interval '30 seconds' then return jsonb_build_object('error','invalid_bounce_time'); end if;
 select * into prior from public.crm_sender_bounces where operation_id=op.operation_id;
 if prior.operation_id is not null then
  if prior.original_message_id<>p_body->>'originalMessageId' or prior.bounce_message_id<>p_body->>'bounceMessageId' or prior.bounced_at<>event_at or prior.status_code<>p_body->>'statusCode' then return jsonb_build_object('error','bounce_receipt_conflict'); end if;
 else
  insert into public.crm_sender_bounces(operation_id,original_message_id,bounce_message_id,bounced_at,status_code) values(op.operation_id,p_body->>'originalMessageId',p_body->>'bounceMessageId',event_at,p_body->>'statusCode');
  update public.crm_contacts set suppressed=true,suppression_reason=case when suppressed and suppression_reason is not null then suppression_reason else 'confirmed_hard_bounce' end where email=op.email;
  insert into public.crm_audit_events(company_id,actor,action,details) values(op.company_id,'machine:sender','mail_bounced',jsonb_build_object('operationId',op.operation_id,'providerMessageId',op.provider_message_id,'bounceMessageId',p_body->>'bounceMessageId','originalMessageId',p_body->>'originalMessageId','statusCode',p_body->>'statusCode','bouncedAt',event_at));
 end if;
 return jsonb_build_object('operationId',op.operation_id,'providerMessageId',op.provider_message_id,'sentAt',op.sent_at,'bouncedAt',event_at,'bounceMessageId',p_body->>'bounceMessageId','deliveryState','bounced');
end $$;
revoke all on function public.crm_sender_delivery_receipts(),public.crm_sender_record_bounce(jsonb) from public,anon,authenticated;
grant execute on function public.crm_sender_delivery_receipts(),public.crm_sender_record_bounce(jsonb) to service_role;
