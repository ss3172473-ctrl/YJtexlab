-- Additive, read-only administrator projection. Never touches sending, suppression or prices.
create function public.crm_company_directory(p_query text,p_state text,p_offset integer,p_limit integer)
returns jsonb language sql stable security invoker set search_path='' as $$
 with states as materialized (
   select c.id,c.created_at,
     case when b.operation_id is not null then 'bounced'
          when o.state='sent' and o.provider_message_id is not null and o.sent_at is not null then 'sent'
          when o.operation_id is not null then 'pending' else 'unknown' end as outreach_state
   from public.crm_companies c
   left join public.crm_sender_operations o on o.company_id=c.id
   left join public.crm_sender_bounces b on b.operation_id=o.operation_id
 ), matched as materialized (
   select s.* from states s join public.crm_companies c using(id)
   where (p_state='all' or s.outreach_state=p_state) and
     (p_query='' or position(lower(p_query) in lower(c.name))>0 or exists (
       select 1 from public.crm_contacts t where t.company_id=c.id and position(lower(p_query) in t.email)>0))
 ), page as (
   select * from matched order by created_at desc,id
   limit least(greatest(p_limit,1),100) offset greatest(p_offset,0)
 )
 select jsonb_build_object('total',(select count(*) from states),'matched',(select count(*) from matched),
   'companies',coalesce((select jsonb_agg(jsonb_build_object(
       'id',c.id,'name',c.name,'updated_at',c.updated_at,'can_view_prices',c.can_view_prices,
       'outreach_state',p.outreach_state,
       'crm_contacts',coalesce((select jsonb_agg(jsonb_build_object('id',t.id,'email',t.email,'is_primary',t.is_primary,'suppressed',t.suppressed) order by t.is_primary desc,t.id)
         from public.crm_contacts t where t.company_id=c.id),'[]'::jsonb),
       'code_issued',exists(select 1 from public.crm_access_credentials a where a.company_id=c.id and a.revoked_at is null)
     ) order by p.created_at desc,p.id) from page p join public.crm_companies c using(id)),'[]'::jsonb))
$$;
revoke all on function public.crm_company_directory(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.crm_company_directory(text,text,integer,integer) to service_role;
