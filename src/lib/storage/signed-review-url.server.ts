import "server-only";

import { getServiceSupabaseClient } from "@/lib/supabase/service";
import { SUBMISSION_ORIGINALS_BUCKET } from "@/lib/storage/buckets";
import { parseStoredOriginalPath } from "@/lib/storage/paths";
import type { SignedReviewDescriptor } from "@/lib/storage/types";

const REVIEW_URL_TTL_SECONDS = 300;

export async function createOriginalReviewUrl(
  storedPath: string,
): Promise<SignedReviewDescriptor> {
  const path = parseStoredOriginalPath(storedPath);
  const { data, error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .createSignedUrl(path, REVIEW_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error("Unable to create a private review URL.");
  }

  return {
    bucket: SUBMISSION_ORIGINALS_BUCKET,
    path,
    signedUrl: data.signedUrl,
    expiresIn: REVIEW_URL_TTL_SECONDS,
  };
}
