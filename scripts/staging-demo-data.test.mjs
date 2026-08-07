import { describe, expect, it } from "vitest";

import {
  CLEANUP_ORDER,
  DEMO_RECORDS,
  EXPECTED_DISTRIBUTION,
  STAGING_PROJECT_REF,
  SYNTHETIC_IMAGE_COUNT,
  assertCountInvariant,
  assertStagingEnvironment,
  cleanupPlan,
  describeSeedPlan,
  distributionFor,
  isExpectedDemoSubmission,
  parseDemoFlags,
  seedPlan,
  selectCleanupCandidates,
} from "./staging-demo-data-core.mjs";

const markedRows = DEMO_RECORDS.map((record) => ({
  id: record.id,
  status: record.status,
  display_name: record.displayName,
  source: "internal_test",
  is_test: true,
  counts_toward_goal: false,
  submission_media: record.image
    ? { original_path: `${record.id}/original.webp`, published_card_path: null, published_full_path: null }
    : { original_path: `${record.id}/original.webp`, published_card_path: null, published_full_path: null },
}));

describe("staging demo dataset safety", () => {
  it("allows only the pinned hosted staging environment", () => {
    expect(
      assertStagingEnvironment({
        SUPABASE_TARGET_ENVIRONMENT: "staging",
        NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING_PROJECT_REF}.supabase.co`,
      }),
    ).toEqual({
      projectRef: STAGING_PROJECT_REF,
      hostname: `${STAGING_PROJECT_REF}.supabase.co`,
    });
  });

  it.each([
    ["production", `https://${STAGING_PROJECT_REF}.supabase.co`],
    ["staging", "https://production-example.supabase.co"],
    ["staging", "http://localhost:54321"],
    [undefined, `https://${STAGING_PROJECT_REF}.supabase.co`],
  ])("refuses non-staging or unapproved targets", (target, url) => {
    expect(() =>
      assertStagingEnvironment({
        SUPABASE_TARGET_ENVIRONMENT: target,
        NEXT_PUBLIC_SUPABASE_URL: url,
      }),
    ).toThrow(/Refusing|valid hosted staging/);
  });

  it("is dry-run by default and requires the explicit execution flag", () => {
    expect(parseDemoFlags([])).toEqual({ execute: false, includePublished: false });
    expect(parseDemoFlags(["--execute"])).toEqual({ execute: true, includePublished: false });
  });

  it("recognizes published mode only with its explicit flag", () => {
    expect(parseDemoFlags(["--execute"])).toEqual({ execute: true, includePublished: false });
    expect(parseDemoFlags(["--execute", "--include-published"])).toEqual({
      execute: true,
      includePublished: true,
    });
  });

  it("creates exactly the required marked record distribution", () => {
    expect(DEMO_RECORDS).toHaveLength(18);
    expect(SYNTHETIC_IMAGE_COUNT).toBe(15);
    expect(distributionFor(markedRows)).toEqual(EXPECTED_DISTRIBUTION);
    expect(markedRows.every(isExpectedDemoSubmission)).toBe(true);
  });

  it("rejects ambiguous cleanup candidates", () => {
    const altered = { ...markedRows[0], display_name: "Someone else" };
    const selection = selectCleanupCandidates([markedRows[1], altered]);
    expect(selection.safe).toEqual([markedRows[1]]);
    expect(selection.ambiguous).toEqual([altered]);
  });

  it("protects the campaign count baseline", () => {
    expect(() => assertCountInvariant(12, 12)).not.toThrow();
    expect(() => assertCountInvariant(12, 13)).toThrow(/count invariant/);
    expect(() => assertCountInvariant(12, 15, 3)).not.toThrow();
  });

  it("requires the published cleanup flag when public paths are present", () => {
    const published = {
      ...markedRows[0],
      status: "published",
      submission_media: {
        ...markedRows[0].submission_media,
        published_card_path: "card/1-demo.webp",
        published_full_path: "full/1-demo.webp",
      },
    };
    expect(cleanupPlan([published]).action).toBe("refuse-published");
    expect(cleanupPlan([published], true).action).toBe("delete");
  });

  it("keeps Storage cleanup ahead of database and Auth deletion", () => {
    expect(CLEANUP_ORDER).toEqual([
      "published-storage",
      "private-storage",
      "certificate-storage",
      "audit-logs",
      "database-submissions",
      "temporary-auth-users",
      "verification",
    ]);
  });

  it("does not include email values, passwords, tokens, or keys in plan output", () => {
    const output = describeSeedPlan();
    expect(output).not.toMatch(/demo-vriksha-001|demo-reviewer|@example\.com/);
    expect(output).not.toMatch(/password|token|secret[_ -]?key/i);
    expect(output).toContain("values hidden");
  });

  it("is idempotent after a complete seed", () => {
    expect(seedPlan([]).action).toBe("create");
    expect(seedPlan(markedRows).action).toBe("no-op");
    expect(seedPlan(markedRows).action).toBe("no-op");
  });

  it("is idempotent after repeated cleanup", () => {
    expect(cleanupPlan(markedRows).action).toBe("delete");
    expect(cleanupPlan([]).action).toBe("no-op");
    expect(cleanupPlan([]).action).toBe("no-op");
  });
});
