export const STAGING_PROJECT_REF = "oroaheeamreebbohexoc";
export const SEED_VERSION = "vriksha-staging-demo-v1";
export const CONSENT_VERSION = "staging-2026-08-v1";
export const ORIGINAL_BUCKET = "submission-originals";
export const PUBLISHED_BUCKET = "published-images";

export const DEMO_STAFF = Object.freeze([
  Object.freeze({
    email: "demo-reviewer@example.com",
    displayName: "Demo Dataset Reviewer",
    role: "reviewer",
  }),
  Object.freeze({
    email: "demo-admin@example.com",
    displayName: "Demo Dataset Admin",
    role: "admin",
  }),
]);

const names = [
  "Demo Aarya Shah",
  "Demo Kabir Mehta",
  "Demo Ananya Rao",
  "Demo Vihaan Desai",
  "Demo Meera Iyer",
  "Demo Arjun Kulkarni",
  "Demo Sara Khan",
  "Demo Rohan Nair",
  "Demo Ishita Joshi",
  "Demo Dev Malhotra",
  "Demo Tara Menon",
  "Demo Aarav Patil",
  "Demo Nisha Verma",
  "Demo Rehan Sheikh",
  "Demo Kavya Bhat",
  "Demo Aditya Sen",
  "Demo Priya Kapoor",
  "Demo Neil Fernandes",
];

const dimensions = [
  [640, 800],
  [800, 640],
  [1000, 1000],
  [1200, 1600],
  [1600, 1200],
  [720, 960],
  [960, 720],
  [900, 900],
  [768, 1024],
  [1024, 768],
  [640, 800],
  [800, 640],
  [1000, 1000],
  [1200, 1600],
  [1600, 1200],
];

const rejectionComments = [
  "The submitted photograph is too blurred to use clearly in the campaign.",
  "The photograph does not clearly show the campaign participation and needs to be replaced.",
  "The uploaded image appears incomplete or incorrectly cropped for publication.",
  "We could not verify that this photograph is suitable for public campaign use.",
];

const statuses = [
  ...Array(8).fill("pending_review"),
  ...Array(4).fill("rejection_pending_admin"),
  ...Array(3).fill("rejected"),
  ...Array(3).fill("draft"),
];

const agesInMinutes = [
  5,
  30,
  120,
  480,
  1440,
  2880,
  5760,
  10080,
  180,
  1080,
  4320,
  8640,
  2160,
  7200,
  12000,
  15,
  60,
  2880,
];

