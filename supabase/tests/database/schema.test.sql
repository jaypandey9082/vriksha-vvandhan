begin;
select no_plan();

select has_type('public', 'staff_role');
select has_type('public', 'submission_status');
select has_type('public', 'submission_source');
select has_type('public', 'media_status');
select has_type('public', 'certificate_status');
select has_type('public', 'email_delivery_status');
select has_type('public', 'email_delivery_kind');

select has_table('public', 'staff_profiles');
select has_table('public', 'campaign_settings');
select has_table('public', 'submissions');
select has_table('public', 'submission_contacts');
select has_table('public', 'submission_consents');
select has_table('public', 'submission_media');
select has_table('public', 'certificates');
select has_table('public', 'email_deliveries');
select has_table('public', 'audit_logs');

select has_pk('public', 'staff_profiles');
select has_pk('public', 'campaign_settings');
select has_pk('public', 'submissions');
select has_fk('public', 'submission_contacts');
select has_fk('public', 'submission_consents');
select has_fk('public', 'submission_media');
select has_sequence('public', 'guardian_number_seq');

select has_column('public', 'submissions', 'guardian_number');
select has_column('public', 'submissions', 'rejection_recommended_by');
select has_column('public', 'submissions', 'rejection_confirmed_by');
select has_column('public', 'submissions', 'trashed_at');
select hasnt_column('public', 'campaign_settings', 'current_count');
select is((select target_count from public.campaign_settings where id = 1), 983, 'singleton target is 983');

select has_index('public', 'submissions', 'submissions_guardian_number_unique');
select has_index('public', 'submissions', 'submissions_active_pending_review_idx');
select has_index('public', 'submissions', 'submissions_rejection_pending_admin_idx');
select has_index('public', 'submissions', 'submissions_active_published_idx');

select has_function('private', 'is_active_staff', array[]::text[]);
select has_function('private', 'current_staff_role', array[]::text[]);
select has_function('private', 'is_admin', array[]::text[]);
select has_function('private', 'is_reviewer_or_admin', array[]::text[]);
select has_function('private', 'current_published_count', array[]::text[]);
select function_returns('private', 'current_published_count', array[]::text[], 'bigint');

select ok(c.relrowsecurity, c.relname || ' has RLS enabled')
from pg_catalog.pg_class as c
join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'staff_profiles', 'campaign_settings', 'submissions', 'submission_contacts',
    'submission_consents', 'submission_media', 'certificates', 'email_deliveries', 'audit_logs'
  );

select is((select public from storage.buckets where id = 'submission-originals'), false, 'original bucket is private');
select is((select public from storage.buckets where id = 'published-images'), true, 'published images bucket is public');
select is((select public from storage.buckets where id = 'certificates'), false, 'certificate bucket is private');

select * from finish();
rollback;
