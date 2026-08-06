import { afterEach, describe, expect, it, vi } from "vitest";

import { isStaffE2EAdapterEnabled } from "@/lib/testing/staff-adapter";

afterEach(() => vi.unstubAllEnvs());

describe("staff E2E adapter gate", () => {
  it("requires the explicit Playwright flag", () => {
    vi.stubEnv("PLAYWRIGHT_STAFF_ADAPTER", "");
    expect(isStaffE2EAdapterEnabled()).toBe(false);
  });

  it("cannot activate in production", () => {
    vi.stubEnv("PLAYWRIGHT_STAFF_ADAPTER", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(isStaffE2EAdapterEnabled()).toBe(false);
  });
});
