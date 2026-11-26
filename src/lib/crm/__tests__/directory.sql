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
-- Add disposable, synthetic receipts only after original delivery/pagination assertions.
update public.crm_sender_operations set provider_thread_id='thread-'||replace(operation_id,'Demo ','');
insert into public.crm_sender_operations(operation_id,company_id,contact_id,email,credential_id,snapshot,message_id,mime_sha256,inbound_checked_at,state,provider_message_id,provider_thread_id,sent_at)
select c.name,c.id,t.id,t.email,k.id,'{}',c.name,repeat('0',64),now(),
 'sent',c.name,'thread-'||replace(c.name,'Demo ',''),now()
from public.crm_companies c join public.crm_contacts t on c.id=t.company_id join public.crm_access_credentials k on k.company_id=c.id where c.name in ('Demo 4','Demo 5','Demo 6','Demo 7','Demo 8','Demo 9','Demo 10','Demo 11');
with f (company_id_num,message_num,kind,match_status,thread_num,in_reply_to,refs,contact_num,recipient) as (values
 (1, 1,'reply','matched',1,null,'{}'::text[],1,'hello@yjtexlab.com'),
 (2, 2,'reply','matched',99,'Demo 2','{}'::text[],2,'hello@yjtexlab.com'),
 (2, 3,'reply','matched',99,null,array['Demo 2'],2,'hello@yjtexlab.com'),
 (3, 4,'reply','matched',3,'Demo 3','{}'::text[],3,'hello@yjtexlab.com'),
 (4, 5,'auto_response','matched',4,null,'{}'::text[],4,'hello@yjtexlab.com'),
 (5, 6,'optout','matched',5,null,'{}'::text[],5,'hello@yjtexlab.com'),
 (6, 7,'reply','unmatched',6,null,'{}'::text[],6,'hello@yjtexlab.com'),
 (7, 8,'reply','ambiguous',7,null,'{}'::text[],7,'hello@yjtexlab.com'),
 (8, 9,'reply','matched',8,null,'{}'::text[],9,'hello@yjtexlab.com'),
 (9,10,'reply','matched',99,null,'{}'::text[],9,'hello@yjtexlab.com'),
 (10,11,'reply','matched',10,null,'{}'::text[],10,'other@example.invalid'),
 (11,12,'bounce','matched',11,null,'{}'::text[],11,'hello@yjtexlab.com'),
 (null,13,'reply','unmatched',99,null,'{}'::text[],null,'hello@yjtexlab.com')
)
insert into public.crm_inbound_messages(mailbox,provider_message_id,provider_thread_id,from_email,to_emails,in_reply_to,reference_ids,received_at,subject,text_body,classification,classification_evidence,receipt_digest,company_id,contact_id,match_status)
select 'hello@yjtexlab.com','PRIVATE-PROVIDER-'||f.message_num,'thread-'||f.thread_num,
 coalesce(t.email,'PRIVATE-EXTERNAL'),array[f.recipient],f.in_reply_to,f.refs,now(),'PRIVATE-SUBJECT','PRIVATE-BODY',f.kind,'PRIVATE-PROOF',
 lpad(f.message_num::text,64,'0'), c.id,t.id,f.match_status
from f left join public.crm_companies c on c.name='Demo '||f.company_id_num
left join public.crm_companies tc on tc.name='Demo '||f.contact_num
left join public.crm_contacts t on t.company_id=tc.id;
set local role service_role;
do $$
declare d jsonb;
begin
 d:=public.crm_company_directory('','replied',0,100);
 assert d->>'total'='103' and d->>'matched'='2' and jsonb_array_length(d->'companies')=2;
 assert d->'companies'->0->>'name'='Demo 2' and d->'companies'->0->>'outreach_state'='sent' and d->'companies'->0->>'has_verified_reply'='true';
 assert d->'companies'->1->>'name'='Demo 1' and d->'companies'->1->>'outreach_state'='bounced' and d->'companies'->1->>'has_verified_reply'='true';
 assert d::text not like '%PRIVATE-%';
 d:=public.crm_company_directory('','bounced',0,100);
 assert d->>'matched'='1' and d->'companies'->0->>'name'='Demo 1' and d->'companies'->0->>'has_verified_reply'='true';
 d:=public.crm_company_directory('','replied',1,1);
 assert d->>'total'='103' and d->>'matched'='2' and jsonb_array_length(d->'companies')=1 and d->'companies'->0->>'name'='Demo 1';
 d:=public.crm_company_directory('demo2@example.invalid','replied',0,100);
 assert d->>'matched'='1' and d->'companies'->0->>'name'='Demo 2';
 d:=public.crm_company_directory('Demo 9','all',0,100);
 assert d->'companies'->0->>'has_verified_reply'='false';
end $$;
reset role;
rollback;
