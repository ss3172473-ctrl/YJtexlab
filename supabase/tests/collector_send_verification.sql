begin;
set local role service_role;
do $$
declare r jsonb; cid uuid; snap jsonb; receipt jsonb; b jsonb; claim jsonb; other uuid;
begin
 r=public.crm_register_collected_company('verify:fixture:1',repeat('1',64),'Held Fixture','held@example.test','https://example.test','public',repeat('q',43),'cipher');
 cid=(r->>'companyId')::uuid;
 assert exists(select 1 from public.crm_collector_send_checks where company_id=cid and crm_collector_send_checks.receipt is null);
 assert exists(select 1 from public.crm_access_credentials where company_id=cid and revoked_at is null),'hold must not revoke code';
 assert public.crm_sender_snapshot(cid) is null,'unverified cannot be candidate';
 snap=public.crm_collector_verify_access(cid,'verify:fixture:1')->'snapshot';
 b=(snap-'encryptedCode'-'codeHash'-'canViewPrices')||jsonb_build_object('action','claim','operationId','verify:send:1','messageId','<held@example.test>','mimeSha256',repeat('a',64),'inboundCheckedAt',clock_timestamp());
 assert public.crm_sender_transition(b)->>'error'='ineligible_or_stale','cannot bypass hold through claim';
 assert public.crm_collector_verify_access(cid,'wrong:operation',snap)->>'error'='not_held_registration';
 -- An edit between public resolver and CAS must reject.
 update public.crm_contacts set email='changed@example.test' where company_id=cid;
 assert public.crm_collector_verify_access(cid,'verify:fixture:1',snap)->>'error'='stale_access_snapshot';
 assert public.crm_sender_snapshot(cid) is null;
 update public.crm_contacts set email='held@example.test' where company_id=cid;
 receipt=public.crm_collector_verify_access(cid,'verify:fixture:1',snap);
 assert (receipt->>'sendHoldReleased')::boolean and not (receipt->>'browserVerified')::boolean;
 assert receipt=public.crm_collector_verify_access(cid,'verify:fixture:1',snap),'retry rewrites evidence';
 assert (select count(*)=1 from public.crm_audit_events where company_id=cid and action='collector_access_verified');
 assert public.crm_sender_snapshot(cid) is not null;
 claim=public.crm_sender_transition(b); assert claim->>'state'='claimed';
 update public.crm_access_credentials set code_hash=repeat('r',43) where company_id=cid;
 assert public.crm_sender_snapshot(cid) is null,'credential change invalidates proof';
 assert public.crm_sender_transition(jsonb_build_object('action','begin','operationId','verify:send:1','leaseToken',claim->>'leaseToken'))->>'error'='ineligible_or_stale';
 -- Manual/legacy companies have no new gate.
 insert into public.crm_companies(name) values('Existing Fixture') returning id into other;
 insert into public.crm_contacts(company_id,email,is_primary) values(other,'existing@example.test',true);
 insert into public.crm_access_credentials(company_id,code_hash,encrypted_code) values(other,repeat('s',43),'cipher');
 assert public.crm_sender_snapshot(other) is not null;
 assert not has_table_privilege('anon','public.crm_collector_send_checks','SELECT');
 assert not has_function_privilege('authenticated','public.crm_collector_verify_access(uuid,text,jsonb)','EXECUTE');
end $$;
rollback;
