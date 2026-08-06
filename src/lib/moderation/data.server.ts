import "server-only";

import { requireStaff } from "@/lib/auth/dal";
import { createOriginalReviewUrl } from "@/lib/storage/signed-review-url.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type QueueSubmission = {
  id: string; status: string; display_name: string | null; submitted_at: string | null;
  guardian_number: number | null; source: string; is_test: boolean; trashed_at: string | null;
  thumbnailUrl: string | null; reviewAgeHours: number | null;
};

export async function getOldestUnreviewedAgeHours() {
  await requireStaff();
  const client = await createServerSupabaseClient();
  const { data } = await client.from("submissions").select("submitted_at").eq("status", "pending_review").is("trashed_at", null).order("submitted_at", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
  return data?.submitted_at ? Math.max(0, Math.floor((Date.now() - new Date(data.submitted_at).getTime()) / 3_600_000)) : null;
}

export async function getSubmissionCounts() {
  const session = await requireStaff();
  const client = await createServerSupabaseClient();
  const statuses = ["pending_review", "rejection_pending_admin", "published", "rejected"] as const;
  const pairs = await Promise.all(statuses.map(async (status) => {
    const { count } = await client.from("submissions").select("id", { count: "exact", head: true }).eq("status", status).is("trashed_at", null);
    return [status, count ?? 0] as const;
  }));
  const { count: trashed } = await client.from("submissions").select("id", { count: "exact", head: true }).not("trashed_at", "is", null);
  let certificateNotStarted = 0;
  let emailNotStartedOrFailed = 0;
  if (session.role === "admin") {
    const [certificates, emails] = await Promise.all([
      client.from("certificates").select("id", { count: "exact", head: true }).eq("status", "not_started"),
      client.from("email_deliveries").select("id", { count: "exact", head: true }).in("status", ["not_started", "failed"]),
    ]);
    certificateNotStarted = certificates.count ?? 0;
    emailNotStartedOrFailed = emails.count ?? 0;
  }
  return {
    ...Object.fromEntries(pairs), trashed: trashed ?? 0,
    certificate_not_started: certificateNotStarted,
    email_not_started_or_failed: emailNotStartedOrFailed,
  } as Record<(typeof statuses)[number] | "trashed" | "certificate_not_started" | "email_not_started_or_failed", number>;
}

export async function listSubmissions(status: string, search: string) {
  const session = await requireStaff();
  const client = await createServerSupabaseClient();
  const normalizedSearch = search.trim();
  let emailSubmissionIds: string[] | null = null;
  if (normalizedSearch.includes("@") && session.role === "admin") {
    const { data: contacts, error } = await client.from("submission_contacts").select("submission_id").ilike("email", normalizedSearch);
    if (error) throw new Error("Unable to search participant contacts.");
    emailSubmissionIds = (contacts ?? []).map((contact) => contact.submission_id);
    if (!emailSubmissionIds.length) return [];
  }
  let query = client.from("submissions").select("id,status,display_name,submitted_at,guardian_number,source,is_test,trashed_at,submission_media(original_path)")
    .order("submitted_at", { ascending: false, nullsFirst: false }).limit(25);
  if (status === "trashed" && session.role === "admin") query = query.not("trashed_at", "is", null);
  else {
    query = query.is("trashed_at", null);
    if (["pending_review", "rejection_pending_admin", "published", "rejected"].includes(status)) query = query.eq("status", status as "pending_review");
    if (status === "test") query = query.eq("is_test", true);
  }
  if (emailSubmissionIds) query = query.in("id", emailSubmissionIds);
  else if (normalizedSearch) {
    const guardian = Number(normalizedSearch);
    query = Number.isSafeInteger(guardian) && guardian > 0 ? query.eq("guardian_number", guardian) : query.ilike("display_name", `%${normalizedSearch.replaceAll("%", "")}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error("Unable to load the moderation queue.");
  return Promise.all((data ?? []).map(async (item) => {
    const relation = item.submission_media;
    const media = Array.isArray(relation) ? relation[0] : relation;
    const thumbnailUrl = media?.original_path
      ? (await createOriginalReviewUrl(media.original_path).catch(() => null))?.signedUrl ?? null
      : null;
    const reviewAgeHours = item.submitted_at ? Math.max(0, Math.floor((Date.now() - new Date(item.submitted_at).getTime()) / 3_600_000)) : null;
    return { ...item, thumbnailUrl, reviewAgeHours } as QueueSubmission;
  }));
}

export async function getSubmissionDetail(id: string) {
  const session = await requireStaff();
  const client = await createServerSupabaseClient();
  const { data, error } = await client.from("submissions").select("id,status,display_name,submitted_at,guardian_number,rejection_comment,rejection_recommended_at,rejected_at,trashed_at,submission_consents(publication_consent,terms_accepted,accepted_at),submission_media(status,original_path,original_mime_type,original_bytes,original_width,original_height,focal_x,focal_y,published_card_path,published_full_path),certificates(status),email_deliveries(kind,status)").eq("id", id).maybeSingle();
  if (error || !data) return null;
  const record = data as unknown as Record<string, unknown> & { submission_media: { original_path: string } | { original_path: string }[] };
  const media = Array.isArray(record.submission_media) ? record.submission_media[0] : record.submission_media;
  const reviewImage = media?.original_path ? await createOriginalReviewUrl(media.original_path).catch(() => null) : null;
  let email: string | null = null;
  let audit: unknown[] = [];
  if (session.role === "admin") {
    const [contactResult, auditResult] = await Promise.all([
      client.from("submission_contacts").select("email").eq("submission_id", id).maybeSingle(),
      client.from("audit_logs").select("id,action,reason,before_data,after_data,created_at").eq("entity_id", id).order("created_at", { ascending: false }).limit(30),
    ]);
    email = contactResult.data?.email ?? null;
    audit = auditResult.data ?? [];
  }
  return { record, reviewImage, email, audit, session };
}
