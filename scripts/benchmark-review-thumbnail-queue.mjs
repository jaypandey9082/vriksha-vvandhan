import { performance } from "node:perf_hooks";

import { assertReviewThumbnailStagingEnvironment, summarizeBytes } from "./review-thumbnail-backfill-core.mjs";
import { createStagingClients, loadLocalEnvironment, must } from "./staging-demo-data-remote.mjs";

loadLocalEnvironment();
assertReviewThumbnailStagingEnvironment(process.env);
const { service } = createStagingClients();

const queryStarted = performance.now();
const rows = await must(
  service
    .from("submission_media")
    .select("submission_id,original_bytes,review_thumbnail_path,review_thumbnail_bytes,submissions!inner(status)")
    .in("submissions.status", ["pending_review", "rejection_pending_admin", "rejected", "published"])
    .not("review_thumbnail_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(25),
  "Unable to read bounded review-thumbnail benchmark metadata.",
);
const queryMs = performance.now() - queryStarted;
const paths = [...new Set(rows.map((row) => row.review_thumbnail_path).filter(Boolean))];
const signingStarted = performance.now();
const signed = paths.length
  ? await service.storage.from("submission-originals").createSignedUrls(paths, 600)
  : { data: [], error: null };
const signingMs = performance.now() - signingStarted;
if (signed.error || signed.data?.some((item) => item.error)) {
  throw new Error("Bounded review-thumbnail batch signing failed.");
}

const originals = summarizeBytes(rows.map((row) => Number(row.original_bytes ?? 0)).filter(Boolean));
const thumbnails = summarizeBytes(rows.map((row) => Number(row.review_thumbnail_bytes ?? 0)).filter(Boolean));
console.log(JSON.stringify({
  target: "staging",
  rows: rows.length,
  queueMetadataQueryMs: Number(queryMs.toFixed(1)),
  signedUrlCalls: paths.length ? 1 : 0,
  signedThumbnailPaths: paths.length,
  batchSigningMs: Number(signingMs.toFixed(1)),
  originalBytes: { ...originals, theoretical25: originals.count ? Math.round(originals.average * 25) : 0 },
  reviewThumbnailBytes: { ...thumbnails, theoretical25: thumbnails.count ? Math.round(thumbnails.average * 25) : 0 },
}, null, 2));
