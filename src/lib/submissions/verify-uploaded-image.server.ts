import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { PUBLIC_SUBMISSION } from "@/config/public-submission";
import { SUBMISSION_ORIGINALS_BUCKET } from "@/lib/storage/buckets";
import { parseStoredOriginalPath } from "@/lib/storage/paths";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

export type VerifiedUploadedImage = {
  data: Buffer;
  mimeType: "image/webp" | "image/jpeg";
  bytes: number;
  width: number;
  height: number;
  sha256: string;
};

export class UploadedImageVerificationError extends Error {
  constructor(public readonly kind: "invalid" | "transient") {
    super(kind === "invalid" ? "Uploaded image is invalid." : "Uploaded image could not be verified.");
    this.name = "UploadedImageVerificationError";
  }
}

export async function verifyUploadedImage(path: string): Promise<VerifiedUploadedImage> {
  const safePath = parseStoredOriginalPath(path);
  const { data, error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .download(safePath);

  if (error || !data) throw new UploadedImageVerificationError("transient");
  if (data.size <= 0 || data.size > PUBLIC_SUBMISSION.preparedMaxBytes) {
    throw new UploadedImageVerificationError("invalid");
  }

  const bytes = Buffer.from(await data.arrayBuffer());

  try {
    const metadata = await sharp(bytes, {
      failOn: "warning",
      limitInputPixels: PUBLIC_SUBMISSION.maximumDimension ** 2,
      limitInputChannels: 4,
      unlimited: false,
      pages: 1,
    }).metadata();

    const mimeType =
      metadata.format === "webp"
        ? "image/webp"
        : metadata.format === "jpeg"
          ? "image/jpeg"
          : null;
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (
      !mimeType ||
      width <= 0 ||
      height <= 0 ||
      Math.max(width, height) > PUBLIC_SUBMISSION.maximumDimension ||
      (metadata.pages ?? 1) !== 1 ||
      (metadata.pageHeight !== undefined && metadata.pageHeight !== height)
    ) {
      throw new UploadedImageVerificationError("invalid");
    }

    return {
      data: bytes,
      mimeType,
      bytes: bytes.byteLength,
      width,
      height,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  } catch (error) {
    if (error instanceof UploadedImageVerificationError) throw error;
    throw new UploadedImageVerificationError("invalid");
  }
}
