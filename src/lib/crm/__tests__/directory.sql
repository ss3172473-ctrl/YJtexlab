-- Run only on an empty disposable PostgreSQL database with all CRM migrations installed.
begin;
do $$ begin
 if current_database() <> 'crm_directory_fixture' or exists(select 1 from public.crm_companies) then
   raise exception 'Requires empty crm_directory_fixture'; end if;
end $$;
insert into public.crm_companies(name,created_at) select 'Demo '||g, timestamptz '2026-01-01 00:00:00+00' + interval '1 minute'*g
from generate_series(1,103) g;
insert into public.crm_contacts(company_id,email,is_primary,suppressed)
select id,'demo'||replace(name,'Demo ','')||'@example.invalid',true,name='Demo 4' from public.crm_companies;
insert into public.crm_access_credentials(company_id,code_hash,encrypted_code)
select id,lpad(replace(name,'Demo ',''),43,'x'),'fixture-encrypted-never-return' from public.crm_companies;
insert into public.crm_sender_operations(operation_id,company_id,contact_id,email,credential_id,snapshot,message_id,mime_sha256,inbound_checked_at,state,provider_message_id,sent_at)
select c.name,c.id,t.id,t.email,k.id,'{}',c.name,repeat('0',64),now(),
 case when c.name='Demo 3' then 'uncertain' else 'sent' end,case when c.name<>'Demo 3' then c.name end,
 case when c.name<>'Demo 3' then now() end
from public.crm_companies c join public.crm_contacts t on c.id=t.company_id join public.crm_access_credentials k on k.company_id=c.id where c.name in ('Demo 1','Demo 2','Demo 3');
insert into public.crm_sender_bounces(operation_id,bounce_message_id,original_message_id,bounced_at,status_code) values ('Demo 1','fixture-bounce','Demo 1',now(),'5.1.1');
do $$
declare d jsonb;
begin
 d:=public.crm_company_directory('','all',0,100);
 assert d->>'total'='103' and d->>'matched'='103' and jsonb_array_length(d->'companies')=100;
 assert d->'companies'->0->>'name'='Demo 103';
 assert not (d::text like '%fixture-encrypted%' or d::text like '%snapshot%' or d::text like '%code_hash%');
 d:=public.crm_company_directory('','all',100,100); assert jsonb_array_length(d->'companies')=3 and d->'companies'->0->>'name'='Demo 3';
 d:=public.crm_company_directory('','sent',0,100); assert d->>'matched'='1' and d->'companies'->0->>'name'='Demo 2';
 d:=public.crm_company_directory('','bounced',0,100); assert d->>'matched'='1' and d->'companies'->0->>'name'='Demo 1';
 d:=public.crm_company_directory('','pending',0,100); assert d->>'matched'='1' and d->'companies'->0->>'name'='Demo 3';
 d:=public.crm_company_directory('DEMO4@EXAMPLE.INVALID','unknown',0,100); assert d->>'matched'='1' and d->'companies'->0->>'outreach_state'='unknown';
 d:=public.crm_company_directory('nothing','all',0,100); assert d->>'total'='103' and d->>'matched'='0' and d->'companies'='[]'::jsonb;
 assert not has_function_privilege('anon','public.crm_company_directory(text,text,integer,integer)','EXECUTE');
 assert not has_function_privilege('authenticated','public.crm_company_directory(text,text,integer,integer)','EXECUTE');
 assert has_function_privilege('service_role','public.crm_company_directory(text,text,integer,integer)','EXECUTE');
end $$;
rollback;
