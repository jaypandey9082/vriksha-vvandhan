import { updateCampaignSettingsAction } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireRole("admin");
  const client = await createServerSupabaseClient();
  const { data, error } = await client.from("campaign_settings").select("target_count,metric_label,submissions_open,updated_at").eq("id", 1).single();
  if (error) throw new Error("Unable to load campaign settings.");
  const saved = (await searchParams).saved === "true";
  return <>
    <header className="admin-page-header"><div><p>Campaign control</p><h1>Settings</h1></div></header>
    {saved && <div className="admin-success" role="status">Campaign settings saved.</div>}
    <form className="admin-panel admin-settings" action={updateCampaignSettingsAction}>
      <label>Target count<input name="targetCount" type="number" min={1} defaultValue={data.target_count} required /></label>
      <label>Metric label<input name="metricLabel" maxLength={80} defaultValue={data.metric_label} required /></label>
      <label className="team-card__active"><input name="submissionsOpen" type="checkbox" defaultChecked={data.submissions_open} /> Public submissions are open</label>
      <small>Last changed {new Date(data.updated_at).toLocaleString("en-IN")}. Changes are audited and invalidate public campaign data.</small>
      <button className="button button--primary" type="submit">Save campaign settings</button>
    </form>
  </>;
}
