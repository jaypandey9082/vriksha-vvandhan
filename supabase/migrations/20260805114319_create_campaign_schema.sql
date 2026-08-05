create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.staff_role as enum ('admin', 'reviewer');
create type public.submission_status as enum (
  'draft',
  'pending_review',
  'rejection_pending_admin',
  'published',
  'rejected'
);
create type public.submission_source as enum ('website', 'internal_test');
create type public.media_status as enum ('reserved', 'uploaded', 'published', 'removed');
create type public.certificate_status as enum ('not_started', 'queued', 'generated', 'failed');
create type public.email_delivery_status as enum ('not_started', 'queued', 'sent', 'failed');
create type public.email_delivery_kind as enum (
  'submission_received',
  'approval_certificate',
  'rejection'
);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create table public.staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.staff_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profiles_display_name_check
    check (length(btrim(display_name)) between 1 and 120)
);

create table public.campaign_settings (
  id smallint primary key default 1,
  target_count integer not null default 983,
  metric_label text not null default 'Vriksha promises',
  submissions_open boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_settings_singleton_check check (id = 1),
  constraint campaign_settings_target_count_check check (target_count > 0),
  constraint campaign_settings_metric_label_check
    check (length(btrim(metric_label)) between 1 and 80)
);

insert into public.campaign_settings (id, target_count, metric_label, submissions_open)
values (1, 983, 'Vriksha promises', false)
on conflict (id) do nothing;

create sequence public.guardian_number_seq as bigint start with 1 increment by 1 no cycle;
comment on sequence public.guardian_number_seq is
  'Reserved for atomic Guardian number allocation in a later section. Section 2 must not consume it; allocated values are never reused.';

create table public.submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  status public.submission_status not null default 'draft',
  source public.submission_source not null default 'website',
  display_name text,
  is_test boolean not null default false,
  counts_toward_goal boolean not null default true,
  guardian_number bigint,
  draft_expires_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.staff_profiles(id) on delete set null,
  published_at timestamptz,
  rejection_comment text,
  rejection_recommended_at timestamptz,
  rejection_recommended_by uuid references public.staff_profiles(id) on delete set null,
  rejection_confirmed_at timestamptz,
  rejection_confirmed_by uuid references public.staff_profiles(id) on delete set null,
  rejected_at timestamptz,
  trashed_at timestamptz,
  trashed_by uuid references public.staff_profiles(id) on delete set null,
  created_by_staff_id uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_display_name_check check (
    display_name is null or length(btrim(display_name)) between 1 and 100
  ),
  constraint submissions_rejection_comment_check check (
    rejection_comment is null or length(btrim(rejection_comment)) between 1 and 1200
  ),
  constraint submissions_guardian_number_check check (
    guardian_number is null or guardian_number > 0
  ),
  constraint submissions_test_count_check check (
    not is_test or counts_toward_goal = false
  ),
  constraint submissions_trash_pair_check check (
    (trashed_at is null and trashed_by is null)
    or (trashed_at is not null and trashed_by is not null)
  ),
  constraint submissions_workflow_state_check check (
    case status
      when 'draft' then
        guardian_number is null
        and approved_at is null and approved_by is null and published_at is null
        and rejection_recommended_at is null and rejection_recommended_by is null
        and rejection_confirmed_at is null and rejection_confirmed_by is null
        and rejected_at is null
      when 'pending_review' then
        display_name is not null and submitted_at is not null
        and guardian_number is null
        and approved_at is null and approved_by is null and published_at is null
        and rejection_recommended_at is null and rejection_recommended_by is null
        and rejection_confirmed_at is null and rejection_confirmed_by is null
        and rejected_at is null
      when 'rejection_pending_admin' then
        display_name is not null and submitted_at is not null
        and rejection_comment is not null
        and rejection_recommended_at is not null and rejection_recommended_by is not null
        and guardian_number is null
        and approved_at is null and approved_by is null and published_at is null
        and rejection_confirmed_at is null and rejection_confirmed_by is null
        and rejected_at is null
      when 'published' then
        display_name is not null and submitted_at is not null
        and approved_at is not null and approved_by is not null
        and published_at is not null and guardian_number is not null
        and is_test = false
        and rejection_confirmed_at is null and rejection_confirmed_by is null
        and rejected_at is null
        and (
          (rejection_recommended_at is null and rejection_recommended_by is null)
          or (rejection_recommended_at is not null and rejection_recommended_by is not null)
        )
      when 'rejected' then
        display_name is not null and submitted_at is not null
        and rejection_comment is not null
        and rejection_confirmed_at is not null and rejection_confirmed_by is not null
        and rejected_at is not null
        and guardian_number is null and published_at is null
        and approved_at is null and approved_by is null
        and (
          (rejection_recommended_at is null and rejection_recommended_by is null)
          or (rejection_recommended_at is not null and rejection_recommended_by is not null)
        )
    end
  )
);

