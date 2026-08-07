import { z } from "zod";

import { ORIGINAL_EXTENSIONS, type OriginalExtension } from "@/lib/storage/types";

const uuidSchema = z.uuid();
const extensionSchema = z.enum(ORIGINAL_EXTENSIONS);
const guardianNumberSchema = z.number().int().positive().safe();
const versionSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const originalPathSchema = z
  .string()
  .max(500)
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/original\.(?:jpg|jpeg|png|webp|heic|heif)$/i,
  );
const reviewThumbnailPathSchema = z
  .string()
  .max(500)
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/review-thumb\.webp$/i,
  );

export function parseOriginalExtension(value: string): OriginalExtension {
  return extensionSchema.parse(value.toLowerCase());
}

export function buildOriginalPath(
  submissionId: string,
  extension: string,
): string {
  return `${uuidSchema.parse(submissionId)}/original.${parseOriginalExtension(extension)}`;
}

export function buildReviewThumbnailPath(submissionId: string): string {
  return `${uuidSchema.parse(submissionId)}/review-thumb.webp`;
}

export function buildPublishedCardPath(
  guardianNumber: number,
  version: string,
): string {
  return `card/${guardianNumberSchema.parse(guardianNumber)}-${versionSchema.parse(version)}.webp`;
}

export function buildPublishedFullPath(
  guardianNumber: number,
  version: string,
): string {
  return `full/${guardianNumberSchema.parse(guardianNumber)}-${versionSchema.parse(version)}.webp`;
}

export function buildCertificatePath(
  submissionId: string,
  guardianNumber: number,
  version: string,
): string {
  return `${uuidSchema.parse(submissionId)}/vriksha-guardian-${guardianNumberSchema.parse(guardianNumber)}-${versionSchema.parse(version)}.pdf`;
}

export function parseStoredOriginalPath(value: string): string {
  return originalPathSchema.parse(value);
}

export function parseStoredReviewThumbnailPath(value: string): string {
  return reviewThumbnailPathSchema.parse(value);
}
