-- Dormant until an operator establishes the internal/QA exclusions and cutover.
begin;
create schema swatch_notice;
revoke all on schema swatch_notice from public, anon, authenticated;
create table swatch_notice.control(singleton boolean primary key check(singleton), floor_id bigint not null, accepted_after timestamptz not null default clock_timestamp());
create table swatch_notice.excluded(company_id uuid primary key references public.crm_companies(id) on delete cascade);
create table swatch_notice.counts(company_id uuid primary key references public.crm_companies(id) on delete cascade, visits bigint not null);
create table swatch_notice.queue(
 event_id bigint primary key references public.crm_access_events(id) on delete cascade, company_id uuid not null references public.crm_companies(id) on delete cascade,
 ordinal bigint not null check(ordinal>0), visited_at timestamptz not null, state text not null default 'ready' check(state in ('ready','sending','delivered','uncertain','blocked')),
 lease uuid, started_at timestamptz, due timestamptz not null default now(), slack_ts text,
 unique(company_id, ordinal));
alter table swatch_notice.control enable row level security;
alter table swatch_notice.excluded enable row level security;
alter table swatch_notice.counts enable row level security;
alter table swatch_notice.queue enable row level security;
create index swatch_notice_due on swatch_notice.queue(due,event_id) where state='ready';

-- Worker only; no triggers or network I/O in access admission. No insertion watermark:
-- a delayed transaction with a lower event ID will still be picked up once committed.
create function swatch_notice.fill() returns integer language plpgsql security definer set search_path='' as $$
declare r record; n bigint; c int:=0;
begin
 if not pg_try_advisory_xact_lock(61473587,4) then return 0; end if;
 for r in select e.id,e.company_id,e.created_at from public.crm_access_events e, swatch_notice.control ctl
   where e.id>ctl.floor_id and e.created_at>=ctl.accepted_after and not exists(select from swatch_notice.excluded x where x.company_id=e.company_id)
   and not exists(select from swatch_notice.queue q where q.event_id=e.id) order by e.id limit 1000
 loop
  insert into swatch_notice.counts as a values(r.company_id,1) on conflict(company_id) do update set visits=a.visits+1 returning visits into n;
  insert into swatch_notice.queue(event_id,company_id,ordinal,visited_at) values(r.id,r.company_id,n,r.created_at);
  c:=c+1;
 end loop;
 return c;
end $$;
create function swatch_notice.claim() returns table(event_id bigint,lease uuid,company_name text,visited_at timestamptz,ordinal bigint)
language plpgsql security definer set search_path='' as $$ begin
 if not exists(select from swatch_notice.control) then return; end if;
 update swatch_notice.queue q set state='uncertain' where q.state='sending' and q.started_at < now()-interval '3 minutes';
 return query with next as (
 select q.event_id from swatch_notice.queue q
 where q.state='ready' and q.due<=now() and not exists(select from swatch_notice.excluded x where x.company_id=q.company_id)
 and not exists(select from swatch_notice.queue p where p.company_id=q.company_id and p.ordinal<q.ordinal and p.state not in ('delivered'))
 order by q.event_id limit 1 for update of q skip locked
 ), locked as (update swatch_notice.queue q set state='sending',lease=gen_random_uuid(),started_at=clock_timestamp() from next where q.event_id=next.event_id returning q.*)
 select q.event_id,q.lease,c.name,q.visited_at,q.ordinal from locked q join public.crm_companies c on c.id=q.company_id;
end $$;
create function swatch_notice.finish(p_id bigint,p_lease uuid,p_result text,p_ts text,p_delay integer) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 if p_result not in ('delivered','ready','uncertain','blocked') or (p_result='delivered' and coalesce(p_ts,'') !~ '^[0-9]{10,}\.[0-9]{6}$') then raise exception 'bad receipt'; end if;
 update swatch_notice.queue set state=p_result,slack_ts=case when p_result='delivered' then p_ts end,due=now()+make_interval(secs=>greatest(1,least(86400,p_delay)))
 where event_id=p_id and lease=p_lease and state='sending'; return found;
end $$;
revoke all on all tables in schema swatch_notice from public,anon,authenticated;
revoke all on all functions in schema swatch_notice from public,anon,authenticated;
commit;
