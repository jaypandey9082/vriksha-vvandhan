import {
  CLEANUP_ORDER,
  SEED_VERSION,
  cleanupPlan,
  distributionFor,
  parseDemoFlags,
} from "./staging-demo-data-core.mjs";
import {
  countExistingPrivateImages,
  createStagingClients,
  getPublicCount,
  inspectDemoStaff,
  loadDemoRows,
  loadLocalEnvironment,
  removeDemoDataset,
} from "./staging-demo-data-remote.mjs";

const flags = parseDemoFlags(process.argv.slice(2));
const environment = loadLocalEnvironment();
const { service } = createStagingClients();
const baselineCount = await getPublicCount(service);
const [rows, staffInspection] = await Promise.all([
  loadDemoRows(service),
  inspectDemoStaff(service),
]);
const plan = cleanupPlan(rows, flags.includePublished);
const distribution = distributionFor(plan.safe);
const privateFiles = await countExistingPrivateImages(service, plan.safe);
const publicFiles = plan.safe.reduce(
  (count, row) =>
    count +
    Number(Boolean(row.submission_media?.published_card_path)) +
    Number(Boolean(row.submission_media?.published_full_path)),
  0,
);

console.log(`${flags.execute ? "EXECUTE" : "DRY RUN"}: cleanup ${SEED_VERSION}`);
console.log(`Project: ${environment.projectRef} (staging-only allowlist)`);
console.log(`Demo submissions: ${plan.safe.length}`);
console.log(
  `Status distribution: draft=${distribution.draft}, pending_review=${distribution.pending_review}, rejection_pending_admin=${distribution.rejection_pending_admin}, rejected=${distribution.rejected}, published=${distribution.published}.`,
);
console.log(`Private files: ${privateFiles}`);
console.log(`Public files: ${publicFiles}`);
console.log(`Temporary test staff accounts: ${staffInspection.safe.length}`);
console.log(`Campaign count baseline: ${baselineCount}`);
console.log(`Cleanup order: ${CLEANUP_ORDER.join(" -> ")}`);

if (plan.ambiguous.length || staffInspection.ambiguous.length) {
  throw new Error("Cleanup refused ambiguous records or staff accounts that share demo identifiers.");
}
if (plan.action === "refuse-published") {
  throw new Error("Published demo cleanup requires --include-published in addition to --execute.");
}
if (!flags.execute) {
  console.log("Dry run only; no database row, Storage object, Auth user, email, or certificate was changed.");
  console.log("Run `npm run staging:cleanup-demo -- --execute` to remove the normal dataset.");
  process.exit(0);
}

const result = await removeDemoDataset(service, {
  rows: plan.safe,
  staffRecords: staffInspection.safe,
  includePublished: flags.includePublished,
  verifyCountFrom: baselineCount,
});
console.log(`Removed demo submissions: ${result.removedSubmissions}`);
console.log(`Removed private files: ${result.removedPrivateFiles}`);
console.log(`Removed public files: ${result.removedPublicFiles}`);
console.log(`Removed temporary staff accounts: ${result.removedStaff}`);
console.log(`campaign_count_after=${await getPublicCount(service)}`);
console.log("Cleanup verified; no bounded demo records or Storage objects remain.");