create unique index submissions_guardian_number_unique
  on public.submissions (guardian_number)
  where guardian_number is not null;
create index submissions_status_idx on public.submissions (status);
create index submissions_submitted_at_idx on public.submissions (submitted_at desc);
create index submissions_published_at_idx on public.submissions (published_at desc);
create index submissions_approved_by_idx on public.submissions (approved_by);
create index submissions_rejection_recommended_by_idx on public.submissions (rejection_recommended_by);
create index submissions_rejection_confirmed_by_idx on public.submissions (rejection_confirmed_by);
create index submissions_trashed_at_idx on public.submissions (trashed_at);
create index submissions_source_idx on public.submissions (source);
create index submissions_created_by_staff_id_idx on public.submissions (created_by_staff_id);
create index submissions_active_pending_review_idx
  on public.submissions (submitted_at asc)
  where status = 'pending_review' and trashed_at is null;
create index submissions_rejection_pending_admin_idx
  on public.submissions (rejection_recommended_at asc)
  where status = 'rejection_pending_admin' and trashed_at is null;
create index submissions_active_published_idx
  on public.submissions (published_at desc)
  where status = 'published' and trashed_at is null;
create index submissions_expired_drafts_idx
  on public.submissions (draft_expires_at asc)
  where status = 'draft' and draft_expires_at is not null and trashed_at is null;

create table public.submission_contacts (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_contacts_email_check
    check (length(btrim(email)) between 1 and 254)
);

create table public.submission_consents (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  consent_version text not null,
  publication_consent boolean not null,
  terms_accepted boolean not null,
  accepted_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_consents_version_check
    check (length(btrim(consent_version)) between 1 and 80)
);

