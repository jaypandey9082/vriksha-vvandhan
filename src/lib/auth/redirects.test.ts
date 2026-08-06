import { describe, expect, it } from "vitest";

import { safeInternalDestination } from "@/lib/auth/redirects";

describe("staff redirect safety", () => {
  it("accepts only internal Campaign Desk destinations", () => {
    expect(safeInternalDestination("/admin/submissions?status=pending_review")).toBe("/admin/submissions?status=pending_review");
    expect(safeInternalDestination("https://example.test/admin")).toBe("/admin");
    expect(safeInternalDestination("//example.test/admin")).toBe("/admin");
    expect(safeInternalDestination("/movement")).toBe("/admin");
  });
});
