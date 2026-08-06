import type { StaffRole, StaffSession } from "@/lib/auth/types";

export const STAFF_E2E_COOKIE = "vriksha-e2e-staff-role";

export function isStaffE2EAdapterEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.PLAYWRIGHT_STAFF_ADAPTER === "1";
}

export function staffE2ESession(role: StaffRole): StaffSession {
  return {
    userId: role === "admin" ? "e2000000-0000-4000-8000-000000000002" : "e2000000-0000-4000-8000-000000000001",
    email: role === "admin" ? "admin@example.test" : null,
    displayName: role === "admin" ? "Test Admin" : "Test Reviewer",
    role,
  };
}
