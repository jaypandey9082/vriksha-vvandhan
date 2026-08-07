alter table public.certificates
  add column template_version text,
  add column file_bytes bigint,
  add column checksum_sha256 text,
  add column claim_token uuid;

alter table public.certificates
  drop constraint certificates_generated_check,
  add constraint certificates_template_version_check check (
    template_version is null
    or (length(template_version) between 1 and 80
      and template_version ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$')
  ),
  add constraint certificates_file_bytes_check check (
    file_bytes is null or file_bytes between 1 and 10485760
  ),
  add constraint certificates_checksum_sha256_check check (
    checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'
  ),
  add constraint certificates_claim_state_check check (
    (status = 'queued' and claim_token is not null and queued_at is not null)
    or (status <> 'queued' and claim_token is null)
  ),
  add constraint certificates_generated_check check (
    status <> 'generated'
    or (
      bucket = 'certificates'
      and object_path is not null
      and object_path = submission_id::text || '/' || pg_catalog.substring(object_path, '[^/]+$')
      and object_path ~ ('^' || submission_id::text || '/vriksha-guardian-[1-9][0-9]*-v[a-zA-Z0-9]+\.pdf$')
      and format = 'pdf'
      and generated_at is not null
      and template_version is not null
      and file_bytes is not null
      and checksum_sha256 is not null
    )
  );

create index certificates_delivery_status_idx
  on public.certificates (status, updated_at desc);

alter table public.email_deliveries
  add column claim_token uuid,
  add constraint email_deliveries_claim_state_check check (
    (status = 'queued' and claim_token is not null and queued_at is not null and last_attempt_at is not null)
    or (status <> 'queued' and claim_token is null)
  );

create index email_deliveries_status_kind_idx
  on public.email_deliveries (status, kind, updated_at desc);

create function public.claim_certificate_generation(
  p_submission_id uuid,
  p_template_version text,
  p_force_regeneration boolean
)
returns table (
  certificate_id uuid,
  claim_token uuid,
  display_name text,
  guardian_number bigint,
  approved_at timestamptz,
  previous_object_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_certificate public.certificates%rowtype;
  v_submission public.submissions%rowtype;
  v_claim uuid := extensions.gen_random_uuid();
begin
  if p_template_version is null
     or length(p_template_version) not between 1 and 80
     or p_template_version !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$' then
    raise exception using errcode = 'P0001', message = 'invalid_template_version';
  end if;

  select * into v_submission
    from public.submissions as submission
   where submission.id = p_submission_id
   for update;

  if not found
     or v_submission.status <> 'published'::public.submission_status
     or v_submission.trashed_at is not null
     or v_submission.display_name is null
     or v_submission.guardian_number is null
     or v_submission.approved_at is null then
    return;
  end if;

  select * into v_certificate
    from public.certificates as certificate
   where certificate.submission_id = p_submission_id
   for update;

  if not found
     or v_certificate.status = 'queued'::public.certificate_status
     or (v_certificate.status = 'generated'::public.certificate_status and not p_force_regeneration) then
    return;
  end if;

  update public.certificates as certificate
     set status = 'queued',
         claim_token = v_claim,
         attempt_count = certificate.attempt_count + 1,
         queued_at = now(),
         last_error_code = null
   where certificate.id = v_certificate.id;

  return query select
    v_certificate.id,
    v_claim,
    v_submission.display_name,
    v_submission.guardian_number,
    v_submission.approved_at,
    v_certificate.object_path;
end;
$$;

comment on function public.claim_certificate_generation(uuid, text, boolean) is
  'Service-role-only atomic claim. Delivery failures never change publication state or Guardian allocation.';
revoke all on function public.claim_certificate_generation(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.claim_certificate_generation(uuid, text, boolean) to service_role;

create function public.complete_certificate_generation(
  p_certificate_id uuid,
  p_claim_token uuid,
  p_template_version text,
  p_object_path text,
  p_file_bytes bigint,
  p_checksum_sha256 text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_submission_id uuid;
  v_guardian_number bigint;
  v_expected_path text;
begin
  select certificate.submission_id, submission.guardian_number
    into v_submission_id, v_guardian_number
    from public.certificates as certificate
    join public.submissions as submission on submission.id = certificate.submission_id
   where certificate.id = p_certificate_id
     and certificate.status = 'queued'::public.certificate_status
     and certificate.claim_token = p_claim_token
     and submission.status = 'published'::public.submission_status
     and submission.trashed_at is null
   for update of certificate;

  if not found then return false; end if;
  v_expected_path := v_submission_id::text || '/vriksha-guardian-' || v_guardian_number::text
    || '-v' || pg_catalog.substring(p_template_version, '-v([a-zA-Z0-9]+)$') || '.pdf';

  if p_template_version !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$'
     or p_object_path is distinct from v_expected_path
     or p_file_bytes not between 1 and 10485760
     or p_checksum_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'invalid_certificate_metadata';
  end if;

  update public.certificates
     set status = 'generated',
         bucket = 'certificates',
         object_path = p_object_path,
         format = 'pdf',
         template_version = p_template_version,
         file_bytes = p_file_bytes,
         checksum_sha256 = p_checksum_sha256,
         generated_at = now(),
         claim_token = null,
         last_error_code = null
   where id = p_certificate_id;
  return true;
end;
$$;

revoke all on function public.complete_certificate_generation(uuid, uuid, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.complete_certificate_generation(uuid, uuid, text, text, bigint, text) to service_role;

create function public.fail_certificate_generation(
  p_certificate_id uuid,
  p_claim_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_error_code is null or p_error_code !~ '^[a-z0-9_]{1,80}$' then
    raise exception using errcode = 'P0001', message = 'invalid_delivery_error';
  end if;
  update public.certificates
     set status = 'failed', claim_token = null, last_error_code = p_error_code
   where id = p_certificate_id
     and status = 'queued'::public.certificate_status
     and claim_token = p_claim_token;
  return found;
end;
$$;

revoke all on function public.fail_certificate_generation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fail_certificate_generation(uuid, uuid, text) to service_role;

create function public.claim_email_delivery(p_delivery_id uuid)
returns table (
  delivery_id uuid,
  claim_token uuid,
  submission_id uuid,
  kind public.email_delivery_kind,
  idempotency_key text,
  recipient_email text,
  display_name text,
  guardian_number bigint,
  rejection_comment text,
  certificate_bucket text,
  certificate_path text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_delivery public.email_deliveries%rowtype;
  v_submission public.submissions%rowtype;
  v_contact public.submission_contacts%rowtype;
  v_certificate public.certificates%rowtype;
  v_claim uuid := extensions.gen_random_uuid();
  v_eligible boolean := false;
begin
  select * into v_delivery
    from public.email_deliveries as delivery
   where delivery.id = p_delivery_id
   for update;
  if not found or v_delivery.status not in ('not_started', 'failed') then return; end if;

  select * into v_submission from public.submissions as submission
   where submission.id = v_delivery.submission_id and submission.trashed_at is null;
  select * into v_contact from public.submission_contacts as contact
   where contact.submission_id = v_delivery.submission_id;
  select * into v_certificate from public.certificates as certificate
   where certificate.submission_id = v_delivery.submission_id;

  v_eligible := case v_delivery.kind
    when 'submission_received' then v_submission.status in ('pending_review', 'rejection_pending_admin', 'published', 'rejected')
    when 'approval_certificate' then
      v_submission.status = 'published'::public.submission_status
      and v_certificate.status = 'generated'::public.certificate_status
      and v_certificate.bucket = 'certificates'
      and v_certificate.object_path is not null
    when 'rejection' then v_submission.status = 'rejected'::public.submission_status
  end;

  if not coalesce(v_eligible, false) or v_contact.email is null then return; end if;

  update public.email_deliveries as delivery
     set status = 'queued',
         claim_token = v_claim,
         attempt_count = delivery.attempt_count + 1,
         queued_at = now(),
         last_attempt_at = now(),
         last_error_code = null
   where delivery.id = v_delivery.id;

  return query select
    v_delivery.id,
    v_claim,
    v_delivery.submission_id,
    v_delivery.kind,
    v_delivery.idempotency_key,
    v_contact.email,
    v_submission.display_name,
    v_submission.guardian_number,
    v_submission.rejection_comment,
    v_certificate.bucket,
    v_certificate.object_path;
end;
$$;

comment on function public.claim_email_delivery(uuid) is
  'Service-role-only atomic claim. A sent delivery is permanently ineligible for another claim.';
revoke all on function public.claim_email_delivery(uuid) from public, anon, authenticated;
grant execute on function public.claim_email_delivery(uuid) to service_role;

create function public.complete_email_delivery(
  p_delivery_id uuid,
  p_claim_token uuid,
  p_template_version text,
  p_provider_message_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_template_version is null or length(p_template_version) not between 1 and 80
     or p_provider_message_id is null or length(p_provider_message_id) not between 1 and 240 then
    raise exception using errcode = 'P0001', message = 'invalid_delivery_metadata';
  end if;
  update public.email_deliveries
     set status = 'sent',
         template_version = p_template_version,
         provider_message_id = p_provider_message_id,
         sent_at = now(),
         claim_token = null,
         last_error_code = null
   where id = p_delivery_id
     and status = 'queued'::public.email_delivery_status
     and claim_token = p_claim_token;
  return found;
end;
$$;

revoke all on function public.complete_email_delivery(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.complete_email_delivery(uuid, uuid, text, text) to service_role;

create function public.fail_email_delivery(
  p_delivery_id uuid,
  p_claim_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_error_code is null or p_error_code !~ '^[a-z0-9_]{1,80}$' then
    raise exception using errcode = 'P0001', message = 'invalid_delivery_error';
  end if;
  update public.email_deliveries
     set status = 'failed', claim_token = null, last_error_code = p_error_code
   where id = p_delivery_id
     and status = 'queued'::public.email_delivery_status
     and claim_token = p_claim_token;
  return found;
end;
$$;

revoke all on function public.fail_email_delivery(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.fail_email_delivery(uuid, uuid, text) to service_role;

create function public.record_campaign_data_export(p_row_count integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception using errcode = 'P0001', message = 'unauthorized_role';
  end if;
  if p_row_count is null or p_row_count < 0 then
    raise exception using errcode = 'P0001', message = 'invalid_export_metadata';
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, after_data)
  values (v_actor, 'campaign.data_exported', 'campaign', jsonb_build_object('row_count', p_row_count));
end;
$$;

revoke all on function public.record_campaign_data_export(integer) from public, anon, authenticated;
grant execute on function public.record_campaign_data_export(integer) to authenticated;
