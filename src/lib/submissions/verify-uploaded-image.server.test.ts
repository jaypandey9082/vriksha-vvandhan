import { createHash } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  download: vi.fn(),
  metadata: vi.fn(),
  sharp: vi.fn(),
}));

vi.mock("sharp", () => ({
  default: mocks.sharp,
}));
vi.mock("@/lib/supabase/service", () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => ({ download: mocks.download }) },
  }),
}));

import {
  UploadedImageVerificationError,
  verifyUploadedImage,
} from "@/lib/submissions/verify-uploaded-image.server";

const path = "00000000-0000-4000-8000-000000000001/original.webp";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sharp.mockReturnValue({ metadata: mocks.metadata });
});

describe("stored image verification", () => {
  it("detects actual bytes, format and dimensions with strict Sharp limits", async () => {
    const body = new Uint8Array([1, 2, 3, 4]);
    mocks.download.mockResolvedValue({ data: new Blob([body]), error: null });
    mocks.metadata.mockResolvedValue({ format: "webp", width: 640, height: 480, pages: 1 });

    await expect(verifyUploadedImage(path)).resolves.toEqual({
      data: Buffer.from(body),
      mimeType: "image/webp",
      bytes: 4,
      width: 640,
      height: 480,
      sha256: createHash("sha256").update(body).digest("hex"),
    });
    expect(mocks.sharp).toHaveBeenCalledWith(expect.any(Buffer), {
      failOn: "warning",
      limitInputPixels: 2560 ** 2,
      limitInputChannels: 4,
      unlimited: false,
      pages: 1,
    });
  });

  it("classifies missing objects as transient so a retry does not destroy the Draft", async () => {
    mocks.download.mockResolvedValue({ data: null, error: { message: "not ready" } });
    await expect(verifyUploadedImage(path)).rejects.toMatchObject({
      name: "UploadedImageVerificationError",
      kind: "transient",
    });
  });

  it("rejects non-WebP/JPEG, oversize, malformed and multi-page content", async () => {
    mocks.download.mockResolvedValue({ data: new Blob([new Uint8Array([1])]), error: null });
    mocks.metadata.mockResolvedValue({ format: "png", width: 20, height: 20, pages: 1 });
    await expect(verifyUploadedImage(path)).rejects.toBeInstanceOf(UploadedImageVerificationError);

    mocks.metadata.mockResolvedValue({ format: "jpeg", width: 20, height: 20, pages: 2 });
    await expect(verifyUploadedImage(path)).rejects.toMatchObject({ kind: "invalid" });

    mocks.download.mockResolvedValue({
      data: new Blob([new Uint8Array(2 * 1024 * 1024 + 1)]),
      error: null,
    });
    await expect(verifyUploadedImage(path)).rejects.toMatchObject({ kind: "invalid" });
  });
});
