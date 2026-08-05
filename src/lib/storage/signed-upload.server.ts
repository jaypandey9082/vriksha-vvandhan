import "server-only";

import { getServiceSupabaseClient } from "@/lib/supabase/service";
import { SUBMISSION_ORIGINALS_BUCKET } from "@/lib/storage/buckets";
import { buildOriginalPath } from "@/lib/storage/paths";
import type { SignedUploadDescriptor } from "@/lib/storage/types";

export async function createOriginalSignedUpload(
  submissionId: string,
  extension: string,
): Promise<SignedUploadDescriptor> {
  const path = buildOriginalPath(submissionId, extension);
  const { data, error } = await getServiceSupabaseClient()
    .storage.from(SUBMISSION_ORIGINALS_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.token) {
    throw new Error("Unable to reserve a private image upload.");
  }

  return {
    bucket: SUBMISSION_ORIGINALS_BUCKET,
    path,
    token: data.token,
  };
}
