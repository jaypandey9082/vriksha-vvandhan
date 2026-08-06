begin;
select no_plan();

select has_column(
  'public', 'submissions', 'public_request_token_hash',
  'public request capability hash exists'
);
select has_column(
  'public', 'campaign_settings', 'draft_ttl_minutes',
  'Draft TTL setting exists'
);
select has_column(
  'public', 'campaign_settings', 'max_submissions_per_email_24h',
  'per-email limit setting exists'
);
select has_index(
  'public', 'submissions', 'submissions_public_request_token_hash_unique'::name,
  'request-token hash has a partial unique index'
);
select has_index(
  'public', 'submissions', 'submissions_trashed_by_idx'::name,
  'trashed_by foreign key has a covering index'
);
select has_index(
  'public', 'submission_contacts', 'submission_contacts_email_lower_idx'::name,
  'normalised email lookups have a functional index'
);
select has_function(
  'public', 'prepare_public_submission',
  array['text', 'text', 'text', 'boolean', 'boolean', 'text', 'text'],
  'prepare function exists'
);
select has_function(
  'public', 'finalize_public_submission',
  array['uuid', 'text', 'text', 'bigint', 'integer', 'integer', 'text'],
  'finalise function exists'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.prepare_public_submission(text,text,text,boolean,boolean,text,text)',
    'execute'
  ),
  'service_role can prepare a public submission'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.prepare_public_submission(text,text,text,boolean,boolean,text,text)',
    'execute'
  ),
  'anon cannot prepare through the database API directly'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.prepare_public_submission(text,text,text,boolean,boolean,text,text)',
    'execute'
  ),
  'authenticated cannot prepare through the database API directly'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.finalize_public_submission(uuid,text,text,bigint,integer,integer,text)',
    'execute'
  ),
  'service_role can finalise a public submission'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.finalize_public_submission(uuid,text,text,bigint,integer,integer,text)',
    'execute'
  ),
  'anon cannot finalise through the database API directly'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.finalize_public_submission(uuid,text,text,bigint,integer,integer,text)',
    'execute'
  ),
  'authenticated cannot finalise through the database API directly'
);

select throws_ok(
  $$select * from public.prepare_public_submission(
      repeat('a', 64), 'Participant', 'person@example.test', true, true,
      'staging-2026-08-v1', 'webp'
    )$$,
  'P0001', 'submissions_closed', 'closed campaign rejects Draft creation'
);
select throws_ok(
  $$select * from public.prepare_public_submission(
      'not-a-hash', 'Participant', 'person@example.test', true, true,
      'staging-2026-08-v1', 'webp'
    )$$,
  'P0001', 'invalid_draft', 'invalid capability hash is rejected'
);
select throws_ok(
  $$select * from public.prepare_public_submission(
      repeat('a', 64), 'Participant', 'person@example.test', false, true,
      'staging-2026-08-v1', 'webp'
    )$$,
  'P0001', 'consent_required', 'publication consent is required'
);
select throws_ok(
  $$select * from public.prepare_public_submission(
      repeat('a', 64), 'Participant', 'person@example.test', true, false,
      'staging-2026-08-v1', 'webp'
    )$$,
  'P0001', 'consent_required', 'terms acceptance is required'
);

update public.campaign_settings
set submissions_open = true,
    draft_ttl_minutes = 60,
    max_submissions_per_email_24h = 1
where id = 1;

create temporary table prepared_submission as
select * from public.prepare_public_submission(
  repeat('a', 64),
  '  Asha   Rao  ',
  '  ASHA@EXAMPLE.TEST ',
  true,
  true,
  'staging-2026-08-v1',
  'webp'
);

select is(
  (select count(*) from public.submissions where public_request_token_hash = repeat('a', 64)),
  1::bigint,
  'valid request creates one Draft'
);
select is(
  (select display_name from public.submissions where public_request_token_hash = repeat('a', 64)),
  'Asha Rao',
  'display name whitespace is normalised'
);
select is(
  (select email from public.submission_contacts where submission_id = (select submission_id from prepared_submission)),
  'asha@example.test',
  'participant email is trimmed and lowercased'
);
select ok(
  (select draft_expires_at > now() from prepared_submission),
  'Draft expiration is set from campaign settings'
);
select is(
  (select original_path from prepared_submission),
  (select submission_id::text || '/original.webp' from prepared_submission),
  'private object path is generated from the submission ID'
);

