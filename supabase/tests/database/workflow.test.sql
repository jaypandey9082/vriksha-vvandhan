begin;
select no_plan();

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, created_at, updated_at
) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'reviewer@example.test', '', now(), now()),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@example.test', '', now(), now());
insert into public.staff_profiles (id, display_name, role) values
  ('20000000-0000-4000-8000-000000000001', 'Reviewer', 'reviewer'),
  ('20000000-0000-4000-8000-000000000002', 'Admin', 'admin');

insert into public.submissions (id) values ('20000000-0000-4000-8000-000000000010');
select is((select status::text from public.submissions where id = '20000000-0000-4000-8000-000000000010'), 'draft', 'draft may be incomplete');

insert into public.submission_consents (
  submission_id, consent_version, publication_consent, terms_accepted, accepted_at
) values ('20000000-0000-4000-8000-000000000010', 'v1', true, true, now());
update public.submissions
set status = 'pending_review', display_name = 'Participant', submitted_at = now()
where id = '20000000-0000-4000-8000-000000000010';
select lives_ok('set constraints all immediate', 'Pending Review is valid with submitted data and consent');

update public.submissions
set status = 'rejection_pending_admin',
    rejection_comment = 'Please submit a clear photograph of the tree.',
    rejection_recommended_at = now(),
    rejection_recommended_by = '20000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000010';
select lives_ok('set constraints all immediate', 'Reviewer recommendation carries participant-facing comment and actor');
select is(private.current_published_count(), 0::bigint, 'Rejection Awaiting Admin does not count');

update public.submissions
set status = 'published',
    approved_at = now(),
    approved_by = '20000000-0000-4000-8000-000000000002',
    published_at = now(),
    guardian_number = 1
where id = '20000000-0000-4000-8000-000000000010';
select lives_ok('set constraints all immediate', 'Admin may approve while preserving recommendation history');

insert into public.submissions (id) values ('20000000-0000-4000-8000-000000000011');
insert into public.submission_consents (
  submission_id, consent_version, publication_consent, terms_accepted, accepted_at
) values ('20000000-0000-4000-8000-000000000011', 'v1', true, true, now());
update public.submissions set
  status = 'rejected', display_name = 'Direct reject', submitted_at = now(),
  rejection_comment = 'The image does not show a tree.',
  rejection_confirmed_at = now(),
  rejection_confirmed_by = '20000000-0000-4000-8000-000000000002',
  rejected_at = now()
where id = '20000000-0000-4000-8000-000000000011';
select lives_ok('set constraints all immediate', 'Admin direct rejection does not require recommendation fields');

select ok(
  not exists (
    select 1 from pg_catalog.pg_enum e
    join pg_catalog.pg_type t on t.oid = e.enumtypid
    where t.typname = 'submission_status' and e.enumlabel = 'returned_for_review'
  ),
  'No Return to Reviewer status exists'
);

select * from finish();
rollback;
