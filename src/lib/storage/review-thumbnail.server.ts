import "server-only";

import sharp from "sharp";

import { PUBLIC_SUBMISSION } from "@/config/public-submission";
import { SUBMISSION_ORIGINALS_BUCKET } from "@/lib/storage/buckets";
import { buildReviewThumbnailPath } from "@/lib/storage/paths";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export const REVIEW_THUMBNAIL_WIDTH = 240;
export const REVIEW_THUMBNAIL_HEIGHT = 300;
export const REVIEW_THUMBNAIL_QUALITY = 70;
export const REVIEW_THUMBNAIL_MAX_BYTES = 120 * 1024;
export const REVIEW_THUMBNAIL_MIME_TYPE = "image/webp" as const;

export type ReviewThumbnail = {
  buffer: Buffer;
  width: typeof REVIEW_THUMBNAIL_WIDTH;
  height: typeof REVIEW_THUMBNAIL_HEIGHT;
  bytes: number;
  mimeType: typeof REVIEW_THUMBNAIL_MIME_TYPE;
};

const sharpInputOptions = {
  failOn: "warning" as const,
  limitInputPixels: PUBLIC_SUBMISSION.maximumDimension ** 2,
  limitInputChannels: 4,
  unlimited: false,
  pages: 1,
};

export async function generateReviewThumbnail(input: Buffer): Promise<ReviewThumbnail> {
  const metadata = await sharp(input, sharpInputOptions).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  if (
    width <= 0 ||
    height <= 0 ||
    Math.max(width, height) > PUBLIC_SUBMISSION.maximumDimension ||
    (metadata.pages ?? 1) !== 1 ||
    (metadata.pageHeight !== undefined && metadata.pageHeight !== height)
  ) {
    throw new Error("The source cannot be rendered as a safe single-frame review image.");
  }

  const { data, info } = await sharp(input, sharpInputOptions)
    .rotate()
    .resize(REVIEW_THUMBNAIL_WIDTH, REVIEW_THUMBNAIL_HEIGHT, {
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: REVIEW_THUMBNAIL_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  if (
    info.format !== "webp" ||
    info.width !== REVIEW_THUMBNAIL_WIDTH ||
    info.height !== REVIEW_THUMBNAIL_HEIGHT ||
    data.byteLength <= 0 ||
    data.byteLength > REVIEW_THUMBNAIL_MAX_BYTES
  ) {
    throw new Error("The generated review thumbnail exceeded its safety budget.");
  }

  return {
    buffer: data,
    width: REVIEW_THUMBNAIL_WIDTH,
    height: REVIEW_THUMBNAIL_HEIGHT,
    bytes: data.byteLength,
    mimeType: REVIEW_THUMBNAIL_MIME_TYPE,
  };
}

export async function uploadReviewThumbnail(
  submissionId: string,
  thumbnail: ReviewThumbnail,
): Promise<{ path: string; generatedAt: string }> {
  const path = buildReviewThumbnailPath(submissionId);
  const generatedAt = new Date().toISOString();
  const { error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .upload(path, thumbnail.buffer, {
      contentType: thumbnail.mimeType,
      cacheControl: "600",
      upsert: true,
    });

  if (error) throw new Error("Unable to store the private review thumbnail.");
  return { path, generatedAt };
}
