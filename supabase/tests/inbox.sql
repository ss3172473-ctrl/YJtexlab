begin;
set local role service_role;
do $$
declare r jsonb; sync jsonb; token text; revision text; m jsonb; b jsonb; cid uuid; tid uuid; aid uuid; other uuid;
begin
 assert not has_table_privilege('anon','public.crm_inbound_messages','SELECT');
 assert not has_function_privilege('authenticated','public.crm_inbox_transition(jsonb)','EXECUTE');
 r=public.crm_register_collected_company('inbox:fixture:1',repeat('4',64),'Inbox Fixture','buyer@example.test','https://example.test','public contact',repeat('x',43),'cipher');
 cid=(r->>'companyId')::uuid; aid=(r->>'credentialId')::uuid;
 select id into tid from public.crm_contacts where company_id=cid;
 insert into public.crm_sender_operations(operation_id,company_id,contact_id,email,credential_id,snapshot,message_id,mime_sha256,inbound_checked_at,state,provider_message_id,provider_thread_id)
 values('inbox:outreach:1',cid,tid,'buyer@example.test',aid,'{}','<sent@yjtexlab.com>',repeat('a',64),now(),'sent','sent001','thread001');
 assert (public.crm_inbox_threads()->>'complete')::boolean;
 assert public.crm_inbox_threads()->'threads'->0->>'recipientEmail'='buyer@example.test';
 revision=public.crm_inbox_threads()->>'inventoryRevision';
 assert revision ~ '^[a-f0-9]{32}$';
 assert public.crm_inbox_threads()->'threads'->0->>'rfcMessageIdSource'='submitted';
 assert public.crm_inbox_state()->>'historyId' is null;
 sync=public.crm_inbox_transition('{"action":"acquire","runId":"fixture:run1"}');token=sync->>'leaseToken';
 assert token is not null;
 assert public.crm_inbox_transition('{"action":"acquire","runId":"fixture:other"}')->>'error'='inbox_lease_busy';
 assert public.crm_inbox_transition('{"action":"acquire","runId":"fixture:run1"}')->>'leaseToken'=token;
 m=jsonb_build_object('providerMessageId','reply001','providerThreadId','thread001','rfcMessageId','<reply@example.test>','fromEmail','buyer@example.test','toEmails',jsonb_build_array('hello@yjtexlab.com'),'inReplyTo','<sent@yjtexlab.com>','references',jsonb_build_array('<sent@yjtexlab.com>'),'receivedAt',clock_timestamp(),'subject','Re: Fabrics','textBody','Please send details','classification','reply','classificationEvidence','non automatic inbound','digest',repeat('1',64));
 b=jsonb_build_object('action','ingest','leaseToken',token,'messages',jsonb_build_array(m));
 r=public.crm_inbox_transition(b);assert (r->>'inserted')::integer=1;assert r->'messages'->0->>'matchStatus'='matched';assert r->'messages'->0->>'companyId'=cid::text;
 r=public.crm_inbox_transition(b);assert (r->>'duplicates')::integer=1;
 assert (select count(*)=1 from public.crm_inbound_messages);
 -- A later conflicting immutable receipt rolls back the entire requested batch.
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"new001"}',m||jsonb_build_object('digest',repeat('2',64)))));
 assert r->>'error'='inbox_receipt_conflict';assert (select count(*)=1 from public.crm_inbound_messages);
 -- A rewritten actual provider RFC ID is not falsely treated as a submitted
 -- ID. Capture for review, but do not authorize a reply/price operation.
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"rewritten001","providerThreadId":"rewrittenNewThread","inReplyTo":"<rewritten@mail.gmail.com>","references":["<rewritten@mail.gmail.com>"]}'||jsonb_build_object('digest',repeat('9',64)))));
 assert r->'messages'->0->>'matchStatus'='unmatched';
 -- Same email alone must not attach unrelated mail.
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"unknown001","providerThreadId":"unknown","inReplyTo":null,"references":[]}'||jsonb_build_object('digest',repeat('3',64)))));
 assert r->'messages'->0->>'matchStatus'='unmatched';
 -- Known reference works for a reply whose client starts a new Gmail thread.
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"newthread001","providerThreadId":"newthread"}'||jsonb_build_object('digest',repeat('4',64)))));
 assert r->'messages'->0->>'matchStatus'='matched';
 insert into public.crm_companies(name) values('Duplicated contact') returning id into other;
 insert into public.crm_contacts(company_id,email,is_primary) values(other,'buyer@example.test',true);
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"ambiguous001"}'||jsonb_build_object('digest',repeat('5',64)))));
 assert r->'messages'->0->>'matchStatus'='ambiguous';
 -- Classification records do not implicitly mutate suppression/pricing.
 r=public.crm_inbox_transition(b||jsonb_build_object('messages',jsonb_build_array(m||'{"providerMessageId":"optout001","classification":"optout"}'||jsonb_build_object('digest',repeat('6',64)))));
 assert not (select suppressed from public.crm_contacts where id=tid);
 assert not (select can_view_prices from public.crm_companies where id=cid);
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',repeat('0',32),'expectedHistoryId',null,'historyId','90071992547409931'));
 assert r->>'error'='inbox_inventory_changed';
 update public.crm_sender_operations set state='uncertain' where operation_id='inbox:outreach:1';
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',revision,'expectedHistoryId',null,'historyId','90071992547409931'));
 assert r->>'error'='inbox_inventory_changed';
 revision=public.crm_inbox_threads()->>'inventoryRevision';
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',revision,'expectedHistoryId',null,'historyId','90071992547409931'));
 assert r->>'error'='inbox_outreach_unresolved';
 update public.crm_sender_operations set state='sent' where operation_id='inbox:outreach:1';
 revision=public.crm_inbox_threads()->>'inventoryRevision';
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',revision,'expectedHistoryId','123','historyId','90071992547409931'));
 assert r->>'error'='inbox_cursor_conflict';assert public.crm_inbox_state()->>'historyId' is null;
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',revision,'expectedHistoryId',null,'historyId','90071992547409931'));
 assert r->>'historyId'='90071992547409931';assert r->>'leaseToken' is null;
 assert public.crm_inbox_transition(b)->>'error'='inbox_lease_expired_or_not_owned';
 sync=public.crm_inbox_transition('{"action":"acquire","runId":"fixture:run2"}');token=sync->>'leaseToken';
 r=public.crm_inbox_transition(jsonb_build_object('action','checkpoint','leaseToken',token,'expectedInventoryRevision',revision,'expectedHistoryId','90071992547409931','historyId','90071992547409930'));
 assert r->>'error'='inbox_cursor_regression';
 r=public.crm_inbox_transition(jsonb_build_object('action','renew','leaseToken',token));assert r->>'leaseToken'=token;
 update public.crm_mail_sync set lease_expires_at=now()-interval '1 second';
 r=public.crm_inbox_transition(jsonb_build_object('action','renew','leaseToken',token));assert r->>'error'='inbox_lease_expired_or_not_owned';
 sync=public.crm_inbox_transition('{"action":"acquire","runId":"fixture:run3"}');assert sync->>'leaseToken'<>token;token=sync->>'leaseToken';
 r=public.crm_inbox_transition(jsonb_build_object('action','release','leaseToken',token));assert r->>'leaseToken' is null;assert r->>'historyId'='90071992547409931';
end $$;
rollback;