select is(
  (
    select submission_id
    from public.prepare_public_submission(
      repeat('a', 64), 'Asha Rao', 'asha@example.test', true, true,
      'staging-2026-08-v1', 'webp'
    )
  ),
  (select submission_id from prepared_submission),
  'same capability token reuses the Draft idempotently'
);
select is(
  (select count(*) from public.submission_contacts where submission_id = (select submission_id from prepared_submission)),
  1::bigint,
  'idempotent retry does not duplicate contact rows'
);
select is(
  (select count(*) from public.submission_consents where submission_id = (select submission_id from prepared_submission)),
  1::bigint,
  'idempotent retry does not duplicate consent rows'
);
select is(
  (select count(*) from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  1::bigint,
  'idempotent retry does not duplicate media rows'
);
select throws_ok(
  $$select * from public.prepare_public_submission(
      repeat('b', 64), 'Another', 'asha@example.test', true, true,
      'staging-2026-08-v1', 'webp'
    )$$,
  'P0001', 'submission_limit_reached', 'rolling per-email submission limit is enforced'
);

select throws_ok(
  $$select * from public.finalize_public_submission(
      '90000000-0000-4000-8000-000000000099', repeat('a', 64),
      'image/webp', 1024, 800, 600, repeat('c', 64)
    )$$,
  'P0001', 'invalid_draft', 'missing Draft cannot be finalised'
);
select throws_ok(
  format(
    $$select * from public.finalize_public_submission(
        %L, repeat('d', 64), 'image/webp', 1024, 800, 600, repeat('c', 64)
      )$$,
    (select submission_id from prepared_submission)
  ),
  'P0001', 'invalid_draft', 'wrong capability token cannot finalise a Draft'
);

update public.submissions
set draft_expires_at = now() - interval '1 minute'
where id = (select submission_id from prepared_submission);
select throws_ok(
  format(
    $$select * from public.finalize_public_submission(
        %L, repeat('a', 64), 'image/webp', 1024, 800, 600, repeat('c', 64)
      )$$,
    (select submission_id from prepared_submission)
  ),
  'P0001', 'draft_expired', 'expired Draft cannot be finalised'
);
update public.submissions
set draft_expires_at = now() + interval '1 hour'
where id = (select submission_id from prepared_submission);

select is(
  (
    select status::text
    from public.finalize_public_submission(
      (select submission_id from prepared_submission),
      repeat('a', 64),
      'image/webp',
      1048576,
      1600,
      1200,
      repeat('c', 64)
    )
  ),
  'pending_review',
  'valid finalisation becomes Pending Review'
);
select is(
  (select status::text from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  'uploaded',
  'finalisation marks private media Uploaded'
);
select is(
  (select original_bytes from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  1048576::bigint,
  'verified media byte size is stored'
);
select is(
  (select original_width from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  1600,
  'verified media width is stored'
);
select is(
  (select original_height from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  1200,
  'verified media height is stored'
);
select is(
  (select original_checksum_sha256 from public.submission_media where submission_id = (select submission_id from prepared_submission)),
  repeat('c', 64),
  'server SHA-256 is stored'
);
select is(
  (select count(*) from public.email_deliveries where submission_id = (select submission_id from prepared_submission) and kind = 'submission_received'),
  1::bigint,
  'future submission-received delivery is prepared once'
);
select is(
  (
    select status::text
    from public.finalize_public_submission(
      (select submission_id from prepared_submission),
      repeat('a', 64),
      'image/webp',
      1048576,
      1600,
      1200,
      repeat('c', 64)
    )
  ),
  'pending_review',
  'repeated finalisation is idempotent'
);
select is(
  (select count(*) from public.email_deliveries where submission_id = (select submission_id from prepared_submission) and kind = 'submission_received'),
  1::bigint,
  'repeated finalisation does not duplicate delivery records'
);
select is(
  (select guardian_number from public.submissions where id = (select submission_id from prepared_submission)),
  null::bigint,
  'Section 3 does not assign a Guardian number'
);
select is(
  (select published_at from public.submissions where id = (select submission_id from prepared_submission)),
  null::timestamptz,
  'Section 3 does not publish the submission'
);
select is(
  (select count(*) from public.certificates where submission_id = (select submission_id from prepared_submission)),
  0::bigint,
  'Section 3 does not create a certificate'
);
select is(private.current_published_count(), 0::bigint, 'Pending Review does not change the campaign count');

select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'staff_profiles'
      and cmd = 'SELECT'
  ),
  1::bigint,
  'staff profiles have one permissive SELECT policy'
);
select ok(
  (
    select qual like '%( SELECT auth.uid() AS uid)%'
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename = 'staff_profiles'
      and policyname = 'staff_profiles_read_active_own_or_admin'
  ),
  'staff-profile policy initialises auth.uid once'
);

select * from finish();
rollback;
