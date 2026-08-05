create function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
      from public.staff_profiles as profile
     where profile.id = auth.uid()
       and profile.active = true
  ), false);
$$;

create function private.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
    from public.staff_profiles as profile
   where profile.id = auth.uid()
     and profile.active = true;
$$;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_staff_role() = 'admin'::public.staff_role, false);
$$;

create function private.is_reviewer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.current_staff_role() in ('reviewer'::public.staff_role, 'admin'::public.staff_role),
    false
  );
$$;

comment on function private.is_active_staff() is 'RLS helper that verifies auth.uid() has an active server-managed staff profile.';
comment on function private.current_staff_role() is 'RLS helper that reads the active staff role from public.staff_profiles, never from editable Auth metadata.';
comment on function private.is_admin() is 'RLS helper for Admin-only reads.';
comment on function private.is_reviewer_or_admin() is 'RLS helper for internal staff reads shared by Reviewer and Admin.';

revoke all on function private.is_active_staff() from public, anon;
revoke all on function private.current_staff_role() from public, anon;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_reviewer_or_admin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_active_staff() to authenticated;
grant execute on function private.current_staff_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_reviewer_or_admin() to authenticated;

alter table public.staff_profiles enable row level security;
alter table public.campaign_settings enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_contacts enable row level security;
alter table public.submission_consents enable row level security;
alter table public.submission_media enable row level security;
alter table public.certificates enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.staff_profiles to authenticated;
grant select on public.campaign_settings to authenticated;
grant select on public.submissions to authenticated;
grant select on public.submission_contacts to authenticated;
grant select on public.submission_consents to authenticated;
grant select on public.submission_media to authenticated;
grant select on public.certificates to authenticated;
grant select on public.email_deliveries to authenticated;
grant select on public.audit_logs to authenticated;

create policy staff_profiles_read_own_active
on public.staff_profiles for select to authenticated
using (id = auth.uid() and private.is_active_staff());

create policy staff_profiles_admin_read_all
on public.staff_profiles for select to authenticated
using (private.is_admin());

create policy campaign_settings_staff_read
on public.campaign_settings for select to authenticated
using (private.is_reviewer_or_admin());

create policy submissions_staff_read
on public.submissions for select to authenticated
using (private.is_reviewer_or_admin());

create policy submission_contacts_admin_read
on public.submission_contacts for select to authenticated
using (private.is_admin());

create policy submission_consents_staff_read
on public.submission_consents for select to authenticated
using (private.is_reviewer_or_admin());

create policy submission_media_staff_read
on public.submission_media for select to authenticated
using (private.is_reviewer_or_admin());

create policy certificates_staff_read
on public.certificates for select to authenticated
using (private.is_reviewer_or_admin());

create policy email_deliveries_staff_read
on public.email_deliveries for select to authenticated
using (private.is_reviewer_or_admin());

create policy audit_logs_admin_read
on public.audit_logs for select to authenticated
using (private.is_admin());

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
