-- Server-only CRM. No public/client access; Next.js authenticates administrators.
create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 200),
  can_view_prices boolean not null default false,
  source_key text unique,
  legacy_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies(id),
  email text not null check (email = lower(email) and email ~ '^[^[:space:]@;,]+@[^[:space:]@;,]+\.[^[:space:]@;,]+$'),
  is_primary boolean not null default false,
  suppressed boolean not null default false,
  suppression_reason text,
  unique(company_id,email)
);
create unique index crm_one_primary_contact on public.crm_contacts(company_id) where is_primary;
create index crm_contact_email on public.crm_contacts(email);
create table public.crm_access_credentials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.crm_companies(id),
  code_hash text not null unique check (length(code_hash) = 43),
  encrypted_code text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);
create unique index crm_one_usable_code on public.crm_access_credentials(company_id) where revoked_at is null;
create table public.crm_audit_events (
  id bigint generated always as identity primary key,
  company_id uuid references public.crm_companies(id),
  actor text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index crm_audit_company on public.crm_audit_events(company_id,created_at);
create table public.crm_access_events (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.crm_companies(id),
  campaign text not null default '',
  created_at timestamptz not null default now()
);
create index crm_access_company on public.crm_access_events(company_id,created_at);

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_access_credentials enable row level security;
alter table public.crm_audit_events enable row level security;
alter table public.crm_access_events enable row level security;
revoke all on public.crm_companies,public.crm_contacts,public.crm_access_credentials,public.crm_audit_events,public.crm_access_events from anon,authenticated;
grant all on public.crm_companies,public.crm_contacts,public.crm_access_credentials,public.crm_audit_events,public.crm_access_events to service_role;
grant usage,select on sequence public.crm_audit_events_id_seq,public.crm_access_events_id_seq to service_role;

-- SECURITY INVOKER intentionally. Only service_role may call these transactions.
create function public.crm_save_company(p_id uuid,p_name text,p_email text,p_prices boolean,p_expected timestamptz,p_actor text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare target public.crm_companies; cid uuid;
begin
  if p_id is null then
    insert into public.crm_companies(name) values(p_name) returning id into cid;
    insert into public.crm_contacts(company_id,email,is_primary) values(cid,lower(p_email),true);
    insert into public.crm_audit_events(company_id,actor,action) values(cid,p_actor,'company_created');
    return cid;
  end if;
  select * into strict target from public.crm_companies where id=p_id for update;
  if p_expected is null or target.updated_at <> p_expected then raise exception 'stale_company'; end if;
  if p_name is not null then update public.crm_companies set name=p_name where id=p_id; end if;
  if p_email is not null then
    update public.crm_contacts set is_primary=false where company_id=p_id and is_primary;
    insert into public.crm_contacts(company_id,email,is_primary) values(p_id,lower(p_email),true)
      on conflict(company_id,email) do update set is_primary=true;
  end if;
  if p_prices is not null then
    update public.crm_companies set can_view_prices=p_prices where id=p_id;
    insert into public.crm_audit_events(company_id,actor,action,details)
      values(p_id,p_actor,'price_permission_approved',jsonb_build_object('before',target.can_view_prices,'after',p_prices));
  end if;
  update public.crm_companies set updated_at=clock_timestamp() where id=p_id;
  insert into public.crm_audit_events(company_id,actor,action) values(p_id,p_actor,'company_updated');
  return p_id;
end $$;
revoke all on function public.crm_save_company(uuid,text,text,boolean,timestamptz,text) from public,anon,authenticated;
grant execute on function public.crm_save_company(uuid,text,text,boolean,timestamptz,text) to service_role;

create function public.crm_manage_code(p_id uuid,p_action text,p_actor text,p_expected timestamptz,p_hash text,p_encrypted text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target public.crm_companies; existing public.crm_access_credentials;
begin
  select * into strict target from public.crm_companies where id=p_id for update;
  if p_expected is not null and target.updated_at <> p_expected then raise exception 'stale_company'; end if;
  if p_action not in ('issue','reissue','revoke') then raise exception 'invalid_action'; end if;
  select * into existing from public.crm_access_credentials where company_id=p_id and revoked_at is null;
  if p_action='issue' and existing.id is not null then
    insert into public.crm_audit_events(company_id,actor,action) values(p_id,p_actor,'code_revealed');
    return jsonb_build_object('encrypted_code',existing.encrypted_code);
  end if;
  if existing.id is not null then
    update public.crm_access_credentials set revoked_at=clock_timestamp() where id=existing.id;
  end if;
  if p_action <> 'revoke' then
    insert into public.crm_access_credentials(company_id,code_hash,encrypted_code) values(p_id,p_hash,p_encrypted);
  end if;
  update public.crm_companies set updated_at=clock_timestamp() where id=p_id;
  insert into public.crm_audit_events(company_id,actor,action) values(p_id,p_actor,'code_'||p_action);
  return jsonb_build_object('encrypted_code',case when p_action='revoke' then null else p_encrypted end);
end $$;
revoke all on function public.crm_manage_code(uuid,text,text,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.crm_manage_code(uuid,text,text,timestamptz,text,text) to service_role;

-- Whole snapshot imports atomically. A source_key makes retry safe without
-- overwriting a company that an administrator has already started editing.
create function public.crm_import_snapshot(p_rows jsonb,p_source text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare item jsonb; contact jsonb; cid uuid; imported integer=0; skipped integer=0;
begin
  for item in select value from jsonb_array_elements(p_rows) loop
    insert into public.crm_companies(id,name,can_view_prices,source_key,legacy_metadata)
    values((item->>'id')::uuid,item->>'name',(item->>'can_view_prices')::boolean,p_source||':'||(item->>'row'),item->'legacy_metadata')
    on conflict(source_key) do nothing returning id into cid;
    if cid is null then
      if exists(select 1 from public.crm_companies c where c.source_key=p_source||':'||(item->>'row') and c.legacy_metadata->>'source_digest' is distinct from item->'legacy_metadata'->>'source_digest') then
        raise exception 'source_snapshot_changed';
      end if;
      skipped=skipped+1; continue;
    end if;
    for contact in select value from jsonb_array_elements(item->'contacts') loop
      insert into public.crm_contacts(company_id,email,is_primary,suppressed,suppression_reason)
      values(cid,contact->>'email',(contact->>'is_primary')::boolean,(contact->>'suppressed')::boolean,contact->>'suppression_reason');
    end loop;
    if item->>'code_hash' is not null then
      insert into public.crm_access_credentials(company_id,code_hash,encrypted_code,revoked_at)
      values(cid,item->>'code_hash',item->>'encrypted_code',case when (item->>'revoked')::boolean then now() else null end);
    end if;
    insert into public.crm_audit_events(company_id,actor,action,details)
      values(cid,'migration','sheet_import',jsonb_build_object('source',p_source,'row',item->>'row'));
    imported=imported+1;
  end loop;
  return jsonb_build_object('imported',imported,'skipped',skipped);
end $$;
revoke all on function public.crm_import_snapshot(jsonb,text) from public,anon,authenticated;
grant execute on function public.crm_import_snapshot(jsonb,text) to service_role;

create function public.crm_list_companies(p_query text,p_offset integer,p_limit integer)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select coalesce(jsonb_agg(row_data),'[]'::jsonb) from (
    select jsonb_build_object('id',c.id,'name',c.name,'can_view_prices',c.can_view_prices,'updated_at',c.updated_at,
      'crm_contacts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'email',t.email,'is_primary',t.is_primary,'suppressed',t.suppressed)) from public.crm_contacts t where t.company_id=c.id),'[]'::jsonb),
      'crm_access_credentials',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'revoked_at',a.revoked_at)) from public.crm_access_credentials a where a.company_id=c.id),'[]'::jsonb)) row_data
    from public.crm_companies c
    where p_query='' or position(lower(p_query) in lower(c.name))>0 or exists(select 1 from public.crm_contacts t where t.company_id=c.id and position(lower(p_query) in t.email)>0)
    order by c.created_at desc,c.id
    limit least(greatest(p_limit,1),101) offset greatest(p_offset,0)
  ) rows;
$$;
revoke all on function public.crm_list_companies(text,integer,integer) from public,anon,authenticated;
grant execute on function public.crm_list_companies(text,integer,integer) to service_role;