create table public.submission_media (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  status public.media_status not null default 'reserved',
  original_bucket text not null default 'submission-originals',
  original_path text not null unique,
  original_extension text not null,
  original_mime_type text,
  original_bytes bigint,
  original_width integer,
  original_height integer,
  original_checksum_sha256 text,
  published_bucket text,
  published_card_path text,
  published_full_path text,
  alt_text text,
  focal_x numeric,
  focal_y numeric,
  uploaded_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_media_original_bucket_check check (original_bucket = 'submission-originals'),
  constraint submission_media_original_extension_check
    check (original_extension in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif')),
  constraint submission_media_original_path_check
    check (
      original_path = submission_id::text || '/original.' || original_extension
      and length(original_path) <= 500
    ),
  constraint submission_media_original_mime_type_check check (
    original_mime_type is null
    or original_mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif')
  ),
  constraint submission_media_bytes_check check (original_bytes is null or original_bytes > 0),
  constraint submission_media_width_check check (original_width is null or original_width > 0),
  constraint submission_media_height_check check (original_height is null or original_height > 0),
  constraint submission_media_checksum_check check (
    original_checksum_sha256 is null or original_checksum_sha256 ~ '^[0-9a-fA-F]{64}$'
  ),
  constraint submission_media_alt_text_check check (alt_text is null or length(alt_text) <= 500),
  constraint submission_media_focal_x_check check (focal_x is null or focal_x between 0 and 1),
  constraint submission_media_focal_y_check check (focal_y is null or focal_y between 0 and 1),
  constraint submission_media_published_card_path_check check (
    published_card_path is null or published_card_path ~ '^card/[1-9][0-9]*-[a-zA-Z0-9][a-zA-Z0-9_-]*\.webp$'
  ),
  constraint submission_media_published_full_path_check check (
    published_full_path is null or published_full_path ~ '^full/[1-9][0-9]*-[a-zA-Z0-9][a-zA-Z0-9_-]*\.webp$'
  ),
  constraint submission_media_status_check check (
    case status
      when 'reserved' then uploaded_at is null and published_at is null and removed_at is null
      when 'uploaded' then
        uploaded_at is not null
        and original_mime_type is not null
        and original_bytes is not null
        and original_width is not null
        and original_height is not null
        and original_checksum_sha256 is not null
        and published_at is null and removed_at is null
      when 'published' then
        uploaded_at is not null and published_at is not null and removed_at is null
        and original_mime_type is not null
        and original_bytes is not null
        and original_width is not null
        and original_height is not null
        and original_checksum_sha256 is not null
        and published_bucket = 'published-images'
        and published_card_path is not null
        and published_full_path is not null
      when 'removed' then removed_at is not null
    end
  )
);

create table public.certificates (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  status public.certificate_status not null default 'not_started',
  bucket text,
  object_path text,
  format text,
  attempt_count integer not null default 0,
  queued_at timestamptz,
  generated_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificates_attempt_count_check check (attempt_count >= 0),
  constraint certificates_last_error_code_check check (last_error_code is null or length(last_error_code) <= 160),
  constraint certificates_generated_check check (
    status <> 'generated'
    or (bucket is not null and object_path is not null and format is not null and generated_at is not null)
  )
);

create table public.email_deliveries (
  id uuid primary key default extensions.gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  kind public.email_delivery_kind not null,
  status public.email_delivery_status not null default 'not_started',
  idempotency_key text not null unique,
  template_version text,
  provider_message_id text,
  attempt_count integer not null default 0,
  queued_at timestamptz,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_deliveries_submission_kind_unique unique (submission_id, kind),
  constraint email_deliveries_attempt_count_check check (attempt_count >= 0),
  constraint email_deliveries_idempotency_key_check
    check (length(btrim(idempotency_key)) between 1 and 256),
  constraint email_deliveries_template_version_check
    check (template_version is null or length(template_version) <= 80),
  constraint email_deliveries_provider_message_id_check
    check (provider_message_id is null or length(provider_message_id) <= 240),
  constraint email_deliveries_last_error_code_check
    check (last_error_code is null or length(last_error_code) <= 160),
  constraint email_deliveries_sent_check check (
    status <> 'sent' or (sent_at is not null and provider_message_id is not null)
  )
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_check check (length(btrim(action)) between 1 and 120),
  constraint audit_logs_entity_type_check check (length(btrim(entity_type)) between 1 and 80),
  constraint audit_logs_reason_check check (reason is null or length(reason) <= 1200)
);

create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

create function private.assert_completed_submission_consent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_submission_id uuid;
  target_status public.submission_status;
begin
  if tg_table_name = 'submissions' then
    target_submission_id := coalesce(new.id, old.id);
  else
    target_submission_id := coalesce(new.submission_id, old.submission_id);
  end if;

  select s.status
    into target_status
    from public.submissions as s
   where s.id = target_submission_id;

  if target_status is not null and target_status <> 'draft' and not exists (
    select 1
      from public.submission_consents as c
     where c.submission_id = target_submission_id
       and c.publication_consent = true
       and c.terms_accepted = true
  ) then
    raise exception 'completed submission requires accepted publication and terms consent';
  end if;

  return null;
end;
$$;

revoke all on function private.assert_completed_submission_consent() from public, anon, authenticated;

create constraint trigger submissions_require_consent
after insert or update of status on public.submissions
deferrable initially deferred
for each row execute function private.assert_completed_submission_consent();

create constraint trigger consents_protect_completed_submission
after delete or update of publication_consent, terms_accepted, submission_id on public.submission_consents
deferrable initially deferred
for each row execute function private.assert_completed_submission_consent();

create trigger staff_profiles_set_updated_at before update on public.staff_profiles
for each row execute function private.set_updated_at();
create trigger campaign_settings_set_updated_at before update on public.campaign_settings
for each row execute function private.set_updated_at();
create trigger submissions_set_updated_at before update on public.submissions
for each row execute function private.set_updated_at();
create trigger submission_contacts_set_updated_at before update on public.submission_contacts
for each row execute function private.set_updated_at();
create trigger submission_consents_set_updated_at before update on public.submission_consents
for each row execute function private.set_updated_at();
create trigger submission_media_set_updated_at before update on public.submission_media
for each row execute function private.set_updated_at();
create trigger certificates_set_updated_at before update on public.certificates
for each row execute function private.set_updated_at();
create trigger email_deliveries_set_updated_at before update on public.email_deliveries
for each row execute function private.set_updated_at();

comment on table public.submission_contacts is 'Private participant contact data, separated from publishable submission content.';
comment on table public.submission_media is 'One private original photograph and future trusted public derivatives per submission. Signed URLs are never persisted.';
comment on table public.audit_logs is 'Explicit workflow audit records only; Section 2 intentionally defines no generic automatic audit trigger.';
