-- Isolated database integration test after inbox + approval migrations.
-- Every fixture is rolled back; no Gmail or Slack request is made.
begin;
set local role service_role;
do $$
declare cid uuid; tid uuid; mid uuid; version timestamptz; draft jsonb; proposal jsonb; action_id uuid;
 response jsonb; execution uuid;
begin
 cid=public.crm_save_company(null,'Approval fixture','approval-fixture@example.test',null,null,'fixture');
 select id into tid from public.crm_contacts where company_id=cid;
 select updated_at into version from public.crm_companies where id=cid;
 draft=jsonb_build_object('operationId','approval:test:price','requestDigest',repeat('a',64),'kind','price','companyId',cid,'expectedUpdatedAt',version,'canViewPrices',true);
 proposal=public.crm_approval_operation('create',null,draft);action_id=(proposal->>'id')::uuid;
 assert public.crm_approval_operation('create',null,draft)->>'id'=action_id::text;
 assert public.crm_approval_operation('create',null,draft||jsonb_build_object('requestDigest',repeat('b',64)))->>'error'='operation_payload_conflict';
 assert public.crm_approval_operation('execute_price',action_id,'{}')->>'error'='item_not_approved';
 perform public.crm_approval_operation('bind',action_id,jsonb_build_object('payloadDigest',proposal->>'payloadDigest','messageTs','1795669226.123456'));
 assert public.crm_decide_approval(action_id,proposal->>'payloadDigest','approve','1795669226.123456','other')->>'error'='invalid_approver';
 assert public.crm_decide_approval(action_id,repeat('b',64),'approve','1795669226.123456','U0CAK75RSAC')->>'error'='card_binding_mismatch';
 assert public.crm_decide_approval(action_id,proposal->>'payloadDigest','approve','1795669226.000000','U0CAK75RSAC')->>'error'='card_binding_mismatch';
 assert public.crm_decide_approval(action_id,proposal->>'payloadDigest','approve','1795669226.123456','U0CAK75RSAC')->>'state'='approved';
 response=public.crm_approval_operation('execute_price',action_id,'{}');assert response->>'state'='succeeded';
 assert public.crm_approval_operation('execute_price',action_id,'{}')=response;
 assert (select can_view_prices from public.crm_companies where id=cid);
 insert into public.crm_inbound_messages(mailbox,provider_message_id,provider_thread_id,rfc_message_id,from_email,to_emails,received_at,subject,text_body,classification,classification_evidence,receipt_digest,company_id,contact_id,match_status)
 values('hello@yjtexlab.com','approval-msg-fixture','approval-thread-fixture','<fixture@example.test>','approval-fixture@example.test',array['hello@yjtexlab.com'],now(),'Question','Question','reply','fixture',repeat('c',64),cid,tid,'matched') returning id into mid;
 select updated_at into version from public.crm_companies where id=cid;
 draft=jsonb_build_object('operationId','approval:test:reply','requestDigest',repeat('d',64),'kind','reply','companyId',cid,'contactId',tid,'expectedUpdatedAt',version,'inboundMessageId',mid,'inboxDigest',repeat('c',64),'subject','Re: Question','textBody','Approved reply');
 proposal=public.crm_approval_operation('create',null,draft);action_id=(proposal->>'id')::uuid;
 perform public.crm_approval_operation('bind',action_id,jsonb_build_object('payloadDigest',proposal->>'payloadDigest','messageTs','1795669226.123457'));
 perform public.crm_decide_approval(action_id,proposal->>'payloadDigest','approve','1795669226.123457','U0CAK75RSAC');
 response=public.crm_approval_operation('claim',action_id,'{}');assert response->>'state'='executing';execution=(response->>'executionId')::uuid;
 assert response->'payload'->>'to'='approval-fixture@example.test';
 assert public.crm_approval_operation('claim',action_id,'{}')->>'error'='item_not_approved';
 assert public.crm_approval_operation('complete',action_id,jsonb_build_object('executionId',gen_random_uuid(),'outcome','succeeded','providerMessageId','msg'))->>'error'='execution_binding_mismatch';
 response=public.crm_approval_operation('complete',action_id,jsonb_build_object('executionId',execution,'outcome','uncertain','providerMessageId',null));assert response->>'state'='uncertain';
 assert public.crm_approval_operation('claim',action_id,'{}')->>'error'='item_not_approved';
 assert public.crm_approval_operation('complete',action_id,jsonb_build_object('executionId',execution,'outcome','succeeded','providerMessageId','msg'))->>'error'='terminal_execution';
end $$;
rollback;
