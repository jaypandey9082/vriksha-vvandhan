import { manageStaffAction } from "@/app/admin/actions";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isStaffE2EAdapterEnabled } from "@/lib/testing/staff-adapter";

export default async function TeamPage() {
  const session = await requireStaff();
  if (session.role !== "admin") notFound();
  const data = isStaffE2EAdapterEnabled()
    ? [{id:"e2000000-0000-4000-8000-000000000001",display_name:"Test Reviewer",role:"reviewer" as const,active:true,updated_at:"2026-08-06T10:00:00.000Z"}]
    : (await (await createServerSupabaseClient()).from("staff_profiles").select("id,display_name,role,active,updated_at").order("display_name")).data;
  return <><header className="admin-page-header"><div><p>Access control</p><h1>Team</h1></div></header><p className="admin-intro">Only existing company-managed Auth users appear here. This desk cannot create accounts or reset passwords.</p><div className="team-grid">{data?.map(profile => <form className="admin-panel team-card" action={manageStaffAction} key={profile.id}><input type="hidden" name="staffId" value={profile.id} /><label>Display name<input name="displayName" defaultValue={profile.display_name} maxLength={120} required /></label><label>Role<select name="role" defaultValue={profile.role}><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select></label><label className="team-card__active"><input type="checkbox" name="active" defaultChecked={profile.active} /> Active staff profile</label><small>Last updated {new Date(profile.updated_at).toLocaleString("en-IN")}</small><button className="button button--light" type="submit">Save staff profile</button></form>)}</div></>;
}
