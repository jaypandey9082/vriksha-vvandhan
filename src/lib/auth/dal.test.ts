import { describe, expect, it } from "vitest";

import {
  requireStaffWithClient,
  resolveStaffSession,
  type StaffDalClient,
} from "@/lib/auth/dal";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/errors";

function clientFor(options: {
  claims?: { sub?: string; email?: unknown } | null;
  claimsError?: unknown;
  profile?: {
    id: string;
    display_name: string;
    role: "admin" | "reviewer";
    active: boolean;
  } | null;
  profileError?: unknown;
}): StaffDalClient {
  return {
    auth: {
      getClaims: async () => ({
        data: { claims: options.claims ?? null },
        error: options.claimsError ?? null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: options.profile ?? null,
            error: options.profileError ?? null,
          }),
        }),
      }),
    }),
  };
}

describe("staff DAL resolution", () => {
  it("rejects an absent verified user", async () => {
    await expect(resolveStaffSession(clientFor({ claims: null }))).resolves.toEqual({
      kind: "unauthenticated",
    });
    await expect(
      requireStaffWithClient(clientFor({ claims: null })),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("rejects users without a profile and inactive staff", async () => {
    const claims = { sub: "00000000-0000-4000-8000-000000000001" };
    await expect(resolveStaffSession(clientFor({ claims }))).resolves.toEqual({
      kind: "forbidden",
    });
    await expect(
      requireStaffWithClient(clientFor({ claims })),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      resolveStaffSession(
        clientFor({
          claims,
          profile: {
            id: claims.sub,
            display_name: "Inactive",
            role: "reviewer",
            active: false,
          },
        }),
      ),
    ).resolves.toEqual({ kind: "forbidden" });
  });

  it.each(["reviewer", "admin"] as const)(
    "returns the minimal safe DTO for an active %s",
    async (role) => {
      const userId = "00000000-0000-4000-8000-000000000001";
      const result = await resolveStaffSession(
        clientFor({
          claims: {
            sub: userId,
            email: `${role}@example.test`,
          },
          profile: {
            id: userId,
            display_name: role === "admin" ? "Admin" : "Reviewer",
            role,
            active: true,
          },
        }),
      );

      expect(result.kind).toBe("staff");
      if (result.kind === "staff") {
        expect(result.session).toEqual({
          userId,
          email: `${role}@example.test`,
          displayName: role === "admin" ? "Admin" : "Reviewer",
          role,
        });
        expect(result.session).not.toHaveProperty("access_token");
        expect(result.session).not.toHaveProperty("refresh_token");
        expect(result.session).not.toHaveProperty("user_metadata");
      }
    },
  );
});
