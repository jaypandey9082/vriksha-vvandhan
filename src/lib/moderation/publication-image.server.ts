import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";

const MAX_INPUT_PIXELS = 25_000_000;

export type PublicVariant = { data: Buffer; width: number; height: number; bytes: number };

export async function generatePublicVariants(input: Buffer, focalX = 0.5, focalY = 0.5) {
  const source = await sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS, animated: false })
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const width = source.info.width;
  const height = source.info.height;
  if (!width || !height || source.info.pages && source.info.pages > 1) throw new Error("image_processing_failed");

  const targetRatio = 4 / 5;
  const cropWidth = width / height > targetRatio ? Math.round(height * targetRatio) : width;
  const cropHeight = width / height > targetRatio ? height : Math.round(width / targetRatio);
  const left = Math.round(Math.min(Math.max(width * focalX - cropWidth / 2, 0), width - cropWidth));
  const top = Math.round(Math.min(Math.max(height * focalY - cropHeight / 2, 0), height - cropHeight));

  const card = await sharp(source.data)
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .resize(640, 800, { fit: "fill" })
    .webp({ quality: 80, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const full = await sharp(source.data)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer({ resolveWithObject: true });
  const version = randomUUID();
  return {
    version,
    card: { data: card.data, width: card.info.width, height: card.info.height, bytes: card.data.byteLength } satisfies PublicVariant,
    full: { data: full.data, width: full.info.width, height: full.info.height, bytes: full.data.byteLength } satisfies PublicVariant,
  };
}
