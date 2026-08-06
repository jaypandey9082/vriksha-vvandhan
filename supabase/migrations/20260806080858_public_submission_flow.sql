alter table public.submissions
  add column public_request_token_hash text;

alter table public.submissions
  add constraint submissions_public_request_token_hash_check
  check (
    public_request_token_hash is null
    or public_request_token_hash ~ '^[0-9a-f]{64}$'
  );

create unique index submissions_public_request_token_hash_unique
  on public.submissions (public_request_token_hash)
  where public_request_token_hash is not null;

alter table public.campaign_settings
  add column draft_ttl_minutes smallint not null default 1440,
  add column max_submissions_per_email_24h smallint not null default 3,
  add constraint campaign_settings_draft_ttl_minutes_check
    check (draft_ttl_minutes between 15 and 2880),
  add constraint campaign_settings_max_submissions_per_email_24h_check
    check (max_submissions_per_email_24h between 1 and 20);

create index submissions_trashed_by_idx on public.submissions (trashed_by);
create index submission_contacts_email_lower_idx
  on public.submission_contacts (lower(email));

drop policy staff_profiles_read_own_active on public.staff_profiles;
drop policy staff_profiles_admin_read_all on public.staff_profiles;

create policy staff_profiles_read_active_own_or_admin
on public.staff_profiles for select to authenticated
using (
  (id = (select auth.uid()) and active = true)
  or (select private.is_admin())
);

create function public.prepare_public_submission(
  p_public_request_token_hash text,
  p_display_name text,
  p_email text,
  p_publication_consent boolean,
  p_terms_accepted boolean,
  p_consent_version text,
  p_original_extension text
)
returns table (
  submission_id uuid,
  status public.submission_status,
  original_path text,
  original_extension text,
  draft_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_settings public.campaign_settings%rowtype;
  v_submission public.submissions%rowtype;
  v_media public.submission_media%rowtype;
  v_display_name text := regexp_replace(btrim(p_display_name), '[[:space:]]+', ' ', 'g');
  v_email text := lower(btrim(p_email));
  v_extension text := lower(btrim(p_original_extension));
  v_recent_count bigint;
begin
  if p_public_request_token_hash is null
     or p_public_request_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'invalid_draft';
  end if;

  if v_display_name is null or length(v_display_name) not between 1 and 100 then
    raise exception using errcode = 'P0001', message = 'invalid_submission';
  end if;

  if v_email is null
     or length(v_email) not between 3 and 254
     or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception using errcode = 'P0001', message = 'invalid_submission';
  end if;

  if p_publication_consent is distinct from true
     or p_terms_accepted is distinct from true then
    raise exception using errcode = 'P0001', message = 'consent_required';
  end if;

  if p_consent_version is null
     or length(btrim(p_consent_version)) not between 1 and 80 then
    raise exception using errcode = 'P0001', message = 'consent_required';
  end if;

  if v_extension not in ('webp', 'jpg') then
    raise exception using errcode = 'P0001', message = 'invalid_submission';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_public_request_token_hash, 0)
  );

  select s.*
    into v_submission
    from public.submissions as s
   where s.public_request_token_hash = p_public_request_token_hash
   for update;

  if found then
    if v_submission.status = 'pending_review'::public.submission_status then
      select m.*
        into strict v_media
        from public.submission_media as m
       where m.submission_id = v_submission.id;

      return query select
        v_submission.id,
        v_submission.status,
        v_media.original_path,
        v_media.original_extension,
        v_submission.draft_expires_at;
      return;
    end if;

    if v_submission.status <> 'draft'::public.submission_status then
      raise exception using errcode = 'P0001', message = 'already_submitted';
    end if;

    if v_submission.draft_expires_at is null or v_submission.draft_expires_at <= now() then
      raise exception using errcode = 'P0001', message = 'draft_expired';
    end if;

    select m.*
      into strict v_media
      from public.submission_media as m
     where m.submission_id = v_submission.id
     for update;

    if v_media.original_extension <> v_extension then
      raise exception using errcode = 'P0001', message = 'invalid_draft';
    end if;

    update public.submissions
       set display_name = v_display_name
     where id = v_submission.id;

    insert into public.submission_contacts (submission_id, email)
    values (v_submission.id, v_email)
    on conflict (submission_id) do update
      set email = excluded.email;

    insert into public.submission_consents (
      submission_id,
      consent_version,
      publication_consent,
      terms_accepted,
      accepted_at
    ) values (
      v_submission.id,
      btrim(p_consent_version),
      true,
      true,
      now()
    )
    on conflict (submission_id) do update set
      consent_version = excluded.consent_version,
      publication_consent = true,
      terms_accepted = true,
      accepted_at = excluded.accepted_at;

    select s.* into strict v_submission
      from public.submissions as s where s.id = v_submission.id;

    return query select
      v_submission.id,
      v_submission.status,
      v_media.original_path,
      v_media.original_extension,
      v_submission.draft_expires_at;
    return;
  end if;

  select settings.*
    into strict v_settings
    from public.campaign_settings as settings
   where settings.id = 1
   for share;

  if v_settings.submissions_open is distinct from true then
    raise exception using errcode = 'P0001', message = 'submissions_closed';
  end if;

  select count(*)
    into v_recent_count
    from public.submission_contacts as contact
    join public.submissions as recent on recent.id = contact.submission_id
   where lower(contact.email) = v_email
     and recent.trashed_at is null
     and recent.created_at >= now() - interval '24 hours';

  if v_recent_count >= v_settings.max_submissions_per_email_24h then
    raise exception using errcode = 'P0001', message = 'submission_limit_reached';
  end if;

  insert into public.submissions (
    status,
    source,
    display_name,
    is_test,
    counts_toward_goal,
    draft_expires_at,
    public_request_token_hash
  ) values (
    'draft',
    'website',
    v_display_name,
    false,
    true,
    now() + pg_catalog.make_interval(mins => v_settings.draft_ttl_minutes),
    p_public_request_token_hash
  ) returning * into v_submission;

  insert into public.submission_contacts (submission_id, email)
  values (v_submission.id, v_email);

  insert into public.submission_consents (
    submission_id,
    consent_version,
    publication_consent,
    terms_accepted,
    accepted_at
  ) values (
    v_submission.id,
    btrim(p_consent_version),
    true,
    true,
    now()
  );

  insert into public.submission_media (
    submission_id,
    status,
    original_bucket,
    original_path,
    original_extension
  ) values (
    v_submission.id,
    'reserved',
    'submission-originals',
    v_submission.id::text || '/original.' || v_extension,
    v_extension
  ) returning * into v_media;

  return query select
    v_submission.id,
    v_submission.status,
    v_media.original_path,
    v_media.original_extension,
    v_submission.draft_expires_at;
