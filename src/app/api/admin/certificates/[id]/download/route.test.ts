import { beforeEach, describe, expect, it, vi } from "vitest";

import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/errors";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), createClient: vi.fn(), signedUrl: vi.fn() }));
vi.mock("@/lib/auth/dal", () => ({ requireRole: mocks.requireRole }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createClient }));
vi.mock("@/lib/certificates/process-certificate.server", () => ({ createCertificateDownloadUrl: mocks.signedUrl }));

import { GET } from "@/app/api/admin/certificates/[id]/download/route";

const id = "c1000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireRole.mockResolvedValue({ role: "admin" });
  mocks.createClient.mockResolvedValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { status: "generated", object_path: "private/certificate.pdf" }, error: null }) }) }) }) });
  mocks.signedUrl.mockResolvedValue("https://storage.example.test/signed-private-url");
});

describe("private certificate download route", () => {
  it("authorizes Admin and redirects to a fresh two-minute signed URL", async () => {
    const response = await GET(new Request("http://localhost/download"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://storage.example.test/signed-private-url");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(mocks.signedUrl).toHaveBeenCalledWith("private/certificate.pdf", 120);
  });

  it("denies Reviewer before loading certificate metadata", async () => {
    mocks.requireRole.mockRejectedValue(new ForbiddenError());
    const response = await GET(new Request("http://localhost/download"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(403);
    expect(mocks.createClient).not.toHaveBeenCalled();
  });

  it("denies signed-out callers", async () => {
    mocks.requireRole.mockRejectedValue(new UnauthenticatedError());
    const response = await GET(new Request("http://localhost/download"), { params: Promise.resolve({ id }) });
    expect(response.status).toBe(401);
  });
});
