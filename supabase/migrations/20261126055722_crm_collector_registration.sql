-- A durable receipt is the source of truth after a lost HTTP response.
create table public.crm_collector_operations (
  operation_id text primary key check (operation_id ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$'),
  payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$'),
  receipt jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.crm_collector_operations enable row level security;
revoke all on public.crm_collector_operations from public,anon,authenticated;
grant all on public.crm_collector_operations to service_role;

create function public.crm_register_collected_company(
  p_operation text,p_digest text,p_name text,p_email text,p_source_url text,p_provenance text,p_hash text,p_encrypted text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare prior public.crm_collector_operations; contact public.crm_contacts; company public.crm_companies;
  credential public.crm_access_credentials; matches integer; result jsonb; created boolean=false;
begin
  if p_operation is null or p_operation !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$'
    or p_digest is null or p_digest !~ '^[a-f0-9]{64}$'
    or p_name is null or length(btrim(p_name)) not between 1 and 200
    or p_email is null or length(p_email)>254 or p_email<>lower(btrim(p_email))
    or p_email !~ '^[^[:space:]@;,]+@[^[:space:]@;,]+\.[^[:space:]@;,]+$'
    or p_source_url is null or length(p_source_url)>2000 or p_source_url !~ '^https?://'
    or p_provenance is null or length(btrim(p_provenance)) not between 1 and 2000
    then raise exception 'invalid_collector_input'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm-collector:'||p_operation,0));
  select * into prior from public.crm_collector_operations where operation_id=p_operation;
  if found then
    if prior.payload_digest<>p_digest then return jsonb_build_object('error','operation_payload_conflict'); end if;
    return prior.receipt;
  end if;
  -- Serialize against all contact writers, including the existing admin RPC.
  -- Small registration transactions only; no network work occurs under the lock.
  lock table public.crm_contacts in share row exclusive mode;
  select count(*) into matches from public.crm_contacts where email=p_email;
  if matches>1 then return jsonb_build_object('error','ambiguous_contact'); end if;
  if matches=1 then
    select * into contact from public.crm_contacts where email=p_email;
    select * into company from public.crm_companies where id=contact.company_id;
    select * into credential from public.crm_access_credentials where company_id=company.id and revoked_at is null;
  else
    insert into public.crm_companies(name) values(p_name) returning * into company;
    insert into public.crm_contacts(company_id,email,is_primary) values(company.id,p_email,true) returning * into contact;
    insert into public.crm_access_credentials(company_id,code_hash,encrypted_code) values(company.id,p_hash,p_encrypted) returning * into credential;
    created=true;
  end if;
  result=jsonb_build_object('operationId',p_operation,'payloadDigest',p_digest,
    'status',case when created then 'created' else 'matched_existing' end,
    'companyId',company.id,'contactId',contact.id,'credentialId',credential.id,
    'companyUpdatedAt',company.updated_at,'credentialIssuedAt',credential.issued_at,
    'suppressed',contact.suppressed,
    'requiresReview',not created and (lower(btrim(company.name))<>lower(btrim(p_name)) or credential.id is null or contact.suppressed),
    'recordedAt',clock_timestamp());
  insert into public.crm_collector_operations(operation_id,payload_digest,receipt) values(p_operation,p_digest,result);
  insert into public.crm_audit_events(company_id,actor,action,details)
    values(company.id,'machine:collector',case when created then 'collector_company_created' else 'collector_existing_matched' end,
      jsonb_build_object('operation_id',p_operation,'source_url',p_source_url,'provenance',p_provenance));
  return result;
end $$;
revoke all on function public.crm_register_collected_company(text,text,text,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.crm_register_collected_company(text,text,text,text,text,text,text,text) to service_role;
