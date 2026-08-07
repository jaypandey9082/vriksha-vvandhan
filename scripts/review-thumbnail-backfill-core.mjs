import { assertStagingEnvironment } from "./staging-demo-data-core.mjs";

export const REVIEW_THUMBNAIL = Object.freeze({
  width: 240,
  height: 300,
  quality: 70,
  maximumBytes: 120 * 1024,
  bucket: "submission-originals",
});

export function parseBackfillFlags(argv) {
  const allowed = new Set(["--execute"]);
  let batchSize = 25;
  for (const argument of argv) {
    if (argument.startsWith("--batch-size=")) {
      batchSize = Number(argument.slice("--batch-size=".length));
      continue;
    }
    if (argument.startsWith("--") && !allowed.has(argument)) {
      throw new Error(`Unknown option: ${argument}`);
    }
  }
  if (!Number.isSafeInteger(batchSize) || batchSize < 1 || batchSize > 50) {
    throw new Error("--batch-size must be an integer between 1 and 50.");
  }
  return { execute: argv.includes("--execute"), batchSize };
}

export function assertReviewThumbnailStagingEnvironment(environment) {
  return assertStagingEnvironment(environment);
}

export function reviewThumbnailPath(submissionId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    throw new Error("Invalid submission ID.");
  }
  return `${submissionId}/review-thumb.webp`;
}

export function summarizeBytes(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  return {
    count: sorted.length,
    average: sorted.length ? Math.round(total / sorted.length) : 0,
    median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
    largest: sorted.at(-1) ?? 0,
    total,
  };
}
