-- Disposable fixture DB only, after all CRM migrations.
begin;
set local role service_role;
do $$
declare cid uuid; s jsonb; b jsonb; r jsonb; token text;
begin
 r=public.crm_register_collected_company('sender:fixture:1',repeat('1',64),'Sender Fixture','send@example.test','https://example.test','public contact',repeat('x',43),'cipher');
 cid=(r->>'companyId')::uuid;
 perform public.crm_collector_verify_access(cid,r->>'operationId',public.crm_collector_access_snapshot(cid));
 s=public.crm_sender_snapshot(cid);
 assert s is not null;
 b=(s-'encryptedCode'-'codeHash')||jsonb_build_object('action','claim','operationId','sender:operation:1','messageId','<fixture@yjtexlab.com>','mimeSha256',repeat('a',64),'inboundCheckedAt',clock_timestamp());
 r=public.crm_sender_transition(b); assert r->>'state'='claimed'; token=r->>'leaseToken';
 assert public.crm_sender_transition(b)=r,'claim retry must preserve receipt';
 assert public.crm_sender_transition(b||'{"mimeSha256":"different"}') ->>'error'='operation_payload_conflict';
 assert public.crm_sender_candidates()='[]'::jsonb,'claimed cannot be selected';
 assert public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','sent','providerMessageId','gmail123'))->>'error'='not_started';
 update public.crm_contacts set suppressed=true where company_id=cid;
 assert public.crm_sender_transition(jsonb_build_object('action','begin','operationId','sender:operation:1','leaseToken',token))->>'error'='ineligible_or_stale';
 update public.crm_contacts set suppressed=false where company_id=cid;
 r=public.crm_sender_transition(jsonb_build_object('action','begin','operationId','sender:operation:1','leaseToken',token)); assert r->>'state'='sending';
 assert public.crm_sender_transition(jsonb_build_object('action','begin','operationId','sender:operation:1','leaseToken',token))->>'error'='already_started_no_retry';
 r=public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','uncertain')); assert r->>'state'='uncertain';
 assert public.crm_sender_candidates()='[]'::jsonb;
 r=public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','sent','providerMessageId','gmail123')); assert r->>'state'='sent';
 assert public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','sent','providerMessageId','gmail123'))=r;
 assert public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','sent','providerMessageId','different'))->>'error'='receipt_conflict';
 assert public.crm_sender_transition(jsonb_build_object('action','receipt','operationId','sender:operation:1','leaseToken',token,'outcome','claimed'))->>'error'='invalid_receipt';
 -- Historical sends must block even if a status was reset to 미접촉.
 update public.crm_companies set legacy_metadata='{"접촉 상태":"미접촉","접촉 기록":"sent before migration"}' where id=cid;
 assert public.crm_sender_snapshot(cid) is null;
 update public.crm_companies set legacy_metadata='{"접촉 상태":"자동응답"}' where id=cid;
 assert public.crm_sender_snapshot(cid) is null;
 update public.crm_companies set legacy_metadata='{}',source_key='fixture:import' where id=cid;
 assert public.crm_sender_snapshot(cid) is null,'blank imported status must block';
 update public.crm_companies set source_key=null where id=cid;
 assert public.crm_sender_snapshot(cid) is not null;
 update public.crm_access_credentials set revoked_at=now() where company_id=cid;
 assert public.crm_sender_snapshot(cid) is null;
 -- New fixture covers stale versions, freshness, expired leases, and duplicate claims.
 r=public.crm_register_collected_company('sender:fixture:2',repeat('2',64),'Second Fixture','second@example.test','https://example.test','public contact',repeat('y',43),'cipher2');
 cid=(r->>'companyId')::uuid;
 perform public.crm_collector_verify_access(cid,r->>'operationId',public.crm_collector_access_snapshot(cid));
 s=public.crm_sender_snapshot(cid);
 b=(s-'encryptedCode'-'codeHash')||jsonb_build_object('action','claim','operationId','sender:operation:2','messageId','<second@yjtexlab.com>','mimeSha256',repeat('b',64),'inboundCheckedAt',clock_timestamp());
 assert public.crm_sender_transition(b||jsonb_build_object('companyUpdatedAt',now()-interval '1 day'))->>'error'='ineligible_or_stale';
 assert public.crm_sender_transition(b||jsonb_build_object('inboundCheckedAt',now()-interval '1 day'))->>'error'='inbound_check_expired';
 r=public.crm_sender_transition(b); token=r->>'leaseToken';
 assert public.crm_sender_transition(b||jsonb_build_object('operationId','sender:duplicate:2','messageId','<duplicate@yjtexlab.com>'))->>'error'='prior_operation';
 update public.crm_sender_operations set lease_expires_at=now()-interval '1 second' where operation_id='sender:operation:2';
 assert public.crm_sender_transition(jsonb_build_object('action','begin','operationId','sender:operation:2','leaseToken',token))->>'error'='lease_expired';
 assert public.crm_sender_candidates()='[]'::jsonb;
 assert not has_table_privilege('anon','public.crm_sender_operations','SELECT');
 assert not has_function_privilege('authenticated','public.crm_sender_transition(jsonb)','EXECUTE');
end $$;
rollback;
