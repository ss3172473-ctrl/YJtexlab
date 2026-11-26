-- Only newly committed collector registrations acquire a send hold. Catalog access is unchanged.
create table public.crm_collector_send_checks (
 company_id uuid primary key references public.crm_companies(id),
 operation_id text not null unique references public.crm_collector_operations(operation_id),
 verified_snapshot jsonb,
 receipt jsonb,
 created_at timestamptz not null default clock_timestamp(),
 check ((verified_snapshot is null) = (receipt is null))
);
alter table public.crm_collector_send_checks enable row level security;
revoke all on public.crm_collector_send_checks from public,anon,authenticated;
grant all on public.crm_collector_send_checks to service_role;
create function public.crm_hold_collector_registration() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.receipt->>'status'='created' then
  insert into public.crm_collector_send_checks(company_id,operation_id)
   values((new.receipt->>'companyId')::uuid,new.operation_id);
 end if;
 return new;
end $$;
create trigger crm_hold_collector_registration after insert on public.crm_collector_operations
 for each row execute function public.crm_hold_collector_registration();

-- Separate snapshot is deliberately independent of sender suppression/prior-contact rules.
create function public.crm_collector_access_snapshot(p_company uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('companyId',c.id,'name',c.name,'companyUpdatedAt',c.updated_at,
 'contactId',t.id,'email',t.email,'credentialId',a.id,'encryptedCode',a.encrypted_code,
 'codeHash',a.code_hash,'canViewPrices',c.can_view_prices)
 from public.crm_companies c join public.crm_contacts t on t.company_id=c.id and t.is_primary
 join public.crm_access_credentials a on a.company_id=c.id and a.revoked_at is null where c.id=p_company
$$;
create function public.crm_collector_verify_access(p_company uuid,p_operation text,p_expected jsonb default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare hold public.crm_collector_send_checks; snap jsonb; result jsonb;
begin
 -- Same company-first locking order as sender claim/begin and admin edits.
 perform 1 from public.crm_companies where id=p_company for update;
 perform 1 from public.crm_contacts where company_id=p_company for share;
 perform 1 from public.crm_access_credentials where company_id=p_company for share;
 select * into hold from public.crm_collector_send_checks where company_id=p_company for update;
 if hold.company_id is null or hold.operation_id<>p_operation then return jsonb_build_object('error','not_held_registration'); end if;
 snap=public.crm_collector_access_snapshot(p_company);
 if snap is null then return jsonb_build_object('error','no_active_access'); end if;
 if p_expected is null then return jsonb_build_object('snapshot',snap); end if;
 if snap is distinct from p_expected then return jsonb_build_object('error','stale_access_snapshot'); end if;
 if hold.verified_snapshot=snap then return hold.receipt; end if;
 result=jsonb_build_object('operationId',p_operation,'companyId',p_company,
 'contactId',snap->>'contactId','credentialId',snap->>'credentialId','companyUpdatedAt',snap->>'companyUpdatedAt',
 'verificationId',gen_random_uuid(),'verifiedAt',clock_timestamp(),
 'verificationMethod','server_access_resolver','sendHoldReleased',true,'browserVerified',false);
 update public.crm_collector_send_checks set verified_snapshot=snap,receipt=result where company_id=p_company;
 insert into public.crm_audit_events(company_id,actor,action,details)
 values(p_company,'machine:collector','collector_access_verified',result);
 return result;
end $$;
create or replace function public.crm_sender_snapshot(p_company uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('companyId',c.id,'name',c.name,'companyUpdatedAt',c.updated_at,
   'contactId',t.id,'email',t.email,'credentialId',a.id,'encryptedCode',a.encrypted_code,'codeHash',a.code_hash)
 from public.crm_companies c join public.crm_contacts t on t.company_id=c.id and t.is_primary
 join public.crm_access_credentials a on a.company_id=c.id and a.revoked_at is null
 where c.id=p_company and not t.suppressed
 and not exists(select 1 from public.crm_collector_send_checks h where h.company_id=c.id
   and h.verified_snapshot is distinct from public.crm_collector_access_snapshot(c.id))
 and (c.source_key is null or btrim(coalesce(c.legacy_metadata->>'접촉 상태',''))<>'')
 and not exists(select 1 from public.crm_contacts x where x.email=t.email and (x.suppressed or x.company_id<>c.id))
 -- Imported rows retain historical evidence; any established contact is excluded.
 and regexp_replace(coalesce(c.legacy_metadata->>'접촉 상태',''),'\s','','g') in ('','미접촉','발송대기','수집완료')
 and not exists(select 1 from jsonb_each_text(c.legacy_metadata) m where m.key ~ '(발송.*(일|시)|최초.*접촉|최근.*접촉|접촉.*기록|발신.*계정)' and btrim(m.value)<>'')
$$;

revoke all on function public.crm_hold_collector_registration(),public.crm_collector_access_snapshot(uuid),public.crm_collector_verify_access(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.crm_hold_collector_registration(),public.crm_collector_access_snapshot(uuid),public.crm_collector_verify_access(uuid,text,jsonb) to service_role;
