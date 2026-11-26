-- Run in an isolated database after both CRM migrations. No real customer data.
begin;
set local role service_role;
do $$
declare a jsonb; b jsonb; cid uuid; n integer; before_company jsonb;
begin
 a=public.crm_register_collected_company('fixture:0001',repeat('a',64),'Fixture','buyer@example.test','https://example.test','Public contact',repeat('a',43),'encrypted-fixture');
 assert a->>'status'='created'; cid=(a->>'companyId')::uuid;
 assert (select not can_view_prices from public.crm_companies where id=cid);
 assert a->>'credentialId' is not null;
 assert not (a ? 'code') and not (a ? 'encrypted_code');
 b=public.crm_register_collected_company('fixture:0001',repeat('a',64),'Fixture','buyer@example.test','https://example.test','Public contact',repeat('b',43),'other');
 assert a=b,'retry receipt changed';
 b=public.crm_register_collected_company('fixture:0001',repeat('b',64),'Changed','buyer@example.test','https://example.test','Public contact',repeat('b',43),'other');
 assert b->>'error'='operation_payload_conflict';
 update public.crm_companies set can_view_prices=true where id=cid;
 update public.crm_contacts set suppressed=true where company_id=cid;
 update public.crm_access_credentials set revoked_at=now() where company_id=cid;
 select to_jsonb(c) into before_company from public.crm_companies c where id=cid;
 b=public.crm_register_collected_company('fixture:0002',repeat('c',64),'Other name','buyer@example.test','https://example.test','Public contact',repeat('c',43),'other');
 assert b->>'status'='matched_existing'; assert (b->>'requiresReview')::boolean; assert (b->>'suppressed')::boolean; assert b->>'credentialId' is null;
 assert before_company=(select to_jsonb(c) from public.crm_companies c where id=cid),'existing company changed';
 assert (select count(*)=1 from public.crm_access_credentials where company_id=cid),'revoked code reissued';
 perform public.crm_save_company(null,'Duplicate','buyer@example.test',null,null,'fixture');
 b=public.crm_register_collected_company('fixture:0003',repeat('d',64),'Duplicate','buyer@example.test','https://example.test','Public contact',repeat('d',43),'other');
 assert b->>'error'='ambiguous_contact';
 assert not exists(select 1 from public.crm_collector_operations where operation_id='fixture:0003');
 select count(*) into n from public.crm_companies;
 begin
  perform public.crm_register_collected_company('fixture:0004',repeat('e',64),'Collision','other@example.test','https://example.test','Public contact',repeat('a',43),'other');
  raise exception 'expected collision';
 exception when unique_violation then null;
 end;
 assert (select count(*) from public.crm_companies)=n,'partial company survived rollback';
 assert not exists(select 1 from public.crm_collector_operations where operation_id='fixture:0004');
end $$;
rollback;
