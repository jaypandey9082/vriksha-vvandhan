begin;
select no_plan();

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, created_at, updated_at
) values ('30000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin-count@example.test', '', now(), now());
insert into public.staff_profiles (id, display_name, role)
values ('30000000-0000-4000-8000-000000000001', 'Admin', 'admin');

create temporary table count_test_ids(id uuid primary key, expected text);

insert into public.submissions (id) values ('30000000-0000-4000-8000-000000000010');
select is(private.current_published_count(), 0::bigint, 'Draft does not count');

insert into public.submission_consents (
  submission_id, consent_version, publication_consent, terms_accepted, accepted_at
) values ('30000000-0000-4000-8000-000000000010', 'v1', true, true, now());
update public.submissions set status = 'pending_review', display_name = 'Counted', submitted_at = now()
where id = '30000000-0000-4000-8000-000000000010';
set constraints all immediate;
select is(private.current_published_count(), 0::bigint, 'Pending Review does not count');

insert into public.submission_media (
  submission_id, status, original_path, original_extension, original_mime_type,
  original_bytes, original_width, original_height, original_checksum_sha256, uploaded_at,
  published_bucket, published_card_path, published_full_path, published_version,
  published_card_width, published_card_height, published_card_bytes,
  published_full_width, published_full_height, published_full_bytes, published_at, alt_text
) values (
  '30000000-0000-4000-8000-000000000010', 'published',
  '30000000-0000-4000-8000-000000000010/original.webp', 'webp', 'image/webp',
  1024, 800, 800, repeat('a', 64), now(), 'published-images',
  'card/100-v1.webp', 'full/100-v1.webp', 'v1', 640, 800, 800,
  800, 800, 900, now(), 'Counted tree'
);

update public.submissions set
  status = 'published', approved_at = now(), approved_by = '30000000-0000-4000-8000-000000000001',
  published_at = now(), guardian_number = 100
where id = '30000000-0000-4000-8000-000000000010';
select is(private.current_published_count(), 1::bigint, 'Published production submission counts');

insert into public.submissions (id, counts_toward_goal)
values ('30000000-0000-4000-8000-000000000011', false);
insert into public.submission_consents values (
  '30000000-0000-4000-8000-000000000011', 'v1', true, true, now(), now(), now()
);
update public.submissions set
  status = 'published', display_name = 'Excluded', submitted_at = now(),
  approved_at = now(), approved_by = '30000000-0000-4000-8000-000000000001',
  published_at = now(), guardian_number = 101
where id = '30000000-0000-4000-8000-000000000011';
select is(private.current_published_count(), 1::bigint, 'Excluded published record does not count');

update public.submissions set trashed_at = now(), trashed_by = '30000000-0000-4000-8000-000000000001'
where id = '30000000-0000-4000-8000-000000000010';
select is(private.current_published_count(), 0::bigint, 'Trashed Published submission does not count');
select is(private.current_published_count(), private.current_published_count(), 'Repeated reads are stable and do not mutate');

select * from finish();
rollback;
