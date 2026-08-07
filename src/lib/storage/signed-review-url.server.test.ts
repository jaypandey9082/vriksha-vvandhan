import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createSignedUrl: vi.fn(),
  createSignedUrls: vi.fn(),
}));

vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => mocks },
  }),
}));

import {
  createOriginalReviewUrl,
  createReviewThumbnailUrls,
  REVIEW_SIGNED_URL_TTL_SECONDS,
} from "@/lib/storage/signed-review-url.server";

const id = "00000000-0000-4000-8000-000000000001";

beforeEach(() => vi.clearAllMocks());

describe("private review URL signing", () => {
  it("deduplicates thumbnail paths and signs them in one 10-minute batch", async () => {
    const path = `${id}/review-thumb.webp`;
    mocks.createSignedUrls.mockResolvedValue({
      data: [{ path, signedUrl: "https://private.test/signed", error: null }],
      error: null,
    });

    const result = await createReviewThumbnailUrls([path, path]);

    expect(mocks.createSignedUrls).toHaveBeenCalledOnce();
    expect(mocks.createSignedUrls).toHaveBeenCalledWith([path], REVIEW_SIGNED_URL_TTL_SECONDS);
    expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    expect(result.get(path)).toBe("https://private.test/signed");
  });

  it("keeps an individual batch failure as a safe null fallback", async () => {
    const path = `${id}/review-thumb.webp`;
    mocks.createSignedUrls.mockResolvedValue({
      data: [{ path, signedUrl: null, error: "not found" }],
      error: null,
    });
    await expect(createReviewThumbnailUrls([path])).resolves.toEqual(new Map([[path, null]]));
  });

  it("uses the same bounded TTL for a detail-only original", async () => {
    mocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://private.test/original" }, error: null });
    await createOriginalReviewUrl(`${id}/original.webp`);
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(`${id}/original.webp`, 600);
  });
});