end;
$$;

comment on function public.prepare_public_submission(text, text, text, boolean, boolean, text, text)
is 'Service-role-only atomic Draft preparation for the Section 3 public submission capability.';

revoke all on function public.prepare_public_submission(text, text, text, boolean, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.prepare_public_submission(text, text, text, boolean, boolean, text, text)
  to service_role;

create function public.finalize_public_submission(
  p_submission_id uuid,
  p_public_request_token_hash text,
  p_verified_mime_type text,
  p_verified_bytes bigint,
  p_verified_width integer,
  p_verified_height integer,
  p_verified_sha256 text
)
returns table (
  submission_id uuid,
  status public.submission_status
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission public.submissions%rowtype;
  v_media public.submission_media%rowtype;
begin
  if p_public_request_token_hash is null
     or p_public_request_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'invalid_draft';
  end if;

  if p_verified_mime_type not in ('image/webp', 'image/jpeg')
     or p_verified_bytes is null or p_verified_bytes not between 1 and 2097152
     or p_verified_width is null or p_verified_width not between 1 and 2560
     or p_verified_height is null or p_verified_height not between 1 and 2560
     or p_verified_sha256 is null or p_verified_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'media_not_ready';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_submission_id::text, 0)
  );

  select s.*
    into v_submission
    from public.submissions as s
   where s.id = p_submission_id
     and s.public_request_token_hash = p_public_request_token_hash
   for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'invalid_draft';
  end if;

  if v_submission.status = 'pending_review'::public.submission_status then
    return query select v_submission.id, v_submission.status;
    return;
  end if;

  if v_submission.status <> 'draft'::public.submission_status then
    raise exception using errcode = 'P0001', message = 'already_submitted';
  end if;

  if v_submission.draft_expires_at is null or v_submission.draft_expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'draft_expired';
  end if;

  if not exists (
    select 1
      from public.submission_consents as consent
     where consent.submission_id = v_submission.id
       and consent.publication_consent = true
       and consent.terms_accepted = true
  ) then
    raise exception using errcode = 'P0001', message = 'consent_required';
  end if;

  select m.*
    into v_media
    from public.submission_media as m
   where m.submission_id = v_submission.id
   for update;

  if not found
     or v_media.status <> 'reserved'::public.media_status
     or v_media.original_bucket <> 'submission-originals'
     or v_media.original_path <> v_submission.id::text || '/original.' || v_media.original_extension
     or (
       (v_media.original_extension = 'webp' and p_verified_mime_type <> 'image/webp')
       or (v_media.original_extension = 'jpg' and p_verified_mime_type <> 'image/jpeg')
     ) then
    raise exception using errcode = 'P0001', message = 'media_not_ready';
  end if;

  update public.submission_media
     set status = 'uploaded',
         original_mime_type = p_verified_mime_type,
         original_bytes = p_verified_bytes,
         original_width = p_verified_width,
         original_height = p_verified_height,
         original_checksum_sha256 = p_verified_sha256,
         uploaded_at = now()
   where id = v_media.id;

  update public.submissions
     set status = 'pending_review',
         submitted_at = now()
   where id = v_submission.id
   returning * into v_submission;

  insert into public.email_deliveries (
    submission_id,
    kind,
    status,
    idempotency_key
  ) values (
    v_submission.id,
    'submission_received',
    'not_started',
    'submission_received:' || v_submission.id::text
  ) on conflict (submission_id, kind) do nothing;

  return query select v_submission.id, v_submission.status;
end;
$$;

comment on function public.finalize_public_submission(uuid, text, text, bigint, integer, integer, text)
is 'Service-role-only atomic finalisation after trusted server verification of the private image.';

revoke all on function public.finalize_public_submission(uuid, text, text, bigint, integer, integer, text)
  from public, anon, authenticated;
grant execute on function public.finalize_public_submission(uuid, text, text, bigint, integer, integer, text)
  to service_role;
