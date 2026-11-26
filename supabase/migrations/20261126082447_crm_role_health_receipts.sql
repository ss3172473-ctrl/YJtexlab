-- Observations, never an assertion that an unconnected role is operational.
create table public.crm_role_health_config (
 role text primary key check(role in ('collection','send','crm','check')),
 configuration_state text not null check(configuration_state in ('unknown','configured','not_configured')),
 schedule jsonb,
 producer_connected boolean not null default false,
 activated_at timestamptz,
 evidence_scope text not null
);
insert into public.crm_role_health_config(role,configuration_state,schedule,evidence_scope)values
 ('collection','unknown',null,'Dots Cron activation and receipt publisher not verified'),
 ('send','configured','{"timezone":"Asia/Seoul","startTime":"10:00","frequency":"daily"}','Existing installed daily sender plist and manual run verified; external receipt publisher not connected'),
 ('crm','not_configured',null,'Inbox and approvals code exists; scheduled receipt publisher not connected'),
 ('check','not_configured',null,'GitHub watchdog file exists; repository activation variables and execution not verified');
create table public.crm_role_health_receipts (
 role text not null references public.crm_role_health_config(role),
 run_id text not null,
 stage text not null check(stage in ('started','terminal')),
 phase text not null check(phase in ('started','completed','shortfall','needs_review','failed')),
 emitted_at timestamptz,
 received_at timestamptz not null default clock_timestamp(),
 payload jsonb not null,
 primary key(role,run_id,stage),
 check((phase='started')=(stage='started'))
);
create index crm_role_receipts_recent on public.crm_role_health_receipts(role,stage,received_at desc);
alter table public.crm_role_health_config enable row level security;
alter table public.crm_role_health_receipts enable row level security;
revoke all on public.crm_role_health_config,public.crm_role_health_receipts from public,anon,authenticated;
grant select on public.crm_role_health_config to service_role;
grant select,insert on public.crm_role_health_receipts to service_role;

create function public.crm_role_health_record(p_body jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare item public.crm_role_health_receipts; start_item public.crm_role_health_receipts;
 target_role text=p_body->>'role'; target_run text=p_body->>'runId'; target_phase text=p_body->>'phase'; target_stage text; allowed text[]; k text; v jsonb;
begin
 if target_role is null or target_role not in ('collection','send','crm','check') or coalesce(target_run,'') !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{7,127}$'
  or target_phase is null or target_phase not in ('started','completed','shortfall','needs_review','failed') then return jsonb_build_object('error','invalid_receipt'); end if;
 if exists(select 1 from jsonb_object_keys(p_body) x where x not in ('role','runId','phase','emittedAt','counts','evidence','codeSha')) then return jsonb_build_object('error','invalid_receipt_field'); end if;
 if p_body->>'emittedAt' is not null and (p_body->>'emittedAt')::timestamptz>clock_timestamp()+interval '30 seconds' then return jsonb_build_object('error','invalid_producer_clock'); end if;
 if p_body->>'codeSha' is not null and p_body->>'codeSha' !~ '^[a-f0-9]{40}$' then return jsonb_build_object('error','invalid_revision'); end if;
 if jsonb_typeof(p_body->'counts') is distinct from 'object' then return jsonb_build_object('error','invalid_counts'); end if;
 allowed=case target_role when 'collection' then array['collected','duplicates','queued','review'] when 'send' then array['accepted','confirmedBounces','netAccepted','target','sentThisRun','blocked','uncertain'] when 'crm' then array['scanned','inserted','duplicates','review','pendingApprovals','approvedPendingExecution','uncertain'] else array['checked','missing','failed','notConfigured'] end;
 for k,v in select * from jsonb_each(p_body->'counts') loop
  if not k=any(allowed) or jsonb_typeof(v)<>'number' or v::text !~ '^[0-9]{1,10}$' or (v::text)::numeric>1000000000 then return jsonb_build_object('error','invalid_count'); end if;
 end loop;
 if p_body->'evidence' is distinct from 'null'::jsonb then
  if jsonb_typeof(p_body->'evidence') is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_body->'evidence') x where x not in ('kind','ref')) then return jsonb_build_object('error','invalid_evidence'); end if;
  if (p_body->'evidence'->>'kind') is distinct from (case target_role when 'collection' then 'collector_run' when 'send' then 'sender_day' when 'crm' then 'inbox_checkpoint' else 'watchdog_run' end)
   or coalesce(p_body->'evidence'->>'ref','') !~ (case target_role when 'collection' then '^[a-f0-9]{64}$' when 'send' then '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' when 'crm' then '^[0-9]{1,40}$' else '^[0-9]{1,30}$' end) then return jsonb_build_object('error','invalid_evidence'); end if;
 elsif target_phase='completed' then return jsonb_build_object('error','evidence_required'); end if;
 target_stage=case when target_phase='started' then 'started' else 'terminal' end;
 perform pg_advisory_xact_lock(867225113);
 select * into item from public.crm_role_health_receipts where role=target_role and run_id=target_run and stage=target_stage;
 if item.role is not null then
  if item.payload<>p_body then return jsonb_build_object('error','health_receipt_conflict'); end if;
  return jsonb_build_object('role',item.role,'runId',item.run_id,'phase',item.phase,'emittedAt',item.emitted_at,'receivedAt',item.received_at,'duplicate',true);
 end if;
 if target_stage='terminal' then
  select * into start_item from public.crm_role_health_receipts where role=target_role and run_id=target_run and stage='started';
  if start_item.role is null then return jsonb_build_object('error','health_start_required'); end if;
  if start_item.emitted_at is not null and p_body->>'emittedAt' is not null and (p_body->>'emittedAt')::timestamptz<start_item.emitted_at then return jsonb_build_object('error','health_terminal_before_start'); end if;
 end if;
 insert into public.crm_role_health_receipts(role,run_id,stage,phase,emitted_at,payload)values(target_role,target_run,target_stage,target_phase,(p_body->>'emittedAt')::timestamptz,p_body)returning * into item;
 return jsonb_build_object('role',item.role,'runId',item.run_id,'phase',item.phase,'emittedAt',item.emitted_at,'receivedAt',item.received_at,'duplicate',false);
end $$;
create function public.crm_role_health_read() returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('meaning','observed_receipts_only_not_business_success','observedAt',statement_timestamp(),'roles',jsonb_object_agg(c.role,jsonb_build_object(
  'configuration',jsonb_build_object('state',c.configuration_state,'schedule',c.schedule,'producerConnected',c.producer_connected,'activatedAt',c.activated_at,'evidenceScope',c.evidence_scope),
  'latestStarted',(select r.payload||jsonb_build_object('receivedAt',r.received_at) from public.crm_role_health_receipts r where r.role=c.role and r.stage='started' order by r.received_at desc,r.run_id desc limit 1),
  'latestTerminal',(select r.payload||jsonb_build_object('receivedAt',r.received_at) from public.crm_role_health_receipts r where r.role=c.role and r.stage='terminal' order by r.received_at desc,r.run_id desc limit 1)
 ))) from public.crm_role_health_config c
$$;
revoke all on function public.crm_role_health_record(jsonb),public.crm_role_health_read() from public,anon,authenticated;
grant execute on function public.crm_role_health_record(jsonb),public.crm_role_health_read() to service_role;
