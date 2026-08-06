alter table public.submission_media
  add column published_version text,
  add column published_card_width integer,
  add column published_card_height integer,
  add column published_card_bytes bigint,
  add column published_full_width integer,
  add column published_full_height integer,
  add column published_full_bytes bigint;

alter table public.submission_media
  drop constraint submission_media_status_check,
  add constraint submission_media_published_version_check check (
    published_version is null
    or (length(published_version) between 1 and 80
      and published_version ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$')
  ),
  add constraint submission_media_public_dimensions_check check (
    (published_card_width is null or published_card_width > 0)
    and (published_card_height is null or published_card_height > 0)
    and (published_full_width is null or published_full_width > 0)
    and (published_full_height is null or published_full_height > 0)
  ),
  add constraint submission_media_public_bytes_check check (
    (published_card_bytes is null or published_card_bytes > 0)
    and (published_full_bytes is null or published_full_bytes > 0)
  ),
  add constraint submission_media_status_check check (
    case status
      when 'reserved' then uploaded_at is null and published_at is null and removed_at is null
      when 'uploaded' then
        uploaded_at is not null
        and original_mime_type is not null and original_bytes is not null
        and original_width is not null and original_height is not null
        and original_checksum_sha256 is not null
        and published_at is null and removed_at is null
      when 'published' then
        uploaded_at is not null and published_at is not null and removed_at is null
        and original_mime_type is not null and original_bytes is not null
        and original_width is not null and original_height is not null
        and original_checksum_sha256 is not null
        and published_bucket = 'published-images'
        and published_card_path is not null and published_full_path is not null
        and published_version is not null
        and published_card_width is not null and published_card_height is not null
        and published_card_bytes is not null
        and published_full_width is not null and published_full_height is not null
        and published_full_bytes is not null
      when 'removed' then removed_at is not null
    end
  );

create index submissions_active_public_idx
  on public.submissions (published_at desc, guardian_number desc)
  where status = 'published' and is_test = false
    and counts_toward_goal = true and trashed_at is null;

create or replace function private.current_published_count()
returns bigint
language sql
stable
set search_path = ''
as $$
  select count(*)
    from public.submissions as submission
    join public.submission_media as media on media.submission_id = submission.id
   where submission.status = 'published'::public.submission_status
     and submission.is_test = false
     and submission.counts_toward_goal = true
     and submission.trashed_at is null
     and media.status = 'published'::public.media_status
     and media.published_bucket = 'published-images'
     and media.published_card_path is not null
     and media.published_full_path is not null;
$$;

create function public.reserve_guardian_number_for_publication(
  p_submission_id uuid,
  p_actor_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.submission_status;
  v_role public.staff_role;
begin
  select profile.role into v_role
    from public.staff_profiles as profile
   where profile.id = p_actor_id and profile.active = true;

  if v_role is null then
    raise exception using errcode = 'P0001', message = 'unauthorized_role';
  end if;

  select submission.status into v_status
    from public.submissions as submission
   where submission.id = p_submission_id
     and submission.trashed_at is null
   for update;

  if v_status = 'pending_review'::public.submission_status then
    null;
  elsif v_status = 'rejection_pending_admin'::public.submission_status
        and v_role = 'admin'::public.staff_role then
    null;
  else
    raise exception using errcode = 'P0001', message = 'approval_conflict';
  end if;

  return nextval('public.guardian_number_seq'::regclass);
end;
$$;

comment on function public.reserve_guardian_number_for_publication(uuid, uuid) is
  'Service-only reservation. Sequence gaps are expected after failed image publication and numbers are never reused.';
revoke all on function public.reserve_guardian_number_for_publication(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_guardian_number_for_publication(uuid, uuid) to service_role;

create function public.update_submission_review_fields(
  p_submission_id uuid,
  p_display_name text,
  p_focal_x numeric,
  p_focal_y numeric
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_name text := regexp_replace(btrim(p_display_name), '[[:space:]]+', ' ', 'g');
  v_before jsonb;
begin
  if not coalesce((select private.is_reviewer_or_admin()), false) then
    raise exception using errcode = 'P0001', message = 'unauthorized_role';
  end if;
  if v_name is null or length(v_name) not between 1 and 100
     or p_focal_x not between 0 and 1 or p_focal_y not between 0 and 1 then
    raise exception using errcode = 'P0001', message = 'invalid_review_fields';
  end if;

  select jsonb_build_object('display_name', s.display_name, 'focal_x', m.focal_x, 'focal_y', m.focal_y)
    into v_before
    from public.submissions s join public.submission_media m on m.submission_id = s.id
   where s.id = p_submission_id
     and s.status in ('pending_review', 'rejection_pending_admin')
     and s.trashed_at is null
   for update of s, m;
  if not found then raise exception using errcode = 'P0001', message = 'already_reviewed'; end if;

  update public.submissions set display_name = v_name where id = p_submission_id;
  update public.submission_media set focal_x = p_focal_x, focal_y = p_focal_y where submission_id = p_submission_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values (v_actor, 'submission.review_fields_updated', 'submission', p_submission_id, v_before,
    jsonb_build_object('display_name', v_name, 'focal_x', p_focal_x, 'focal_y', p_focal_y));
end;
$$;

create function public.recommend_submission_rejection(p_submission_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_comment text := btrim(p_comment);
begin
  if (select private.current_staff_role()) is distinct from 'reviewer'::public.staff_role then
    raise exception using errcode = 'P0001', message = 'unauthorized_role';
  end if;
  if v_comment is null or length(v_comment) not between 10 and 1200 then
    raise exception using errcode = 'P0001', message = 'comment_required';
  end if;
  update public.submissions set
    status = 'rejection_pending_admin', rejection_comment = v_comment,
    rejection_recommended_at = now(), rejection_recommended_by = v_actor
  where id = p_submission_id and status = 'pending_review' and trashed_at is null;
  if not found then raise exception using errcode = 'P0001', message = 'already_reviewed'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values (v_actor, 'submission.rejection_recommended', 'submission', p_submission_id,
    jsonb_build_object('status', 'rejection_pending_admin', 'comment', v_comment));
end;
$$;

create function public.confirm_submission_rejection(p_submission_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_actor uuid := auth.uid(); v_comment text := btrim(p_comment); v_status public.submission_status;
begin
  if not coalesce((select private.is_admin()), false) then
    raise exception using errcode = 'P0001', message = 'unauthorized_role';
  end if;
  if v_comment is null or length(v_comment) not between 10 and 1200 then
    raise exception using errcode = 'P0001', message = 'comment_required';
  end if;
  select status into v_status from public.submissions where id = p_submission_id and trashed_at is null for update;
  if v_status = 'rejected' then return; end if;
  if v_status not in ('pending_review', 'rejection_pending_admin') then
    raise exception using errcode = 'P0001', message = 'already_reviewed';
  end if;
  update public.submissions set status = 'rejected', rejection_comment = v_comment,
    rejection_confirmed_at = now(), rejection_confirmed_by = v_actor, rejected_at = now()
  where id = p_submission_id;
  insert into public.email_deliveries(submission_id, kind, status, idempotency_key)
  values (p_submission_id, 'rejection', 'not_started', 'rejection:' || p_submission_id::text)
  on conflict on constraint email_deliveries_submission_kind_unique do nothing;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values (v_actor, 'submission.rejected', 'submission', p_submission_id,
    jsonb_build_object('status', 'rejected', 'comment', v_comment));
end;
$$;

create function public.publish_submission(
  p_submission_id uuid,
  p_guardian_number bigint,
  p_published_version text,
  p_card_path text,
  p_card_width integer,
  p_card_height integer,
  p_card_bytes bigint,
  p_full_path text,
  p_full_width integer,
  p_full_height integer,
  p_full_bytes bigint,
  p_alt_text text
)
returns table (guardian_number bigint, card_path text, full_path text, already_published boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.staff_role := (select private.current_staff_role());
  v_submission public.submissions%rowtype;
  v_expected_card text := 'card/' || p_guardian_number::text || '-' || p_published_version || '.webp';
  v_expected_full text := 'full/' || p_guardian_number::text || '-' || p_published_version || '.webp';
begin
  if v_role is null then raise exception using errcode = 'P0001', message = 'unauthorized_role'; end if;
  if p_guardian_number is null or p_guardian_number <= 0
     or p_published_version is null or length(p_published_version) not between 1 and 80
     or p_published_version !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]*$'
     or p_card_path <> v_expected_card or p_full_path <> v_expected_full
     or p_card_width <= 0 or p_card_height <= 0 or p_card_bytes <= 0
     or p_full_width <= 0 or p_full_height <= 0 or p_full_bytes <= 0
     or p_alt_text is null or length(btrim(p_alt_text)) not between 1 and 500 then
    raise exception using errcode = 'P0001', message = 'invalid_publication_metadata';
  end if;

  select * into v_submission from public.submissions where id = p_submission_id for update;
  if v_submission.status = 'published' and v_submission.guardian_number = p_guardian_number then
    return query select v_submission.guardian_number, p_card_path, p_full_path, true; return;
  end if;
  if v_submission.trashed_at is not null
     or v_submission.status not in ('pending_review', 'rejection_pending_admin')
     or (v_submission.status = 'rejection_pending_admin' and v_role <> 'admin') then
    raise exception using errcode = 'P0001', message = 'approval_conflict';
  end if;
  if exists(select 1 from public.submissions s where s.guardian_number = p_guardian_number and s.id <> p_submission_id) then
    raise exception using errcode = 'P0001', message = 'guardian_number_conflict';
  end if;
  if not exists(select 1 from public.submission_consents c where c.submission_id = p_submission_id and c.publication_consent and c.terms_accepted)
     or not exists(select 1 from public.submission_media m where m.submission_id = p_submission_id and m.status = 'uploaded') then
    raise exception using errcode = 'P0001', message = 'publication_not_ready';
  end if;

  update public.submission_media set status = 'published', published_bucket = 'published-images',
    published_card_path = p_card_path, published_full_path = p_full_path,
    published_version = p_published_version,
    published_card_width = p_card_width, published_card_height = p_card_height,
    published_card_bytes = p_card_bytes, published_full_width = p_full_width,
    published_full_height = p_full_height, published_full_bytes = p_full_bytes,
    alt_text = btrim(p_alt_text), published_at = now(), removed_at = null
  where submission_id = p_submission_id and status = 'uploaded';
  if not found then raise exception using errcode = 'P0001', message = 'approval_conflict'; end if;

  update public.submissions set guardian_number = p_guardian_number, status = 'published',
    approved_at = now(), approved_by = v_actor, published_at = now()
  where id = p_submission_id and status = v_submission.status;
  if not found then raise exception using errcode = 'P0001', message = 'approval_conflict'; end if;

  insert into public.certificates(submission_id, status) values (p_submission_id, 'not_started')
  on conflict on constraint certificates_submission_id_key do nothing;
  insert into public.email_deliveries(submission_id, kind, status, idempotency_key)
  values (p_submission_id, 'approval_certificate', 'not_started', 'approval_certificate:' || p_submission_id::text)
  on conflict on constraint email_deliveries_submission_kind_unique do nothing;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values (v_actor, 'submission.approved', 'submission', p_submission_id,
    jsonb_build_object('status', 'published', 'guardian_number', p_guardian_number,
      'card_path', p_card_path, 'full_path', p_full_path));
  return query select p_guardian_number, p_card_path, p_full_path, false;
end;
$$;

create function public.trash_submission(p_submission_id uuid)
returns table (workflow_status public.submission_status, card_path text, full_path text, certificate_path text)
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  update public.submissions set trashed_at = now(), trashed_by = v_actor
   where id = p_submission_id and trashed_at is null;
  if not found then raise exception using errcode='P0001', message='already_trashed'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values(v_actor, 'submission.trashed', 'submission', p_submission_id, jsonb_build_object('trashed', true));
  return query select s.status, m.published_card_path, m.published_full_path, c.object_path
    from public.submissions s left join public.submission_media m on m.submission_id=s.id
    left join public.certificates c on c.submission_id=s.id where s.id=p_submission_id;
end; $$;

create function public.restore_nonpublished_submission(p_submission_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid();
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  update public.submissions set trashed_at=null, trashed_by=null
   where id=p_submission_id and trashed_at is not null and status <> 'published';
  if not found then raise exception using errcode='P0001', message='restore_conflict'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(v_actor,'submission.restored','submission',p_submission_id,jsonb_build_object('trashed',false));
end; $$;

create function public.restore_published_submission(
  p_submission_id uuid, p_published_version text, p_card_path text,
  p_card_width integer, p_card_height integer, p_card_bytes bigint,
  p_full_path text, p_full_width integer, p_full_height integer, p_full_bytes bigint
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_guardian bigint;
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  select guardian_number into v_guardian from public.submissions
   where id=p_submission_id and status='published' and trashed_at is not null for update;
  if v_guardian is null
     or p_published_version !~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$'
     or p_card_path <> 'card/'||v_guardian||'-'||p_published_version||'.webp'
     or p_full_path <> 'full/'||v_guardian||'-'||p_published_version||'.webp'
     or least(p_card_width,p_card_height,p_card_bytes,p_full_width,p_full_height,p_full_bytes) <= 0 then
    raise exception using errcode='P0001', message='restore_conflict';
  end if;
  update public.submission_media set status='published', published_bucket='published-images',
    published_version=p_published_version,published_card_path=p_card_path,
    published_card_width=p_card_width,published_card_height=p_card_height,published_card_bytes=p_card_bytes,
    published_full_path=p_full_path,published_full_width=p_full_width,published_full_height=p_full_height,
    published_full_bytes=p_full_bytes,published_at=now(),removed_at=null where submission_id=p_submission_id;
  update public.submissions set trashed_at=null,trashed_by=null where id=p_submission_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data)
  values(v_actor,'submission.restored','submission',p_submission_id,jsonb_build_object('trashed',false,'version',p_published_version));
end; $$;

create function public.delete_trashed_submission(p_submission_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_reason text := btrim(p_reason);
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  if v_reason is null or length(v_reason) not between 10 and 1200 then raise exception using errcode='P0001', message='reason_required'; end if;
  if not exists(select 1 from public.submissions where id=p_submission_id and trashed_at is not null for update) then
    raise exception using errcode='P0001', message='delete_requires_trash';
  end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,reason,after_data)
  values(v_actor,'submission.permanently_deleted','submission',p_submission_id,v_reason,jsonb_build_object('deleted',true));
  delete from public.submissions where id=p_submission_id;
end; $$;

create function public.manage_staff_profile(p_staff_id uuid, p_display_name text, p_role public.staff_role, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_name text := regexp_replace(btrim(p_display_name),'[[:space:]]+',' ','g'); v_before public.staff_profiles%rowtype; v_admins integer;
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  if v_name is null or length(v_name) not between 1 and 120 then raise exception using errcode='P0001', message='invalid_staff_profile'; end if;
  select * into v_before from public.staff_profiles where id=p_staff_id for update;
  if not found then raise exception using errcode='P0001', message='staff_not_found'; end if;
  if p_staff_id=v_actor and p_active=false then raise exception using errcode='P0001', message='self_deactivation_forbidden'; end if;
  if v_before.role='admin' and v_before.active and (p_role<>'admin' or not p_active) then
    select count(*) into v_admins from public.staff_profiles where role='admin' and active;
    if v_admins <= 1 then raise exception using errcode='P0001', message='final_admin_required'; end if;
  end if;
  update public.staff_profiles set display_name=v_name,role=p_role,active=p_active where id=p_staff_id;
  if v_before.display_name is distinct from v_name then insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_actor,'staff.display_name_changed','staff_profile',p_staff_id,jsonb_build_object('display_name',v_before.display_name),jsonb_build_object('display_name',v_name)); end if;
  if v_before.role is distinct from p_role then insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_actor,'staff.role_changed','staff_profile',p_staff_id,jsonb_build_object('role',v_before.role),jsonb_build_object('role',p_role)); end if;
  if v_before.active is distinct from p_active then insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(v_actor,'staff.active_changed','staff_profile',p_staff_id,jsonb_build_object('active',v_before.active),jsonb_build_object('active',p_active)); end if;
end; $$;

create function public.update_campaign_settings(
  p_target_count integer,
  p_metric_label text,
  p_submissions_open boolean
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_label text := btrim(p_metric_label); v_before jsonb;
begin
  if not coalesce((select private.is_admin()), false) then raise exception using errcode='P0001', message='unauthorized_role'; end if;
  if p_target_count is null or p_target_count <= 0 or v_label is null or length(v_label) not between 1 and 80 then
    raise exception using errcode='P0001', message='invalid_campaign_settings';
  end if;
  select jsonb_build_object('target_count',target_count,'metric_label',metric_label,'submissions_open',submissions_open)
    into v_before from public.campaign_settings where id=1 for update;
  update public.campaign_settings set target_count=p_target_count,metric_label=v_label,submissions_open=p_submissions_open where id=1;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(v_actor,'campaign.settings_changed','campaign_settings',null,v_before,
    jsonb_build_object('target_count',p_target_count,'metric_label',v_label,'submissions_open',p_submissions_open));
end; $$;

create function public.get_public_campaign_summary()
returns table(current_count bigint,target_count integer,metric_label text,submissions_open boolean)
language sql stable security definer set search_path = '' as $$
  select private.current_published_count(), settings.target_count, settings.metric_label, settings.submissions_open
  from public.campaign_settings settings where settings.id=1;
$$;

create function public.list_public_movement_entries(
  p_limit integer default 24,
  p_before_published_at timestamptz default null,
  p_before_guardian_number bigint default null
)
returns table(
  guardian_number bigint, display_name text, published_at timestamptz,
  card_path text, card_width integer, card_height integer,
  full_path text, full_width integer, full_height integer,
  alt_text text, focal_x numeric, focal_y numeric
)
language sql stable security definer set search_path = '' as $$
  select s.guardian_number,s.display_name,s.published_at,m.published_card_path,m.published_card_width,
    m.published_card_height,m.published_full_path,m.published_full_width,m.published_full_height,
    m.alt_text,coalesce(m.focal_x,0.5),coalesce(m.focal_y,0.5)
  from public.submissions s join public.submission_media m on m.submission_id=s.id
  where s.status='published' and s.is_test=false and s.counts_toward_goal=true and s.trashed_at is null
    and m.status='published' and m.published_bucket='published-images'
    and m.published_card_path is not null and m.published_full_path is not null
    and (p_before_published_at is null or (s.published_at,s.guardian_number)<(p_before_published_at,p_before_guardian_number))
  order by s.published_at desc,s.guardian_number desc limit least(greatest(coalesce(p_limit,24),1),48);
$$;

revoke all on function public.update_submission_review_fields(uuid,text,numeric,numeric) from public,anon;
revoke all on function public.recommend_submission_rejection(uuid,text) from public,anon;
revoke all on function public.confirm_submission_rejection(uuid,text) from public,anon;
revoke all on function public.publish_submission(uuid,bigint,text,text,integer,integer,bigint,text,integer,integer,bigint,text) from public,anon;
revoke all on function public.trash_submission(uuid) from public,anon;
revoke all on function public.restore_nonpublished_submission(uuid) from public,anon;
revoke all on function public.restore_published_submission(uuid,text,text,integer,integer,bigint,text,integer,integer,bigint) from public,anon;
revoke all on function public.delete_trashed_submission(uuid,text) from public,anon;
revoke all on function public.manage_staff_profile(uuid,text,public.staff_role,boolean) from public,anon;
revoke all on function public.update_campaign_settings(integer,text,boolean) from public,anon;
grant execute on function public.update_submission_review_fields(uuid,text,numeric,numeric) to authenticated;
grant execute on function public.recommend_submission_rejection(uuid,text) to authenticated;
grant execute on function public.confirm_submission_rejection(uuid,text) to authenticated;
grant execute on function public.publish_submission(uuid,bigint,text,text,integer,integer,bigint,text,integer,integer,bigint,text) to authenticated;
grant execute on function public.trash_submission(uuid) to authenticated;
grant execute on function public.restore_nonpublished_submission(uuid) to authenticated;
grant execute on function public.restore_published_submission(uuid,text,text,integer,integer,bigint,text,integer,integer,bigint) to authenticated;
grant execute on function public.delete_trashed_submission(uuid,text) to authenticated;
grant execute on function public.manage_staff_profile(uuid,text,public.staff_role,boolean) to authenticated;
grant execute on function public.update_campaign_settings(integer,text,boolean) to authenticated;

revoke all on function public.get_public_campaign_summary() from public;
revoke all on function public.list_public_movement_entries(integer,timestamptz,bigint) from public;
grant execute on function public.get_public_campaign_summary() to anon,authenticated;
grant execute on function public.list_public_movement_entries(integer,timestamptz,bigint) to anon,authenticated;

comment on function public.get_public_campaign_summary() is 'Anonymous safe aggregate; base tables remain private.';
comment on function public.list_public_movement_entries(integer,timestamptz,bigint) is 'Anonymous safe keyset page with no submission IDs, contact data, or private paths.';
