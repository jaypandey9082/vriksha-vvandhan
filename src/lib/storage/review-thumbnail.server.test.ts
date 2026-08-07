import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  generateReviewThumbnail,
  REVIEW_THUMBNAIL_HEIGHT,
  REVIEW_THUMBNAIL_MAX_BYTES,
  REVIEW_THUMBNAIL_WIDTH,
} from "@/lib/storage/review-thumbnail.server";

async function sourceImage() {
  return sharp({
    create: { width: 900, height: 700, channels: 3, background: "#2e6c46" },
  })
    .withMetadata({ orientation: 6, exif: { IFD0: { Artist: "Private test metadata" } } })
    .jpeg({ quality: 88 })
    .toBuffer();
}

describe("private review thumbnail generation", () => {
  it("creates a bounded 240x300 WebP and strips source metadata", async () => {
    const result = await generateReviewThumbnail(await sourceImage());
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimeType).toBe("image/webp");
    expect(result.width).toBe(REVIEW_THUMBNAIL_WIDTH);
    expect(result.height).toBe(REVIEW_THUMBNAIL_HEIGHT);
    expect(result.bytes).toBe(result.buffer.byteLength);
    expect(result.bytes).toBeLessThanOrEqual(REVIEW_THUMBNAIL_MAX_BYTES);
    expect(metadata).toMatchObject({ format: "webp", width: 240, height: 300 });
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    expect(metadata.xmp).toBeUndefined();
  });

  it("rejects malformed input", async () => {
    await expect(generateReviewThumbnail(Buffer.from("not an image"))).rejects.toThrow();
  });

  it("rejects animated or multipage input", async () => {
    const frames = await Promise.all(["#31734f", "#d9252a"].map((background) =>
      sharp({ create: { width: 20, height: 20, channels: 4, background } }).png().toBuffer(),
    ));
    const animated = await sharp(frames, { join: { animated: true } })
      .gif({ loop: 0, delay: [100, 100] })
      .toBuffer();

    await expect(generateReviewThumbnail(animated)).rejects.toThrow();
  });
});
