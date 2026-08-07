import "server-only";

import { getServiceSupabaseClient } from "@/lib/supabase/service";
import { SUBMISSION_ORIGINALS_BUCKET } from "@/lib/storage/buckets";
import {
  parseStoredOriginalPath,
  parseStoredReviewThumbnailPath,
} from "@/lib/storage/paths";
import type { SignedReviewDescriptor } from "@/lib/storage/types";

export const REVIEW_SIGNED_URL_TTL_SECONDS = 600;

export async function createOriginalReviewUrl(
  storedPath: string,
): Promise<SignedReviewDescriptor> {
  const path = parseStoredOriginalPath(storedPath);
  const { data, error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .createSignedUrl(path, REVIEW_SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error("Unable to create a private review URL.");
  }

  return {
    bucket: SUBMISSION_ORIGINALS_BUCKET,
    path,
    signedUrl: data.signedUrl,
    expiresIn: REVIEW_SIGNED_URL_TTL_SECONDS,
  };
}

export async function createReviewThumbnailUrls(
  storedPaths: readonly string[],
): Promise<Map<string, string | null>> {
  const paths = [...new Set(storedPaths.map(parseStoredReviewThumbnailPath))];
  if (!paths.length) return new Map();

  const { data, error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .createSignedUrls(paths, REVIEW_SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    throw new Error("Unable to create private review-thumbnail URLs.");
  }

  const urls = new Map<string, string | null>(paths.map((path) => [path, null]));
  for (const item of data) {
    if (item.path && urls.has(item.path)) {
      urls.set(item.path, item.error ? null : item.signedUrl);
    }
  }
  return urls;
}
