begin;
select no_plan();

select has_column('public', 'submission_media', 'review_thumbnail_path', 'private review-thumbnail path exists');
select has_column('public', 'submission_media', 'review_thumbnail_bytes', 'private review-thumbnail byte size exists');
select has_column('public', 'submission_media', 'review_thumbnail_generated_at', 'private review-thumbnail generation time exists');
select has_function(
  'public',
  'finalize_public_submission_with_review_thumbnail',
  array['uuid','text','text','bigint','integer','integer','text','text','integer','integer','bigint','timestamp with time zone'],
  'trusted thumbnail-aware finalisation exists'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.finalize_public_submission_with_review_thumbnail(uuid,text,text,bigint,integer,integer,text,text,integer,integer,bigint,timestamptz)',
    'execute'
  ),
  'service role can run trusted thumbnail-aware finalisation'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.finalize_public_submission_with_review_thumbnail(uuid,text,text,bigint,integer,integer,text,text,integer,integer,bigint,timestamptz)',
    'execute'
  ),
  'ordinary authenticated callers cannot run trusted thumbnail-aware finalisation'
);

insert into public.submissions (
  id, status, display_name, draft_expires_at, public_request_token_hash
) values (
  '53000000-0000-4000-8000-000000000001', 'draft', 'Thumbnail Test',
  now() + interval '1 hour', repeat('a', 64)
);
insert into public.submission_consents (
  submission_id, consent_version, publication_consent, terms_accepted, accepted_at
) values (
  '53000000-0000-4000-8000-000000000001', 'review-thumbnail-test', true, true, now()
);
insert into public.submission_media (
  submission_id, status, original_path, original_extension
) values (
  '53000000-0000-4000-8000-000000000001', 'reserved',
  '53000000-0000-4000-8000-000000000001/original.webp', 'webp'
);

select throws_ok(
  $$select * from public.finalize_public_submission_with_review_thumbnail(
    '53000000-0000-4000-8000-000000000001', repeat('a',64),
    'image/webp', 500000, 1200, 1600, repeat('b',64),
    '53000000-0000-4000-8000-000000000001/wrong.webp', 240, 300, 32000, now()
  )$$,
  'P0001', 'media_not_ready', 'unexpected private thumbnail path is rejected'
);

select is(
  (
    select status::text
    from public.finalize_public_submission_with_review_thumbnail(
      '53000000-0000-4000-8000-000000000001', repeat('a',64),
      'image/webp', 500000, 1200, 1600, repeat('b',64),
      '53000000-0000-4000-8000-000000000001/review-thumb.webp',
      240, 300, 32000, now()
    )
  ),
  'pending_review',
  'valid private thumbnail metadata finalises the submission'
);
select is(
  (select review_thumbnail_path from public.submission_media where submission_id = '53000000-0000-4000-8000-000000000001'),
  '53000000-0000-4000-8000-000000000001/review-thumb.webp',
  'only the opaque private review-thumbnail path is stored'
);
select is(
  (select review_thumbnail_width::text || 'x' || review_thumbnail_height::text from public.submission_media where submission_id = '53000000-0000-4000-8000-000000000001'),
  '240x300',
  'review-thumbnail dimensions are constrained'
);
select throws_ok(
  $$update public.submission_media
       set review_thumbnail_bytes = 122881
     where submission_id = '53000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'review-thumbnail hard byte budget is enforced'
);
select is(
  (select count(*) from public.certificates where submission_id = '53000000-0000-4000-8000-000000000001'),
  0::bigint,
  'thumbnail finalisation does not generate a certificate'
);
select is(
  (select count(*) from public.email_deliveries where submission_id = '53000000-0000-4000-8000-000000000001' and status = 'sent'),
  0::bigint,
  'thumbnail finalisation sends no email'
);

select * from finish();
rollback;
