import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class VerificationError extends Error {
    constructor(public readonly kind: "invalid" | "transient") {
      super(kind);
    }
  }
  return {
    VerificationError,
    verify: vi.fn(),
    remove: vi.fn(),
    maybeSingle: vi.fn(),
    rpc: vi.fn(),
    deleteEq: vi.fn(),
  };
});

function queryBuilder() {
  const builder = {
    select: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: mocks.maybeSingle,
    then: undefined,
  };
  return builder;
}

let submissionsQuery = queryBuilder();

vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabaseClient: () => ({
    from: () => submissionsQuery,
    rpc: mocks.rpc,
    storage: { from: () => ({ remove: mocks.remove }) },
  }),
}));
vi.mock("@/lib/submissions/verify-uploaded-image.server", () => ({
  UploadedImageVerificationError: mocks.VerificationError,
  verifyUploadedImage: mocks.verify,
}));

import {
  finalizePublicSubmission,
  SubmissionServiceError,
} from "@/lib/submissions/service.server";

const input = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  requestToken: "a".repeat(64),
};

beforeEach(() => {
  vi.clearAllMocks();
  submissionsQuery = queryBuilder();
  mocks.maybeSingle.mockResolvedValue({
    data: {
      id: input.submissionId,
      status: "draft",
      draft_expires_at: new Date(Date.now() + 60_000).toISOString(),
      submission_media: { original_path: `${input.submissionId}/original.webp` },
    },
    error: null,
  });
  mocks.remove.mockResolvedValue({ error: null });
});

describe("submission finalisation retry safety", () => {
  it("removes an invalid object and its Draft without exposing Storage details", async () => {
    mocks.verify.mockRejectedValue(new mocks.VerificationError("invalid"));

    await expect(finalizePublicSubmission(input)).rejects.toEqual(
      expect.objectContaining<Partial<SubmissionServiceError>>({ code: "invalid_image" }),
    );
    expect(mocks.remove).toHaveBeenCalledWith([`${input.submissionId}/original.webp`]);
    expect(submissionsQuery.delete).toHaveBeenCalledOnce();
  });

  it("keeps the Draft and object on a transient verification failure for retry", async () => {
    mocks.verify.mockRejectedValue(new mocks.VerificationError("transient"));

    await expect(finalizePublicSubmission(input)).rejects.toEqual(
      expect.objectContaining<Partial<SubmissionServiceError>>({ code: "media_not_ready" }),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(submissionsQuery.delete).not.toHaveBeenCalled();
  });

  it("returns success idempotently when the matching submission is already Pending Review", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: input.submissionId,
        status: "pending_review",
        draft_expires_at: null,
        submission_media: { original_path: `${input.submissionId}/original.webp` },
      },
      error: null,
    });

    await expect(finalizePublicSubmission(input)).resolves.toEqual({
      success: true,
      status: "pending_review",
    });
    expect(mocks.verify).not.toHaveBeenCalled();
  });
});
