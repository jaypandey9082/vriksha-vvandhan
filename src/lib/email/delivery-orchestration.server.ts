import "server-only";

import { processCertificateGeneration } from "@/lib/certificates/process-certificate.server";
import { processEmailDelivery } from "@/lib/email/process-email-delivery.server";
import { getServiceSupabaseClient } from "@/lib/supabase/service";

type DeliveryKind = "submission_received" | "approval_certificate" | "rejection";

export async function processSubmissionDelivery(submissionId: string, kind: DeliveryKind) {
  const { data, error } = await getServiceSupabaseClient()
    .from("email_deliveries")
    .select("id")
    .eq("submission_id", submissionId)
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw new Error("email_delivery_lookup_failed");
  if (!data) return { outcome: "not_eligible" as const };
  return processEmailDelivery(data.id);
}

export async function processApprovalDelivery(submissionId: string) {
  await processCertificateGeneration(submissionId);
  return processSubmissionDelivery(submissionId, "approval_certificate");
}
