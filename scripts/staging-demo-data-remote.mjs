import { createHash, randomBytes } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import {
  CLEANUP_ORDER,
  CONSENT_VERSION,
  DEMO_IDS,
  DEMO_RECORDS,
  DEMO_STAFF,
  ORIGINAL_BUCKET,
  PUBLISHED_BUCKET,
  SEED_VERSION,
  assertCountInvariant,
  assertStagingEnvironment,
  distributionFor,
  matchesDemoStaff,
  selectCleanupCandidates,
} from "./staging-demo-data-core.mjs";

export function loadLocalEnvironment() {
  try {
    process.loadEnvFile?.(".env.local");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return assertStagingEnvironment(process.env);
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export function createStagingClients() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const secretKey = required("SUPABASE_SECRET_KEY");
  return {
    url,
    publishableKey,
    service: createClient(url, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export async function must(promise, message) {
  const result = await promise;
  if (result.error) {
    throw new Error(
      `${message} [${result.error.code ?? "remote_error"}] ${result.error.message ?? "Remote operation failed."}`,
    );
  }
  return result.data;
}

function firstRelation(value) {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function getPublicCount(service) {
  const summary = await must(
    service.rpc("get_public_campaign_summary"),
    "Unable to read the public campaign count.",
  );
  const count = Number(summary?.[0]?.current_count);
  if (!Number.isSafeInteger(count)) throw new Error("The public campaign count is invalid.");
  return count;
}

export async function loadDemoRows(service) {
  const rows = await must(
    service
      .from("submissions")
      .select(
        "id,status,source,display_name,is_test,counts_toward_goal,submission_media(original_path,review_thumbnail_path,review_thumbnail_width,review_thumbnail_height,review_thumbnail_bytes,review_thumbnail_generated_at,published_card_path,published_full_path),certificates(bucket,object_path,status),email_deliveries(kind,status,attempt_count,provider_message_id,sent_at)",
      )
      .in("id", DEMO_IDS),
    "Unable to inspect bounded demo submissions.",
  );
  return (rows ?? []).map((row) => ({
    ...row,
    submission_media: firstRelation(row.submission_media),
    certificates: firstRelation(row.certificates),
    email_deliveries: Array.isArray(row.email_deliveries)
      ? row.email_deliveries
      : row.email_deliveries
        ? [row.email_deliveries]
        : [],
  }));
}

async function listAllAuthUsers(service) {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const data = await must(
      service.auth.admin.listUsers({ page, perPage: 100 }),
      "Unable to inspect staging Auth users.",
    );
    users.push(...data.users);
    if (data.users.length < 100) return users;
  }
  throw new Error("Auth user inspection exceeded the bounded page limit.");
}

export async function inspectDemoStaff(service) {
  const [users, profiles] = await Promise.all([
    listAllAuthUsers(service),
    must(service.from("staff_profiles").select("id,display_name,role,active"), "Unable to inspect staff profiles."),
  ]);
  const records = DEMO_STAFF.map((descriptor) => {
    const user = users.find((candidate) => candidate.email?.toLowerCase() === descriptor.email);
    const profile = user ? profiles.find((candidate) => candidate.id === user.id) : null;
    return { descriptor, user: user ?? null, profile: profile ?? null };
  });
  const ambiguousProfiles = profiles.filter((profile) =>
    DEMO_STAFF.some(
      (descriptor) =>
        descriptor.displayName === profile.display_name &&
        !records.some((record) => record.profile?.id === profile.id),
    ),
  );
  const ambiguous = records.filter(
    ({ descriptor, user, profile }) =>
      (user || profile) && !matchesDemoStaff(user, profile, descriptor),
  );
  if (ambiguousProfiles.length) ambiguous.push(...ambiguousProfiles.map((profile) => ({ profile })));
  return {
    records,
    safe: records.filter(({ descriptor, user, profile }) => matchesDemoStaff(user, profile, descriptor)),
    ambiguous,
  };
}

export async function storageObjectExists(service, bucket, path) {
  const slash = path.lastIndexOf("/");
  const folder = slash === -1 ? "" : path.slice(0, slash);
  const name = slash === -1 ? path : path.slice(slash + 1);
  const objects = await must(
    service.storage.from(bucket).list(folder, { search: name, limit: 2 }),
    `Unable to inspect ${bucket} Storage.`,
  );
  return objects.some((object) => object.name === name);
}

export async function countExistingPrivateImages(service, rows) {
  let count = 0;
  for (const row of rows) {
    for (const path of [row.submission_media?.original_path, row.submission_media?.review_thumbnail_path]) {
      if (path && (await storageObjectExists(service, ORIGINAL_BUCKET, path))) count += 1;
    }
  }
  return count;
}

function validateOriginalPath(row, path) {
  return path === `${row.id}/original.webp`;
}

function validateReviewThumbnailPath(row, path) {
  return path === `${row.id}/review-thumb.webp`;
}

function validatePublicPath(path) {
  return typeof path === "string" && /^(card|full)\/[1-9][0-9]*-[a-zA-Z0-9][a-zA-Z0-9_-]*\.webp$/.test(path);
}

export async function removeDemoDataset(
  service,
  { rows, staffRecords, includePublished = false, verifyCountFrom },
) {
  const { safe, ambiguous } = selectCleanupCandidates(rows);
  if (ambiguous.length) throw new Error("Cleanup refused an ambiguous submission record.");

  const privateFiles = [];
  const published = [];
  const certificates = [];
  for (const row of safe) {
    const media = row.submission_media;
    if (media?.original_path) {
      if (!validateOriginalPath(row, media.original_path)) {
        throw new Error("Cleanup refused an unexpected private Storage path.");
      }
      privateFiles.push(media.original_path);
    }
    if (media?.review_thumbnail_path) {
      if (!validateReviewThumbnailPath(row, media.review_thumbnail_path)) {
        throw new Error("Cleanup refused an unexpected private review-thumbnail path.");
      }
      privateFiles.push(media.review_thumbnail_path);
    }
    for (const path of [media?.published_card_path, media?.published_full_path]) {
      if (!path) continue;
      if (!includePublished) throw new Error("Published cleanup requires --include-published.");
      if (!validatePublicPath(path)) throw new Error("Cleanup refused an unexpected public Storage path.");
      published.push(path);
    }
    const certificate = row.certificates;
    if (certificate?.object_path) {
      if (certificate.bucket !== "certificates") {
        throw new Error("Cleanup refused an unexpected certificate bucket.");
      }
      certificates.push(certificate.object_path);
    }
  }

  if (published.length) {
    await must(
      service.storage.from(PUBLISHED_BUCKET).remove(published),
      "Unable to remove bounded public demo images.",
    );
  }
  if (privateFiles.length) {
    await must(
      service.storage.from(ORIGINAL_BUCKET).remove(privateFiles),
      "Unable to remove bounded private demo images.",
    );
  }
  if (certificates.length) {
    await must(
      service.storage.from("certificates").remove(certificates),
      "Unable to remove bounded demo certificate files.",
    );
  }
  if (safe.length) {
    const ids = safe.map((row) => row.id);
    await must(
      service.from("audit_logs").delete().in("entity_id", ids).eq("entity_type", "submission"),
      "Unable to remove bounded demo audit rows.",
    );
    await must(
      service.from("submissions").delete().in("id", ids),
      "Unable to remove bounded demo submissions.",
    );
  }
  for (const record of staffRecords) {
    if (!matchesDemoStaff(record.user, record.profile, record.descriptor)) {
      throw new Error("Cleanup refused an ambiguous temporary staff account.");
    }
    await must(
      service.auth.admin.deleteUser(record.user.id),
      "Unable to remove a bounded temporary Auth user.",
    );
  }

  const [remaining, remainingStaff] = await Promise.all([
    loadDemoRows(service),
    inspectDemoStaff(service),
  ]);
  if (remaining.length) throw new Error("Demo submission cleanup verification failed.");
  if (remainingStaff.safe.length || remainingStaff.ambiguous.length) {
    throw new Error("Temporary staff cleanup verification failed.");
  }
  for (const path of privateFiles) {
    if (await storageObjectExists(service, ORIGINAL_BUCKET, path)) {
      throw new Error("Private Storage cleanup verification failed.");
    }
  }
  for (const path of published) {
    if (await storageObjectExists(service, PUBLISHED_BUCKET, path)) {
      throw new Error("Public Storage cleanup verification failed.");
    }
  }
  if (Number.isSafeInteger(verifyCountFrom)) {
    assertCountInvariant(verifyCountFrom, await getPublicCount(service));
  }
  return {
    removedSubmissions: safe.length,
    removedPrivateFiles: privateFiles.length,
    removedPublicFiles: published.length,
    removedCertificateFiles: certificates.length,
    removedStaff: staffRecords.length,
    cleanupOrder: CLEANUP_ORDER,
  };
}

export async function generateSyntheticImage(record) {
  if (!record.image) throw new Error("Draft records do not have generated images.");
  const { width, height } = record.image;
  const pixels = Buffer.allocUnsafe(width * height * 3);
  const seed = record.index * 17;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 3;
      const wave = (x * 7 + y * 5 + seed * 11) % 53;
      pixels[offset] = 24 + ((x + seed) % 46);
      pixels[offset + 1] = 86 + ((y + wave) % 92);
      pixels[offset + 2] = 48 + ((x + y + wave) % 58);
    }
  }
  const label = `VRIKSHA TEST ${String(record.index).padStart(2, "0")}`;
  const orientation = width === height ? "SQUARE" : width < height ? "PORTRAIT" : "LANDSCAPE";
  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.1)}" width="${Math.round(width * 0.84)}" height="${Math.round(height * 0.8)}" rx="36" fill="none" stroke="#f5edda" stroke-width="12" opacity="0.9"/>
      <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.37)}" r="${Math.round(Math.min(width, height) * 0.16)}" fill="#d8b95d" opacity="0.84"/>
      <path d="M ${Math.round(width * 0.5)} ${Math.round(height * 0.58)} C ${Math.round(width * 0.32)} ${Math.round(height * 0.46)}, ${Math.round(width * 0.3)} ${Math.round(height * 0.3)}, ${Math.round(width * 0.48)} ${Math.round(height * 0.26)} C ${Math.round(width * 0.69)} ${Math.round(height * 0.3)}, ${Math.round(width * 0.68)} ${Math.round(height * 0.48)}, ${Math.round(width * 0.5)} ${Math.round(height * 0.58)} Z" fill="#173f32"/>
      <rect x="${Math.round(width * 0.485)}" y="${Math.round(height * 0.48)}" width="${Math.max(12, Math.round(width * 0.03))}" height="${Math.round(height * 0.2)}" fill="#173f32"/>
      <text x="50%" y="78%" text-anchor="middle" fill="#fff9ed" font-family="Arial, sans-serif" font-size="${Math.max(28, Math.round(width * 0.055))}" font-weight="700">${label}</text>
      <text x="50%" y="85%" text-anchor="middle" fill="#fff9ed" font-family="Arial, sans-serif" font-size="${Math.max(18, Math.round(width * 0.03))}" letter-spacing="4">${orientation}</text>
    </svg>
  `);
  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .composite([{ input: overlay }])
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
}

async function createTemporaryStaff(service, url, publishableKey) {
  const password = `${randomBytes(28).toString("base64url")}Aa1!`;
  const created = [];
  const clients = {};
  for (const descriptor of DEMO_STAFF) {
    const data = await must(
      service.auth.admin.createUser({
        email: descriptor.email,
        password,
        email_confirm: true,
        app_metadata: { staging_demo_dataset: SEED_VERSION },
      }),
      "Unable to create a bounded temporary staging Auth user.",
    );
    const user = data.user;
    const profile = await must(
      service
        .from("staff_profiles")
        .insert({
          id: user.id,
          display_name: descriptor.displayName,
          role: descriptor.role,
          active: true,
        })
        .select("id,display_name,role,active")
        .single(),
      "Unable to create a bounded temporary staff profile.",
    );
    const client = createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await must(
      client.auth.signInWithPassword({ email: descriptor.email, password }),
      "Unable to authenticate a bounded temporary staff user.",
    );
    created.push({ descriptor, user, profile });
    clients[descriptor.role] = client;
  }
  return { records: created, clients };
}

function dateBefore(now, minutes) {
  return new Date(now.getTime() - minutes * 60_000).toISOString();
}

async function insertDraftFoundation(service, record, now) {
  const createdAt = dateBefore(now, record.ageMinutes);
  const expiresAt =
    record.status === "draft"
      ? new Date(now.getTime() + record.draftExpiryOffsetMinutes * 60_000).toISOString()
      : new Date(now.getTime() + 12 * 60 * 60_000).toISOString();
  const tokenHash = createHash("sha256").update(`${SEED_VERSION}:${record.id}`).digest("hex");
  await must(
    service.from("submissions").insert({
      id: record.id,
      status: "draft",
      source: "internal_test",
      display_name: record.displayName,
      is_test: true,
      counts_toward_goal: false,
      draft_expires_at: expiresAt,
      public_request_token_hash: tokenHash,
      created_at: createdAt,
      updated_at: createdAt,
    }),
    "Unable to create a bounded demo Draft.",
  );
  await must(
    service.from("submission_contacts").insert({
      submission_id: record.id,
      email: record.email,
      created_at: createdAt,
      updated_at: createdAt,
    }),
    "Unable to create a bounded demo contact.",
  );
  await must(
    service.from("submission_consents").insert({
      submission_id: record.id,
      consent_version: CONSENT_VERSION,
      publication_consent: true,
      terms_accepted: true,
      accepted_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt,
    }),
    "Unable to create bounded demo consent.",
  );
  await must(
    service.from("submission_media").insert({
      submission_id: record.id,
      status: "reserved",
      original_bucket: ORIGINAL_BUCKET,
      original_path: `${record.id}/original.webp`,
      original_extension: "webp",
      focal_x: record.focalX,
      focal_y: record.focalY,
      created_at: createdAt,
      updated_at: createdAt,
    }),
    "Unable to create bounded demo media metadata.",
  );
  return { createdAt, tokenHash };
}

async function createDemoSubmission(service, staffClients, record, now) {
  const foundation = await insertDraftFoundation(service, record, now);
  if (record.status === "draft") return;

  const image = await generateSyntheticImage(record);
  const path = `${record.id}/original.webp`;
  const reviewThumbnailPath = `${record.id}/review-thumb.webp`;
  const reviewThumbnail = await sharp(image, { failOn: "warning", pages: 1 })
    .rotate()
    .resize(240, 300, { fit: "cover", position: "centre" })
    .webp({ quality: 70, effort: 4 })
    .toBuffer();
  await must(
    service.storage.from(ORIGINAL_BUCKET).upload(path, image, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false,
    }),
    "Unable to upload a bounded private synthetic image.",
  );
  await must(
    service.storage.from(ORIGINAL_BUCKET).upload(reviewThumbnailPath, reviewThumbnail, {
      contentType: "image/webp",
      cacheControl: "600",
      upsert: false,
    }),
    "Unable to upload a bounded private synthetic review thumbnail.",
  );
  const checksum = createHash("sha256").update(image).digest("hex");
  const finalized = await service.rpc("finalize_public_submission_with_review_thumbnail", {
      p_submission_id: record.id,
      p_public_request_token_hash: foundation.tokenHash,
      p_verified_mime_type: "image/webp",
      p_verified_bytes: image.byteLength,
      p_verified_width: record.image.width,
      p_verified_height: record.image.height,
      p_verified_sha256: checksum,
      p_review_thumbnail_path: reviewThumbnailPath,
      p_review_thumbnail_width: 240,
      p_review_thumbnail_height: 300,
      p_review_thumbnail_bytes: reviewThumbnail.byteLength,
      p_review_thumbnail_generated_at: now.toISOString(),
    });
  if (finalized.error) {
    await service.storage.from(ORIGINAL_BUCKET).remove([reviewThumbnailPath]);
    throw new Error(`Unable to finalize a bounded demo submission. [${finalized.error.code ?? "remote_error"}]`);
  }
  const submittedAt = dateBefore(now, record.ageMinutes);
  await must(
    service
      .from("submissions")
      .update({ submitted_at: submittedAt, draft_expires_at: null, updated_at: submittedAt })
      .eq("id", record.id),
    "Unable to set bounded demo submission timing.",
  );
  await must(
    service
      .from("submission_media")
      .update({ uploaded_at: submittedAt, updated_at: submittedAt })
      .eq("submission_id", record.id),
    "Unable to set bounded demo media timing.",
  );

  if (record.status === "rejection_pending_admin") {
    await must(
      staffClients.reviewer.rpc("recommend_submission_rejection", {
        p_submission_id: record.id,
        p_comment: record.rejectionComment,
      }),
      "Unable to create a bounded rejection recommendation.",
    );
    await must(
      service
        .from("submissions")
        .update({
          rejection_recommended_at: new Date(new Date(submittedAt).getTime() + 30 * 60_000).toISOString(),
        })
        .eq("id", record.id),
      "Unable to set bounded recommendation timing.",
    );
  }
  if (record.status === "rejected") {
    await must(
      staffClients.admin.rpc("confirm_submission_rejection", {
        p_submission_id: record.id,
        p_comment: record.rejectionComment,
      }),
      "Unable to create a bounded final rejection.",
    );
    const rejectedAt = new Date(new Date(submittedAt).getTime() + 45 * 60_000).toISOString();
    await must(
      service
        .from("submissions")
        .update({ rejection_confirmed_at: rejectedAt, rejected_at: rejectedAt })
        .eq("id", record.id),
      "Unable to set bounded rejection timing.",
    );
  }
}

export async function createDemoDataset(service, url, publishableKey) {
  const temporaryStaff = await createTemporaryStaff(service, url, publishableKey);
  const now = new Date();
  for (const record of DEMO_RECORDS) {
    await createDemoSubmission(service, temporaryStaff.clients, record, now);
  }
  for (const client of Object.values(temporaryStaff.clients)) await client.auth.signOut();
  return temporaryStaff.records;
}

export async function verifyNormalDataset(service, baselineCount) {
  const rows = await loadDemoRows(service);
  const { safe, ambiguous } = selectCleanupCandidates(rows);
  if (ambiguous.length || safe.length !== DEMO_RECORDS.length) {
    throw new Error("Demo record marker verification failed.");
  }
  const distribution = distributionFor(safe);
  const expected = { draft: 3, pending_review: 8, rejection_pending_admin: 4, rejected: 3, published: 0 };
  for (const [status, count] of Object.entries(expected)) {
    if (distribution[status] !== count) throw new Error(`Unexpected ${status} demo distribution.`);
  }
  if (await countExistingPrivateImages(service, safe) !== 30) {
    throw new Error("Synthetic private image verification failed.");
  }
  const deliveries = safe.flatMap((row) => row.email_deliveries);
  if (
    deliveries.some(
      (delivery) =>
        delivery.status !== "not_started" ||
        delivery.attempt_count !== 0 ||
        delivery.provider_message_id ||
        delivery.sent_at,
    )
  ) {
    throw new Error("A demo email-delivery placeholder left the not_started state.");
  }
  if (safe.some((row) => row.certificates)) {
    throw new Error("A certificate record was unexpectedly created for the normal demo dataset.");
  }
  assertCountInvariant(baselineCount, await getPublicCount(service));
  return { rows: safe, distribution, deliveryCount: deliveries.length };
}
