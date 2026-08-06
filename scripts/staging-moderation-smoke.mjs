import { randomBytes, randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

if (process.env.SUPABASE_TARGET_ENVIRONMENT !== "staging" || !process.argv.includes("--execute")) {
  throw new Error("Refusing to run. Set SUPABASE_TARGET_ENVIRONMENT=staging and pass --execute.");
}
const required = (name) => { const result = process.env[name]?.trim(); if (!result) throw new Error(`${name} is required.`); return result; };
const url = required("NEXT_PUBLIC_SUPABASE_URL");
const key = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secret = required("SUPABASE_SECRET_KEY");
if (!url.endsWith(".supabase.co") || /prod/i.test(process.env.SUPABASE_TARGET_ENVIRONMENT ?? "")) throw new Error("Hosted staging only.");
const service = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = Date.now();
const users = [
  { role: "admin", email: `section4-admin-${stamp}@example.invalid`, name: "Section 4 Admin" },
  { role: "reviewer", email: `section4-reviewer-${stamp}@example.invalid`, name: "Section 4 Reviewer" },
];
const password = `${randomBytes(24).toString("base64url")}Aa1!`;
const authClients = {};
const submissionIds = [];
const storage = { originals: [], published: [] };
let countBefore;

async function must(promise, message) {
  const result = await promise;
  if (result.error) throw new Error(`${message} [${result.error.code ?? "unknown"}] ${result.error.message ?? "remote operation failed"}`);
  return result.data;
}
async function makePending(name) {
  const id = randomUUID();
  const path = `${id}/original.webp`;
  const image = await sharp({ create: { width: 900, height: 900, channels: 3, background: { r: 38, g: 86, b: 63 } } }).webp().toBuffer();
  await must(service.storage.from("submission-originals").upload(path, image, { contentType: "image/webp", upsert: false }), "Private original upload failed.");
  storage.originals.push(path); submissionIds.push(id);
  await must(service.from("submissions").insert({ id, status: "draft", source: "internal_test", display_name: name, is_test: false, counts_toward_goal: true, draft_expires_at: new Date(Date.now() + 3_600_000).toISOString() }), "Test draft insert failed.");
  await must(service.from("submission_consents").insert({ submission_id: id, consent_version: "section4-smoke", publication_consent: true, terms_accepted: true, accepted_at: new Date().toISOString() }), "Consent insert failed.");
  await must(service.from("submission_media").insert({ submission_id: id, status: "uploaded", original_path: path, original_extension: "webp", original_mime_type: "image/webp", original_bytes: image.byteLength, original_width: 900, original_height: 900, original_checksum_sha256: "a".repeat(64), uploaded_at: new Date().toISOString(), focal_x: .5, focal_y: .5 }), "Media insert failed.");
  await must(service.from("submissions").update({ status: "pending_review", submitted_at: new Date().toISOString(), draft_expires_at: null }).eq("id", id), "Test submission finalisation failed.");
  return { id, image };
}
async function variants(image, guardian, version) {
  const card = await sharp(image).resize(640,800,{ fit:"cover" }).webp({ quality:80 }).toBuffer();
  const full = await sharp(image).resize(1600,1600,{ fit:"inside", withoutEnlargement:true }).webp({ quality:84 }).toBuffer();
  const cardPath=`card/${guardian}-${version}.webp`, fullPath=`full/${guardian}-${version}.webp`;
  await must(service.storage.from("published-images").upload(cardPath,card,{contentType:"image/webp",cacheControl:"31536000",upsert:false}),"Card upload failed.");
  await must(service.storage.from("published-images").upload(fullPath,full,{contentType:"image/webp",cacheControl:"31536000",upsert:false}),"Full upload failed.");
  storage.published.push(cardPath,fullPath);
  return { card,full,cardPath,fullPath };
}

try {
  const summary = await must(publicClient.rpc("get_public_campaign_summary"), "Cannot read initial summary.");
  countBefore = Number(summary[0].current_count);
  for (const descriptor of users) {
    const created = await must(service.auth.admin.createUser({ email: descriptor.email, password, email_confirm: true }), "Temporary Auth user creation failed.");
    descriptor.id = created.user.id;
    await must(service.from("staff_profiles").insert({ id: descriptor.id, display_name: descriptor.name, role: descriptor.role, active: true }), "Temporary staff profile failed.");
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    await must(client.auth.signInWithPassword({ email: descriptor.email, password }), "Temporary staff sign-in failed.");
    authClients[descriptor.role] = client;
  }

  const first = await makePending("Section 4 publication smoke");
  await must(authClients.reviewer.rpc("recommend_submission_rejection", { p_submission_id:first.id, p_comment:"The Admin should verify this generated staging photograph." }), "Reviewer recommendation failed.");
  const guardian = await must(service.rpc("reserve_guardian_number_for_publication", { p_submission_id:first.id, p_actor_id:users[0].id }), "Guardian reservation failed.");
  const version = randomUUID(); const publicFiles = await variants(first.image,guardian,version);
  await must(authClients.admin.rpc("publish_submission", { p_submission_id:first.id,p_guardian_number:guardian,p_published_version:version,p_card_path:publicFiles.cardPath,p_card_width:640,p_card_height:800,p_card_bytes:publicFiles.card.byteLength,p_full_path:publicFiles.fullPath,p_full_width:900,p_full_height:900,p_full_bytes:publicFiles.full.byteLength,p_alt_text:"Generated staging moderation smoke tree" }), "Admin approval instead failed.");
  let after = await must(publicClient.rpc("get_public_campaign_summary"), "Summary after publish failed.");
  if (Number(after[0].current_count) !== countBefore + 1) throw new Error("Publish did not increase the count exactly once.");
  const movement = await must(publicClient.rpc("list_public_movement_entries", { p_limit:48 }), "Movement query failed.");
  if (!movement.some((entry) => Number(entry.guardian_number) === Number(guardian))) throw new Error("Published Guardian is missing from Movement.");
  const placeholders = await must(service.from("certificates").select("status,bucket,object_path").eq("submission_id",first.id).single(),"Certificate placeholder missing.");
  if (placeholders.status!=="not_started"||placeholders.object_path!==null) throw new Error("A certificate was unexpectedly generated.");
  const delivery = await must(service.from("email_deliveries").select("status,sent_at,provider_message_id").eq("submission_id",first.id).eq("kind","approval_certificate").single(),"Approval placeholder missing.");
  if(delivery.status!=="not_started"||delivery.sent_at||delivery.provider_message_id) throw new Error("An approval email was unexpectedly sent.");

  await must(authClients.admin.rpc("trash_submission",{p_submission_id:first.id}),"Trash failed.");
  after=await must(publicClient.rpc("get_public_campaign_summary"),"Summary after trash failed.");
  if(Number(after[0].current_count)!==countBefore) throw new Error("Trash did not decrease count.");
  await must(service.storage.from("published-images").remove([publicFiles.cardPath,publicFiles.fullPath]),"Trashed public cleanup failed.");
  const restoredVersion=randomUUID(); const restored=await variants(first.image,guardian,restoredVersion);
  await must(authClients.admin.rpc("restore_published_submission",{p_submission_id:first.id,p_published_version:restoredVersion,p_card_path:restored.cardPath,p_card_width:640,p_card_height:800,p_card_bytes:restored.card.byteLength,p_full_path:restored.fullPath,p_full_width:900,p_full_height:900,p_full_bytes:restored.full.byteLength}),"Published restore failed.");
  after=await must(publicClient.rpc("get_public_campaign_summary"),"Summary after restore failed.");
  if(Number(after[0].current_count)!==countBefore+1) throw new Error("Restore did not increase count.");

  const second=await makePending("Section 4 rejection smoke");
  await must(authClients.admin.rpc("confirm_submission_rejection",{p_submission_id:second.id,p_comment:"This generated record verifies the final rejection workflow."}),"Final rejection failed.");
  const rejection=await must(service.from("email_deliveries").select("status,sent_at").eq("submission_id",second.id).eq("kind","rejection").single(),"Rejection placeholder missing.");
  if(rejection.status!=="not_started"||rejection.sent_at) throw new Error("A rejection email was unexpectedly sent.");

  await must(authClients.admin.rpc("trash_submission",{p_submission_id:first.id}),"Second trash failed.");
  await must(service.storage.from("published-images").remove([restored.cardPath,restored.fullPath]),"Restored public cleanup failed.");
  await must(service.storage.from("submission-originals").remove([`${first.id}/original.webp`]),"Original cleanup before permanent delete failed.");
  await must(authClients.admin.rpc("delete_trashed_submission",{p_submission_id:first.id,p_reason:"Remove generated Section 4 staging smoke data."}),"Permanent delete failed.");
  submissionIds.splice(submissionIds.indexOf(first.id),1); storage.originals.splice(storage.originals.indexOf(`${first.id}/original.webp`),1);
  console.log("Section 4 staging moderation workflow verified; no certificate generated and no campaign email sent.");
} finally {
  if(storage.published.length) await service.storage.from("published-images").remove(storage.published);
  if(storage.originals.length) await service.storage.from("submission-originals").remove(storage.originals);
  if(submissionIds.length) await service.from("submissions").delete().in("id",submissionIds);
  for(const descriptor of users) if(descriptor.id) await service.auth.admin.deleteUser(descriptor.id);
  if(typeof countBefore==="number") { const summary=await publicClient.rpc("get_public_campaign_summary"); if(!summary.error&&Number(summary.data?.[0]?.current_count)!==countBefore) throw new Error("Cleanup did not restore the original count."); }
  console.log("Temporary staging users, records, and Storage objects cleaned up.");
}
