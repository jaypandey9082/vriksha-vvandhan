import {
  DEMO_RECORDS,
  EXPECTED_DISTRIBUTION,
  SEED_VERSION,
  SYNTHETIC_IMAGE_COUNT,
  describeSeedPlan,
  parseDemoFlags,
  seedPlan,
} from "./staging-demo-data-core.mjs";
import {
  createDemoDataset,
  createStagingClients,
  getPublicCount,
  inspectDemoStaff,
  loadDemoRows,
  loadLocalEnvironment,
  removeDemoDataset,
  verifyNormalDataset,
} from "./staging-demo-data-remote.mjs";

const flags = parseDemoFlags(process.argv.slice(2));
const environment = loadLocalEnvironment();
const { url, publishableKey, service } = createStagingClients();

if (flags.includePublished) {
  throw new Error(
    "Published demo data is not created by this safe normal seed. Use the production-disabled UI fixture adapter, or request a separate explicitly supervised hosted-publication run.",
  );
}

const baselineCount = await getPublicCount(service);
const [existingRows, staffInspection] = await Promise.all([
  loadDemoRows(service),
  inspectDemoStaff(service),
]);
const plan = seedPlan(existingRows);

console.log(`${flags.execute ? "EXECUTE" : "DRY RUN"}: ${SEED_VERSION}`);
console.log(`Project: ${environment.projectRef} (staging-only allowlist)`);
console.log(describeSeedPlan({ existingCount: existingRows.length, includePublished: false }));
console.log(`baseline_count=${baselineCount}`);

if (plan.action === "refuse" || staffInspection.ambiguous.length) {
  throw new Error("Refusing to modify ambiguous records or staff accounts that share demo identifiers.");
}

if (!flags.execute) {
  console.log(`Action on execute: ${plan.action}`);
  console.log("No database row, Storage object, Auth user, email, or certificate was changed.");
  console.log("Run `npm run staging:seed-demo -- --execute` to converge staging to the plan.");
  process.exit(0);
}

try {
  if (plan.action === "no-op") {
    if (staffInspection.safe.length !== 2) {
      throw new Error("The complete demo dataset does not have both bounded temporary staff identities.");
    }
    const verified = await verifyNormalDataset(service, baselineCount);
    console.log("Idempotent no-op: the complete normal demo dataset already exists.");
    console.log(`Verified ${verified.rows.length} submissions, ${SYNTHETIC_IMAGE_COUNT} private originals and ${SYNTHETIC_IMAGE_COUNT} private review thumbnails.`);
    process.exit(0);
  }

  if (plan.safe.length || staffInspection.safe.length) {
    await removeDemoDataset(service, {
      rows: plan.safe,
      staffRecords: staffInspection.safe,
      verifyCountFrom: baselineCount,
    });
  }

  await createDemoDataset(service, url, publishableKey);
  const verified = await verifyNormalDataset(service, baselineCount);
  const verifiedStaff = await inspectDemoStaff(service);
  if (verifiedStaff.safe.length !== 2 || verifiedStaff.ambiguous.length) {
    throw new Error("Temporary staging staff verification failed.");
  }
  console.log(`Created and verified ${verified.rows.length} bounded synthetic submissions.`);
  console.log(
    `Distribution: draft=${EXPECTED_DISTRIBUTION.draft}, pending_review=${EXPECTED_DISTRIBUTION.pending_review}, rejection_pending_admin=${EXPECTED_DISTRIBUTION.rejection_pending_admin}, rejected=${EXPECTED_DISTRIBUTION.rejected}, published=0.`,
  );
  console.log(`Private synthetic images: ${SYNTHETIC_IMAGE_COUNT} originals + ${SYNTHETIC_IMAGE_COUNT} review thumbnails.`);
  console.log(`campaign_count_before=${baselineCount}`);
  console.log(`campaign_count_after=${await getPublicCount(service)}`);
  console.log(`Email placeholders: ${verified.deliveryCount}, all not_started; no provider was called.`);
  console.log("Certificates: 0; no certificate was generated or uploaded.");
  console.log("Cleanup: npm run staging:cleanup-demo -- --execute");
} catch (error) {
  const [partialRows, partialStaff] = await Promise.all([
    loadDemoRows(service).catch(() => []),
    inspectDemoStaff(service).catch(() => ({ safe: [], ambiguous: [] })),
  ]);
  if (!partialStaff.ambiguous?.length) {
    await removeDemoDataset(service, {
      rows: partialRows,
      staffRecords: partialStaff.safe ?? [],
      verifyCountFrom: baselineCount,
    }).catch(() => undefined);
  }
  throw error;
}

if (DEMO_RECORDS.length !== 18) throw new Error("Internal demo descriptor count changed unexpectedly.");
