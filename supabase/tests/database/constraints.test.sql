begin;
select no_plan();

select throws_ok(
  $$insert into public.submissions (display_name) values ('   ')$$,
  '23514', null, 'blank display name is rejected'
);
select throws_ok(
  $$insert into public.submissions (display_name) values (repeat('x', 101))$$,
  '23514', null, 'overlong display name is rejected'
);

insert into public.submissions (id) values ('10000000-0000-4000-8000-000000000001');
select throws_ok(
  $$insert into public.submission_contacts (submission_id, email) values ('10000000-0000-4000-8000-000000000001', '   ')$$,
  '23514', null, 'blank email is rejected'
);
select throws_ok(
  $$insert into public.submissions (guardian_number) values (0)$$,
  '23514', null, 'non-positive Guardian number is rejected'
);
select throws_ok(
  $$insert into public.submissions (is_test, counts_toward_goal) values (true, true)$$,
  '23514', null, 'test records cannot count toward goal'
);

insert into public.submissions (id, guardian_number)
values ('10000000-0000-4000-8000-000000000002', 42);
select throws_ok(
  $$insert into public.submissions (guardian_number) values (42)$$,
  '23505', null, 'Guardian numbers are unique'
);

select throws_ok(
  $$insert into public.submissions (status, display_name, submitted_at) values ('published', 'Name', now())$$,
  '23514', null, 'published requires approval and Guardian fields'
);
select throws_ok(
  $$insert into public.submissions (status, display_name, submitted_at, rejection_recommended_at) values ('rejection_pending_admin', 'Name', now(), now())$$,
  '23514', null, 'rejection recommendation requires comment and actor'
);
select throws_ok(
  $$insert into public.submissions (status, display_name, submitted_at, rejection_comment, rejected_at) values ('rejected', 'Name', now(), 'Reason', now())$$,
  '23514', null, 'final rejection requires confirmation actor and time'
);

select throws_ok(
  $$insert into public.submission_media (submission_id, original_path, original_extension, original_width) values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001/original.jpg', 'jpg', 0)$$,
  '23514', null, 'invalid media dimensions are rejected'
);
select throws_ok(
  $$insert into public.submission_media (submission_id, original_path, original_extension, focal_x) values ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001/original.jpg', 'jpg', 1.1)$$,
  '23514', null, 'invalid focal coordinates are rejected'
);
select throws_ok(
  $$insert into public.certificates (submission_id, attempt_count) values ('10000000-0000-4000-8000-000000000001', -1)$$,
  '23514', null, 'negative certificate attempts are rejected'
);

insert into public.email_deliveries (submission_id, kind, idempotency_key)
values ('10000000-0000-4000-8000-000000000001', 'submission_received', 'received-1');
select throws_ok(
  $$insert into public.email_deliveries (submission_id, kind, idempotency_key) values ('10000000-0000-4000-8000-000000000001', 'submission_received', 'received-2')$$,
  '23505', null, 'one delivery kind exists per submission'
);

insert into public.submission_consents (
  submission_id, consent_version, publication_consent, terms_accepted, accepted_at
) values ('10000000-0000-4000-8000-000000000001', 'v1', true, true, now());
update public.submissions
set status = 'pending_review', display_name = 'Ready', submitted_at = now()
where id = '10000000-0000-4000-8000-000000000001';
set constraints all immediate;
select throws_ok(
  $$delete from public.submission_consents where submission_id = '10000000-0000-4000-8000-000000000001'$$,
  'P0001', null, 'completed submission cannot lose consent'
);

select * from finish();
rollback;
