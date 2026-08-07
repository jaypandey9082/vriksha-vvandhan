import { beforeEach, describe, expect, it, vi } from "vitest";

const createSignedUploadUrl = vi.fn();
const createSignedUrl = vi.fn();
const from = vi.fn(() => ({ createSignedUploadUrl, createSignedUrl }));

vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabaseClient: () => ({ storage: { from } }),
}));

import { createOriginalReviewUrl } from "@/lib/storage/signed-review-url.server";
import { createOriginalSignedUpload } from "@/lib/storage/signed-upload.server";

const submissionId = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signed Storage helpers", () => {
  it("locks signed uploads to the private bucket, generated path, and no overwrite", async () => {
    createSignedUploadUrl.mockResolvedValue({
      data: { token: "upload-token", path: `${submissionId}/original.jpg` },
      error: null,
    });

    await expect(createOriginalSignedUpload(submissionId, "jpg")).resolves.toEqual({
      bucket: "submission-originals",
      path: `${submissionId}/original.jpg`,
      token: "upload-token",
    });
    expect(from).toHaveBeenCalledWith("submission-originals");
    expect(createSignedUploadUrl).toHaveBeenCalledWith(
      `${submissionId}/original.jpg`,
      { upsert: false },
    );
    await expect(
      createOriginalSignedUpload(submissionId, "../../pdf"),
    ).rejects.toThrow();
  });

  it("creates a short-lived read URL only for a validated original path", async () => {
    const path = `${submissionId}/original.webp`;
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.test/private-token" },
      error: null,
    });

    await expect(createOriginalReviewUrl(path)).resolves.toEqual({
      bucket: "submission-originals",
      path,
      signedUrl: "https://example.test/private-token",
      expiresIn: 600,
    });
    expect(from).toHaveBeenCalledWith("submission-originals");
    expect(createSignedUrl).toHaveBeenCalledWith(path, 600);
    await expect(createOriginalReviewUrl("card/1-v1.webp")).rejects.toThrow();
  });
});
