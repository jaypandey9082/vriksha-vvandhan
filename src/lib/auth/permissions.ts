import type { StaffRole, StaffSession } from "@/lib/auth/types";

export function isAdmin(session: StaffSession): boolean {
  return session.role === "admin";
}

export function canReview(session: StaffSession): boolean {
  return session.role === "reviewer" || session.role === "admin";
}

export function canRecommendRejection(session: StaffSession): boolean {
  return canReview(session);
}

export function canConfirmRejection(session: StaffSession): boolean {
  return isAdmin(session);
}

export function canDelete(session: StaffSession): boolean {
  return isAdmin(session);
}

export function canManageSettings(session: StaffSession): boolean {
  return isAdmin(session);
}

export function hasRole(
  session: StaffSession,
  roles: readonly StaffRole[],
): boolean {
  return roles.includes(session.role);
}
