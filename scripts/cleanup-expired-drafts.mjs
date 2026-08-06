import { createClient } from "@supabase/supabase-js";

const execute = process.argv.includes("--execute");
const batchArgument = process.argv.find((argument) => argument.startsWith("--batch-size="));
const requestedBatchSize = Number(batchArgument?.split("=")[1] ?? 50);
if (!Number.isInteger(requestedBatchSize) || requestedBatchSize < 1) {
  throw new Error("--batch-size must be a positive integer.");
}
const batchSize = Math.min(100, requestedBatchSize);

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

if (process.env.SUPABASE_TARGET_ENVIRONMENT !== "staging") {
  throw new Error("Refusing to inspect or delete Drafts unless SUPABASE_TARGET_ENVIRONMENT=staging.");
}

const client = createClient(
  requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnvironment("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const now = new Date().toISOString();
const { data: drafts, error } = await client
  .from("submissions")
  .select("id,status,draft_expires_at,submission_media(original_path)")
  .eq("status", "draft")
  .lt("draft_expires_at", now)
  .order("draft_expires_at", { ascending: true })
  .limit(batchSize);

if (error) throw new Error("Unable to load expired Drafts.");

for (const draft of drafts ?? []) {
  const media = Array.isArray(draft.submission_media)
    ? draft.submission_media[0]
    : draft.submission_media;
  const path = media?.original_path ?? `${draft.id}/original.webp`;
  const [folder, name] = path.split("/");
  const { data: objects, error: listError } = await client.storage
    .from("submission-originals")
    .list(folder, { search: name, limit: 2 });
  if (listError) {
    console.log(`${draft.id}\t${path}\tstorage-check-failed`);
    continue;
  }
  const objectExists = objects.some((object) => object.name === name);

  if (!execute) {
    console.log(`${draft.id}\t${path}\tdry-run:${objectExists ? "object-found" : "no-object"}`);
    continue;
  }

  if (objectExists) {
    const { error: removeError } = await client.storage
      .from("submission-originals")
      .remove([path]);
    if (removeError) {
      console.log(`${draft.id}\t${path}\tstorage-remove-failed`);
      continue;
    }
  }

  const { error: deleteError } = await client
    .from("submissions")
    .delete()
    .eq("id", draft.id)
    .eq("status", "draft")
    .lt("draft_expires_at", now);
  console.log(`${draft.id}\t${path}\t${deleteError ? "database-delete-failed" : "deleted"}`);
}

console.log(`${execute ? "Executed" : "Dry run"}: ${(drafts ?? []).length} expired Draft(s) inspected.`);
