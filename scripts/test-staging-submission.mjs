import { createHash, randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

function requireEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

if (process.env.SUPABASE_TARGET_ENVIRONMENT !== "staging") {
  throw new Error(
    "Refusing to run unless SUPABASE_TARGET_ENVIRONMENT=staging is set explicitly.",
  );
}

const siteUrl = new URL(requireEnvironment("NEXT_PUBLIC_SITE_URL"));
const supabaseUrl = new URL(requireEnvironment("NEXT_PUBLIC_SUPABASE_URL"));
const publishableKey = requireEnvironment("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secretKey = requireEnvironment("SUPABASE_SECRET_KEY");

if (!supabaseUrl.hostname.endsWith(".supabase.co")) {
  throw new Error("The staging smoke test requires a hosted Supabase project URL.");
}

const service = createClient(supabaseUrl.toString(), secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const publicClient = createClient(supabaseUrl.toString(), publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const requestToken = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(requestToken).digest("hex");
const testEmail = `section3-smoke-${Date.now()}@example.invalid`;
const image = await sharp({
  create: {
    width: 96,
    height: 96,
    channels: 3,
    background: { r: 42, g: 85, b: 65 },
  },
}).jpeg({ quality: 82 }).toBuffer();

let submissionId = null;
let storagePath = null;
let originalOpenState = null;
let cleanupProblem = null;

async function post(path, body) {
  const response = await fetch(new URL(path, siteUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: siteUrl.origin,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${path} failed with HTTP ${response.status}.`);
  }
  return result;
}

try {
  const { data: settings, error: settingsError } = await service
    .from("campaign_settings")
    .select("submissions_open")
    .eq("id", 1)
    .single();
  if (settingsError || !settings) throw new Error("Could not read staging campaign settings.");
  originalOpenState = settings.submissions_open;

  const { data: countBefore, error: countBeforeError } = await service.rpc(
    "current_published_count",
  );
  if (countBeforeError) throw new Error("Could not read the staging campaign count.");

  const { error: openError } = await service
    .from("campaign_settings")
    .update({ submissions_open: true })
    .eq("id", 1);
  if (openError) throw new Error("Could not temporarily open staging submissions.");

  const reservation = await post("/api/submissions/prepare", {
    displayName: "Section 3 smoke test",
    email: testEmail,
    publicationConsent: true,
    termsAccepted: true,
    requestToken,
    preparedExtension: "jpg",
  });
  if (
    typeof reservation?.submissionId !== "string" ||
    reservation?.status !== "draft" ||
    reservation?.uploadRequired !== true ||
    reservation?.upload?.bucket !== "submission-originals"
  ) {
    throw new Error("Prepare returned an unsafe or incomplete upload descriptor.");
  }
  submissionId = reservation.submissionId;
  storagePath = reservation.upload.path;

  const { error: markTestError } = await service
    .from("submissions")
    .update({ is_test: true })
    .eq("id", submissionId)
    .eq("public_request_token_hash", tokenHash);
  if (markTestError) throw new Error("Could not mark the staging record as test data.");

  const file = new File([image], "submission.jpg", { type: "image/jpeg" });
  const { error: uploadError } = await publicClient.storage
    .from(reservation.upload.bucket)
    .uploadToSignedUrl(storagePath, reservation.upload.token, file, {
      contentType: "image/jpeg",
      cacheControl: "3600",
    });
  if (uploadError) throw new Error("The signed staging upload failed.");

  const finalized = await post("/api/submissions/finalize", {
    submissionId,
    requestToken,
  });
  if (finalized?.success !== true || finalized?.status !== "pending_review") {
    throw new Error("Finalise did not return Pending Review.");
  }

  const { data: submission, error: submissionError } = await service
    .from("submissions")
    .select("status,guardian_number,is_test")
    .eq("id", submissionId)
    .single();
  if (
    submissionError ||
    submission?.status !== "pending_review" ||
    submission.guardian_number !== null ||
    submission.is_test !== true
  ) {
    throw new Error("The finalized staging record violated the Section 3 contract.");
  }

  const [folder, objectName] = storagePath.split("/");
  const { data: objects, error: listError } = await service.storage
    .from("submission-originals")
    .list(folder, { search: objectName, limit: 2 });
  if (listError || !objects.some((object) => object.name === objectName)) {
    throw new Error("The private staging object could not be confirmed.");
  }
  const { data: bucket, error: bucketError } = await service.storage.getBucket(
    "submission-originals",
  );
  if (bucketError || bucket?.public !== false) {
    throw new Error("The submission-originals bucket is not confirmed private.");
  }

  const { data: countAfter, error: countAfterError } = await service.rpc(
    "current_published_count",
  );
  if (countAfterError || countAfter !== countBefore) {
    throw new Error("The public campaign count changed during the smoke test.");
  }

  console.log(`${submissionId}\t${storagePath}\tpending-review-verified`);
} finally {
  if (storagePath) {
    const { error } = await service.storage.from("submission-originals").remove([storagePath]);
    if (error) cleanupProblem = "storage-cleanup-failed";
  }
  if (submissionId) {
    const { error } = await service
      .from("submissions")
      .delete()
      .eq("id", submissionId)
      .eq("is_test", true);
    if (error) cleanupProblem ??= "database-cleanup-failed";
  }
  if (typeof originalOpenState === "boolean") {
    const { error: restoreError } = await service
      .from("campaign_settings")
      .update({ submissions_open: originalOpenState })
      .eq("id", 1);
    if (restoreError) cleanupProblem ??= "campaign-state-restore-failed";
  }

  console.log(
    `${submissionId ?? "not-created"}\t${storagePath ?? "no-object"}\t${cleanupProblem ?? "cleanup-complete"}`,
  );
  if (cleanupProblem) throw new Error(cleanupProblem);
}
