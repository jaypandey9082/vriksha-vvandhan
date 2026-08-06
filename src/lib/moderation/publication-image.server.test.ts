import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { generatePublicVariants } from "@/lib/moderation/publication-image.server";

describe("public moderation variants", () => {
  it("creates stripped immutable WebP card and full variants", async () => {
    const source = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#2d403c" } }).jpeg().withMetadata({ orientation: 1 }).toBuffer();
    const output = await generatePublicVariants(source, .8, .4);
    const [card, full] = await Promise.all([sharp(output.card.data).metadata(), sharp(output.full.data).metadata()]);
    expect(output.version).toMatch(/^[a-f0-9-]{36}$/);
    expect(card).toMatchObject({ format: "webp", width: 640, height: 800 });
    expect(full.format).toBe("webp");
    expect(full.width).toBeLessThanOrEqual(1600);
    expect(full.height).toBeLessThanOrEqual(1600);
    expect(card.exif).toBeUndefined();
  });
});
