-- Separate least-privilege GA4 Worker reads only eligible daily aggregates.
begin;
create table swatch_notice.ga_days(
 day date primary key,
 counts jsonb not null,
 state text not null default 'sending' check(state in ('sending','submitted','uncertain')),
 lease uuid not null default gen_random_uuid(),
 started_at timestamptz not null default now()
);
alter table swatch_notice.ga_days enable row level security;
revoke all on swatch_notice.ga_days from public,anon,authenticated;
create function swatch_notice.claim_ga() returns table(day date,counts jsonb,lease uuid)
language plpgsql security definer set search_path='' as $$ begin
 if not pg_try_advisory_xact_lock(61473587,5) then return; end if;
 if not exists(select from swatch_notice.control) then return; end if;
 update swatch_notice.ga_days g set state='uncertain' where g.state='sending' and g.started_at<now()-interval '10 minutes';
 return query with
 groups as (
  select (q.visited_at at time zone 'Asia/Seoul')::date as day,
   case when q.ordinal=1 then 'first' when q.ordinal=2 then 'second' else 'third_plus' end bucket,
   count(*) entries, count(distinct q.company_id) companies
  from swatch_notice.queue q
  where q.visited_at >= ((timezone('Asia/Seoul',now())::date-2)::timestamp at time zone 'Asia/Seoul')
  and q.visited_at < (timezone('Asia/Seoul',now()-interval '30 minutes')::date::timestamp at time zone 'Asia/Seoul')
  and not exists(select from swatch_notice.excluded x where x.company_id=q.company_id)
  and not exists(select from swatch_notice.ga_days d where d.day=(q.visited_at at time zone 'Asia/Seoul')::date)
  group by 1,2
  having count(distinct q.company_id)>=5
 ), candidate as (
  select g.day,jsonb_object_agg(g.bucket,g.entries) counts from groups g
  where not exists (
   select from public.crm_access_events e, swatch_notice.control ctl
   where e.id>ctl.floor_id and e.created_at>=ctl.accepted_after and e.created_at>=g.day::timestamp at time zone 'Asia/Seoul'
   and e.created_at<(g.day+1)::timestamp at time zone 'Asia/Seoul'
   and not exists(select from swatch_notice.excluded x where x.company_id=e.company_id)
   and not exists(select from swatch_notice.queue q where q.event_id=e.id)
  )
  group by g.day order by g.day limit 1
 )
 insert into swatch_notice.ga_days as data(day,counts)
  select c.day,c.counts from candidate c
  on conflict on constraint ga_days_pkey do nothing
  returning data.day,data.counts,data.lease;
end $$;
create function swatch_notice.finish_ga(p_day date,p_lease uuid,p_result text) returns boolean
language plpgsql security definer set search_path='' as $$ begin
 if p_result not in ('submitted','uncertain') then raise exception 'bad receipt'; end if;
 update swatch_notice.ga_days g set state=p_result where g.day=p_day and g.lease=p_lease and g.state='sending';
 return found;
end $$;
revoke all on function swatch_notice.claim_ga(),swatch_notice.finish_ga(date,uuid,text) from public,anon,authenticated;
commit;
