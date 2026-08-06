import { createClient } from "@supabase/supabase-js";

const execute = process.argv.includes("--execute");
const value = (name) => process.argv.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3)?.trim();
const email = value("email")?.toLowerCase();
const displayName = value("display-name");
const role = value("role");
if (process.env.SUPABASE_TARGET_ENVIRONMENT !== "staging") throw new Error("Refusing to manage staff outside staging.");
if (!email || !displayName || !["admin", "reviewer"].includes(role)) throw new Error("Use --email=… --display-name=… --role=admin|reviewer [--execute].");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const secret = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url?.endsWith(".supabase.co") || !secret) throw new Error("Hosted staging Supabase environment is required.");
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
let page = 1;
let user;
while (!user) {
  const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
  if (error) throw new Error("Unable to inspect staging Auth users.");
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
  if (user || data.users.length < 100) break;
  page += 1;
}
if (!user) throw new Error("No existing Auth user matches that email. Create it in the company Supabase Dashboard first.");
if (!execute) {
  console.log(`Dry run: existing Auth user found; staff profile would be upserted as ${role}.`);
  process.exit(0);
}
const { error } = await client.from("staff_profiles").upsert({ id: user.id, display_name: displayName, role, active: true }, { onConflict: "id" });
if (error) throw new Error("Unable to bootstrap the staging staff profile.");
console.log(`Staging staff profile is active with role ${role}. No password or token was changed.`);
