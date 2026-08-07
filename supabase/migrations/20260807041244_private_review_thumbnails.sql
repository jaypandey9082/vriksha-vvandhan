alter table public.submission_media
  add column review_thumbnail_path text,
  add column review_thumbnail_width integer,
  add column review_thumbnail_height integer,
  add column review_thumbnail_bytes bigint,
  add column review_thumbnail_generated_at timestamptz,
  add constraint submission_media_review_thumbnail_consistency_check check (
    pg_catalog.num_nonnulls(
      review_thumbnail_path,
      review_thumbnail_width,
      review_thumbnail_height,
      review_thumbnail_bytes,
      review_thumbnail_generated_at
    ) = 0
    or
    (
      pg_catalog.num_nonnulls(
        review_thumbnail_path,
        review_thumbnail_width,
        review_thumbnail_height,
        review_thumbnail_bytes,
        review_thumbnail_generated_at
      ) = 5
      and
      review_thumbnail_path = submission_id::text || '/review-thumb.webp'
      and length(review_thumbnail_path) <= 500
      and review_thumbnail_width = 240
      and review_thumbnail_height = 300
      and review_thumbnail_bytes between 1 and 122880
      and review_thumbnail_generated_at is not null
    )
  );

comment on column public.submission_media.review_thumbnail_path
is 'Private, staff-only 240x300 WebP review derivative in submission-originals. Signed URLs are never persisted.';

create function public.finalize_public_submission_with_review_thumbnail(
  p_submission_id uuid,
  p_public_request_token_hash text,
  p_verified_mime_type text,
  p_verified_bytes bigint,
  p_verified_width integer,
  p_verified_height integer,
  p_verified_sha256 text,
  p_review_thumbnail_path text,
  p_review_thumbnail_width integer,
  p_review_thumbnail_height integer,
  p_review_thumbnail_bytes bigint,
  p_review_thumbnail_generated_at timestamptz
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
  v_submission_id uuid;
  v_status public.submission_status;
begin
  if not (
    pg_catalog.num_nonnulls(
      p_review_thumbnail_path,
      p_review_thumbnail_width,
      p_review_thumbnail_height,
      p_review_thumbnail_bytes,
      p_review_thumbnail_generated_at
    ) = 0
    or
    (
      pg_catalog.num_nonnulls(
        p_review_thumbnail_path,
        p_review_thumbnail_width,
        p_review_thumbnail_height,
        p_review_thumbnail_bytes,
        p_review_thumbnail_generated_at
      ) = 5
      and
      p_review_thumbnail_path = p_submission_id::text || '/review-thumb.webp'
      and length(p_review_thumbnail_path) <= 500
      and p_review_thumbnail_width = 240
      and p_review_thumbnail_height = 300
      and p_review_thumbnail_bytes between 1 and 122880
      and p_review_thumbnail_generated_at is not null
    )
  ) then
    raise exception using errcode = 'P0001', message = 'media_not_ready';
  end if;

  select result.submission_id, result.status
    into v_submission_id, v_status
    from public.finalize_public_submission(
      p_submission_id,
      p_public_request_token_hash,
      p_verified_mime_type,
      p_verified_bytes,
      p_verified_width,
      p_verified_height,
      p_verified_sha256
    ) as result;

  if p_review_thumbnail_path is not null then
    update public.submission_media
       set review_thumbnail_path = p_review_thumbnail_path,
           review_thumbnail_width = p_review_thumbnail_width,
           review_thumbnail_height = p_review_thumbnail_height,
           review_thumbnail_bytes = p_review_thumbnail_bytes,
           review_thumbnail_generated_at = p_review_thumbnail_generated_at
     where submission_media.submission_id = p_submission_id;
  end if;

  return query select v_submission_id, v_status;
end;
$$;

comment on function public.finalize_public_submission_with_review_thumbnail(
  uuid, text, text, bigint, integer, integer, text, text, integer, integer, bigint, timestamptz
)
is 'Service-role-only atomic finalisation with optional trusted private review-thumbnail metadata.';

revoke all on function public.finalize_public_submission_with_review_thumbnail(
  uuid, text, text, bigint, integer, integer, text, text, integer, integer, bigint, timestamptz
) from public, anon, authenticated;

grant execute on function public.finalize_public_submission_with_review_thumbnail(
  uuid, text, text, bigint, integer, integer, text, text, integer, integer, bigint, timestamptz
) to service_role;
