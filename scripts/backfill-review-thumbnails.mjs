import sharp from "sharp";

import {
  assertReviewThumbnailStagingEnvironment,
  parseBackfillFlags,
  REVIEW_THUMBNAIL,
  reviewThumbnailPath,
  summarizeBytes,
} from "./review-thumbnail-backfill-core.mjs";
import {
  createStagingClients,
  getPublicCount,
  loadLocalEnvironment,
  must,
  storageObjectExists,
} from "./staging-demo-data-remote.mjs";

const flags = parseBackfillFlags(process.argv.slice(2));
const environment = loadLocalEnvironment();
const target = assertReviewThumbnailStagingEnvironment(process.env);
const { service } = createStagingClients();

async function generateThumbnail(original) {
  const options = {
    failOn: "warning",
    limitInputPixels: 2560 ** 2,
    limitInputChannels: 4,
    unlimited: false,
    pages: 1,
  };
  const metadata = await sharp(original, options).metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    Math.max(metadata.width, metadata.height) > 2560 ||
    (metadata.pages ?? 1) !== 1 ||
    (metadata.pageHeight !== undefined && metadata.pageHeight !== metadata.height)
  ) {
    throw new Error("unsafe_source");
  }
  const { data, info } = await sharp(original, options)
    .rotate()
    .resize(REVIEW_THUMBNAIL.width, REVIEW_THUMBNAIL.height, { fit: "cover", position: "centre" })
    .webp({ quality: REVIEW_THUMBNAIL.quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  if (
    info.format !== "webp" ||
    info.width !== REVIEW_THUMBNAIL.width ||
    info.height !== REVIEW_THUMBNAIL.height ||
    data.byteLength < 1 ||
    data.byteLength > REVIEW_THUMBNAIL.maximumBytes
  ) {
    throw new Error("thumbnail_budget_exceeded");
  }
  return data;
}

async function validateExistingThumbnail(path) {
  const blob = await must(
    service.storage.from(REVIEW_THUMBNAIL.bucket).download(path),
    "Unable to download an interrupted review-thumbnail upload.",
  );
  const data = Buffer.from(await blob.arrayBuffer());
  const metadata = await sharp(data, { failOn: "warning", pages: 1 }).metadata();
  if (
    metadata.format !== "webp" ||
    metadata.width !== REVIEW_THUMBNAIL.width ||
    metadata.height !== REVIEW_THUMBNAIL.height ||
    data.byteLength < 1 ||
    data.byteLength > REVIEW_THUMBNAIL.maximumBytes
  ) {
    throw new Error("invalid_existing_thumbnail");
  }
  return data;
}

async function invariantSnapshot(ids) {
  const [publicCount, submissions, deliveries, certificates] = await Promise.all([
    getPublicCount(service),
    must(service.from("submissions").select("id,status").in("id", ids).order("id"), "Unable to snapshot submission statuses."),
    must(service.from("email_deliveries").select("id,submission_id,status,attempt_count,provider_message_id,sent_at").in("submission_id", ids).order("id"), "Unable to snapshot email placeholders."),
    must(service.from("certificates").select("id,submission_id,status,object_path").in("submission_id", ids).order("id"), "Unable to snapshot certificates."),
  ]);
  return JSON.stringify({ publicCount, submissions, deliveries, certificates });
}

const [candidates, completeCountResult] = await Promise.all([
  must(
    service
      .from("submission_media")
      .select("submission_id,status,original_path,review_thumbnail_path,review_thumbnail_width,review_thumbnail_height,review_thumbnail_bytes,review_thumbnail_generated_at")
      .in("status", ["uploaded", "published"])
      .is("review_thumbnail_path", null)
      .order("created_at", { ascending: true })
      .limit(flags.batchSize),
    "Unable to inspect private media metadata.",
  ),
  service
    .from("submission_media")
    .select("submission_id", { count: "exact", head: true })
    .in("status", ["uploaded", "published"])
    .not("review_thumbnail_path", "is", null),
]);
if (completeCountResult.error) throw new Error("Unable to count complete private review thumbnails.");
const alreadyComplete = completeCountResult.count ?? 0;
const planned = [];
let missingOriginals = 0;
for (const row of candidates) {
  if (await storageObjectExists(service, REVIEW_THUMBNAIL.bucket, row.original_path)) planned.push(row);
  else missingOriginals += 1;
}

console.log(`${flags.execute ? "EXECUTE" : "DRY RUN"}: private review-thumbnail backfill`);
console.log(`Project: ${environment.projectRef || target.projectRef} (staging-only allowlist)`);
console.log(`batch_size=${flags.batchSize}`);
console.log(`eligible=${candidates.length}`);
console.log(`already_complete=${alreadyComplete}`);
console.log(`missing_originals=${missingOriginals}`);
console.log(`planned=${planned.length}`);

if (!flags.execute) {
  console.log("No database row, Storage object, submission status, email, or certificate was changed.");
  console.log("Run `npm run staging:backfill-review-thumbnails -- --execute` to apply this bounded plan.");
  process.exit(0);
}

const ids = candidates.map((row) => row.submission_id);
if (!ids.length) {
  console.log("generated=0");
  console.log("recovered_existing=0");
  console.log("failed=0");
  console.log("No incomplete review thumbnails remain in this bounded batch.");
  process.exit(0);
}
const before = await invariantSnapshot(ids);
const generatedBytes = [];
let generated = 0;
let recovered = 0;
let failed = 0;

for (const row of planned) {
  const path = reviewThumbnailPath(row.submission_id);
  try {
    let thumbnail;
    if (await storageObjectExists(service, REVIEW_THUMBNAIL.bucket, path)) {
      thumbnail = await validateExistingThumbnail(path);
      recovered += 1;
    } else {
      const sourceBlob = await must(
        service.storage.from(REVIEW_THUMBNAIL.bucket).download(row.original_path),
        "Unable to download a private original.",
      );
      thumbnail = await generateThumbnail(Buffer.from(await sourceBlob.arrayBuffer()));
      await must(
        service.storage.from(REVIEW_THUMBNAIL.bucket).upload(path, thumbnail, {
          contentType: "image/webp",
          cacheControl: "600",
          upsert: false,
        }),
        "Unable to upload a private review thumbnail.",
      );
      generated += 1;
    }

    const updated = await must(
      service
        .from("submission_media")
        .update({
          review_thumbnail_path: path,
          review_thumbnail_width: REVIEW_THUMBNAIL.width,
          review_thumbnail_height: REVIEW_THUMBNAIL.height,
          review_thumbnail_bytes: thumbnail.byteLength,
          review_thumbnail_generated_at: new Date().toISOString(),
        })
        .eq("submission_id", row.submission_id)
        .is("review_thumbnail_path", null)
        .select("submission_id"),
      "Unable to store private review-thumbnail metadata.",
    );
    if (updated.length !== 1) throw new Error("concurrent_metadata_change");
    generatedBytes.push(thumbnail.byteLength);
  } catch {
    failed += 1;
    console.error(`thumbnail_failed submission_id=${row.submission_id}`);
  }
}

const after = await invariantSnapshot(ids);
if (before !== after) throw new Error("Backfill changed a protected submission, count, email, or certificate invariant.");

const summary = summarizeBytes(generatedBytes);
console.log(`generated=${generated}`);
console.log(`recovered_existing=${recovered}`);
console.log(`failed=${failed}`);
console.log(`thumbnail_average_bytes=${summary.average}`);
console.log(`thumbnail_median_bytes=${summary.median}`);
console.log(`thumbnail_largest_bytes=${summary.largest}`);
console.log(`thumbnail_total_bytes=${summary.total}`);
console.log("Protected invariants unchanged: submission statuses, campaign count, email placeholders, certificates.");
if (failed) process.exitCode = 1;
