import { describe, expect, it } from "vitest";

import {
  canConfirmRejection,
  canDelete,
  canManageSettings,
  canRecommendRejection,
  canReview,
  isAdmin,
} from "@/lib/auth/permissions";
import type { StaffSession } from "@/lib/auth/types";

const reviewer: StaffSession = {
  userId: "00000000-0000-4000-8000-000000000001",
  email: "reviewer@example.test",
  displayName: "Reviewer",
  role: "reviewer",
};
const admin: StaffSession = { ...reviewer, role: "admin", displayName: "Admin" };

describe("staff permissions", () => {
  it("allows Reviewer review and recommendation but not final or destructive actions", () => {
    expect(canReview(reviewer)).toBe(true);
    expect(canRecommendRejection(reviewer)).toBe(true);
    expect(canConfirmRejection(reviewer)).toBe(false);
    expect(canDelete(reviewer)).toBe(false);
    expect(canManageSettings(reviewer)).toBe(false);
    expect(isAdmin(reviewer)).toBe(false);
  });

  it("allows Admin final and destructive actions", () => {
    expect(canReview(admin)).toBe(true);
    expect(canConfirmRejection(admin)).toBe(true);
    expect(canDelete(admin)).toBe(true);
    expect(canManageSettings(admin)).toBe(true);
    expect(isAdmin(admin)).toBe(true);
  });
});