export const DEMO_RECORDS = Object.freeze(
  names.map((displayName, index) => {
    const status = statuses[index];
    const dimensionsForImage = index < dimensions.length ? dimensions[index] : null;
    return Object.freeze({
      id: `d3000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      index: index + 1,
      displayName,
      email: `demo-vriksha-${String(index + 1).padStart(3, "0")}@example.com`,
      status,
      ageMinutes: agesInMinutes[index],
      focalX: Number((0.25 + (index % 4) * 0.16).toFixed(2)),
      focalY: Number((0.3 + (index % 3) * 0.18).toFixed(2)),
      image: dimensionsForImage
        ? Object.freeze({ width: dimensionsForImage[0], height: dimensionsForImage[1] })
        : null,
      rejectionComment:
        status === "rejection_pending_admin"
          ? rejectionComments[index - 8]
          : status === "rejected"
            ? rejectionComments[(index - 12) % rejectionComments.length]
            : null,
      draftExpiryOffsetMinutes:
        status !== "draft" ? null : index === 15 ? 720 : index === 16 ? -60 : -2880,
    });
  }),
);

export const DEMO_IDS = Object.freeze(DEMO_RECORDS.map((record) => record.id));
export const EXPECTED_DISTRIBUTION = Object.freeze({
  draft: 3,
  pending_review: 8,
  rejection_pending_admin: 4,
  rejected: 3,
  published: 0,
});
export const SYNTHETIC_IMAGE_COUNT = DEMO_RECORDS.filter((record) => record.image).length;

export const CLEANUP_ORDER = Object.freeze([
  "published-storage",
  "private-storage",
  "certificate-storage",
  "audit-logs",
  "database-submissions",
  "temporary-auth-users",
  "verification",
]);

export function parseDemoFlags(argv) {
  const allowed = new Set(["--execute", "--include-published"]);
  const unknown = argv.filter((argument) => argument.startsWith("--") && !allowed.has(argument));
  if (unknown.length) throw new Error(`Unknown option: ${unknown.join(", ")}`);
  return {
    execute: argv.includes("--execute"),
    includePublished: argv.includes("--include-published"),
  };
}

export function assertStagingEnvironment(environment) {
  if (environment.SUPABASE_TARGET_ENVIRONMENT !== "staging") {
    throw new Error("Refusing to run outside the staging environment.");
  }
  let url;
  try {
    url = new URL(environment.NEXT_PUBLIC_SUPABASE_URL ?? "");
  } catch {
    throw new Error("A valid hosted staging Supabase URL is required.");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== `${STAGING_PROJECT_REF}.supabase.co` ||
    /prod/i.test(`${environment.SUPABASE_TARGET_ENVIRONMENT} ${url.hostname}`)
  ) {
    throw new Error("Refusing to run against an unapproved Supabase project.");
  }
  return { projectRef: STAGING_PROJECT_REF, hostname: url.hostname };
}

export function distributionFor(rows) {
  const distribution = {
    draft: 0,
    pending_review: 0,
    rejection_pending_admin: 0,
    rejected: 0,
    published: 0,
  };
  for (const row of rows) {
    if (Object.hasOwn(distribution, row.status)) distribution[row.status] += 1;
  }
  return distribution;
}

export function isExpectedDemoSubmission(row) {
  const expected = DEMO_RECORDS.find((record) => record.id === row.id);
  return Boolean(
    expected &&
      row.display_name === expected.displayName &&
      row.source === "internal_test" &&
      row.is_test === true &&
      row.counts_toward_goal === false,
  );
}

export function selectCleanupCandidates(rows) {
  const safe = [];
  const ambiguous = [];
  for (const row of rows) {
    (isExpectedDemoSubmission(row) ? safe : ambiguous).push(row);
  }
  return { safe, ambiguous };
}

export function seedPlan(rows) {
  const { safe, ambiguous } = selectCleanupCandidates(rows);
  if (ambiguous.length) return { action: "refuse", safe, ambiguous };
  const distribution = distributionFor(safe);
  const complete =
    safe.length === DEMO_RECORDS.length &&
    Object.entries(EXPECTED_DISTRIBUTION).every(
      ([status, count]) => distribution[status] === count,
    );
  return { action: complete ? "no-op" : safe.length ? "rebuild" : "create", safe, ambiguous };
}

export function cleanupPlan(rows, includePublished = false) {
  const { safe, ambiguous } = selectCleanupCandidates(rows);
  const hasPublished = safe.some(
    (row) =>
      row.status === "published" ||
      Boolean(row.submission_media?.published_card_path) ||
      Boolean(row.submission_media?.published_full_path),
  );
  if (hasPublished && !includePublished) {
    return { action: "refuse-published", safe, ambiguous, hasPublished };
  }
  return {
    action: safe.length ? "delete" : "no-op",
    safe,
    ambiguous,
    hasPublished,
  };
}

export function assertCountInvariant(baseline, current, expectedDelta = 0) {
  if (!Number.isSafeInteger(baseline) || !Number.isSafeInteger(current)) {
    throw new Error("Campaign count verification returned an invalid value.");
  }
  if (current !== baseline + expectedDelta) {
    throw new Error(
      `Campaign count invariant failed: expected ${baseline + expectedDelta}, received ${current}.`,
    );
  }
}

export function describeSeedPlan({ existingCount = 0, includePublished = false } = {}) {
  const distribution = Object.entries(EXPECTED_DISTRIBUTION)
    .map(([status, count]) => `${status}=${count}`)
    .join(", ");
  return [
    `Dataset=${SEED_VERSION}`,
    `existing=${existingCount}`,
    `target=${DEMO_RECORDS.length}`,
    `images=${SYNTHETIC_IMAGE_COUNT}`,
    `distribution: ${distribution}`,
    `published=${includePublished ? "explicitly-requested" : "disabled"}`,
    "contacts=reserved-example-addresses (values hidden)",
    "credentials=generated-in-memory (values hidden)",
  ].join("\n");
}

export function matchesDemoStaff(user, profile, descriptor) {
  return Boolean(
    user?.email?.toLowerCase() === descriptor.email &&
      user?.app_metadata?.staging_demo_dataset === SEED_VERSION &&
      profile?.id === user.id &&
      profile?.display_name === descriptor.displayName &&
      profile?.role === descriptor.role &&
      profile?.active === true,
  );
}
