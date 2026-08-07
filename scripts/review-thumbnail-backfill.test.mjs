import { describe, expect, it } from "vitest";

import {
  assertReviewThumbnailStagingEnvironment,
  parseBackfillFlags,
  reviewThumbnailPath,
  summarizeBytes,
} from "./review-thumbnail-backfill-core.mjs";

describe("review-thumbnail backfill safety", () => {
  it("is dry-run by default and bounds batches", () => {
    expect(parseBackfillFlags([])).toEqual({ execute: false, batchSize: 25 });
    expect(parseBackfillFlags(["--execute", "--batch-size=10"])).toEqual({ execute: true, batchSize: 10 });
    expect(() => parseBackfillFlags(["--batch-size=51"])).toThrow();
    expect(() => parseBackfillFlags(["--production"])).toThrow();
  });

  it("refuses production and unapproved hosted projects", () => {
    expect(() => assertReviewThumbnailStagingEnvironment({
      SUPABASE_TARGET_ENVIRONMENT: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://oroaheeamreebbohexoc.supabase.co",
    })).toThrow(/outside the staging/i);
    expect(() => assertReviewThumbnailStagingEnvironment({
      SUPABASE_TARGET_ENVIRONMENT: "staging",
      NEXT_PUBLIC_SUPABASE_URL: "https://different.supabase.co",
    })).toThrow(/unapproved/i);
  });

  it("uses an opaque submission ID path and reports real byte summaries", () => {
    expect(reviewThumbnailPath("00000000-0000-4000-8000-000000000001"))
      .toBe("00000000-0000-4000-8000-000000000001/review-thumb.webp");
    expect(summarizeBytes([30, 10, 20])).toEqual({ count: 3, average: 20, median: 20, largest: 30, total: 60 });
  });
});
