create function private.current_published_count()
returns bigint
language sql
stable
set search_path = ''
as $$
  select count(*)
    from public.submissions as submission
   where submission.status = 'published'::public.submission_status
     and submission.is_test = false
     and submission.counts_toward_goal = true
     and submission.trashed_at is null;
$$;

comment on function private.current_published_count() is
  'Read-only canonical campaign count: active, published, production submissions that count toward the goal.';

revoke all on function private.current_published_count() from public, anon, authenticated;
