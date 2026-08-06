import "server-only";

import { requireStaff } from "@/lib/auth/dal";
import { createOriginalReviewUrl } from "@/lib/storage/signed-review-url.server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isStaffE2EAdapterEnabled } from "@/lib/testing/staff-adapter";

const E2E_PENDING_ID = "e1000000-0000-4000-8000-000000000001";
const E2E_RECOMMENDED_ID = "e1000000-0000-4000-8000-000000000002";
const E2E_TRASHED_ID = "e1000000-0000-4000-8000-000000000003";
const E2E_SUBMITTED_AT = "2026-08-06T10:00:00.000Z";

function e2eQueueFixtures(): QueueSubmission[] {
  return [
    { id:E2E_PENDING_ID,status:"pending_review",display_name:"Asha Test",submitted_at:E2E_SUBMITTED_AT,guardian_number:null,source:"internal_test",is_test:true,trashed_at:null,thumbnailUrl:"/campaign/guardian-preview.webp",reviewAgeHours:2 },
    { id:E2E_RECOMMENDED_ID,status:"rejection_pending_admin",display_name:"Ravi Test",submitted_at:E2E_SUBMITTED_AT,guardian_number:null,source:"internal_test",is_test:true,trashed_at:null,thumbnailUrl:"/campaign/guardian-preview.webp",reviewAgeHours:2 },
    { id:E2E_TRASHED_ID,status:"published",display_name:"Meera Test",submitted_at:E2E_SUBMITTED_AT,guardian_number:77,source:"internal_test",is_test:true,trashed_at:"2026-08-06T11:00:00.000Z",thumbnailUrl:"/campaign/guardian-preview.webp",reviewAgeHours:2 },
  ];
}

export type QueueSubmission = {
  id: string; status: string; display_name: string | null; submitted_at: string | null;
  guardian_number: number | null; source: string; is_test: boolean; trashed_at: string | null;
  thumbnailUrl: string | null; reviewAgeHours: number | null;
};

export async function getOldestUnreviewedAgeHours() {
  await requireStaff();
  if (isStaffE2EAdapterEnabled()) return 2;
  const client = await createServerSupabaseClient();
  const { data } = await client.from("submissions").select("submitted_at").eq("status", "pending_review").is("trashed_at", null).order("submitted_at", { ascending: true, nullsFirst: false }).limit(1).maybeSingle();
  return data?.submitted_at ? Math.max(0, Math.floor((Date.now() - new Date(data.submitted_at).getTime()) / 3_600_000)) : null;
}

export async function getSubmissionCounts() {
  const session = await requireStaff();
  if (isStaffE2EAdapterEnabled()) return { pending_review:1,rejection_pending_admin:1,published:1,rejected:0,trashed:1,certificate_not_started:1,email_not_started_or_failed:1 };
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
  if (isStaffE2EAdapterEnabled()) {
    const fixtures = e2eQueueFixtures();
    if (status === "trashed") return session.role === "admin" ? fixtures.filter((item) => item.trashed_at) : [];
    if (status === "all") return fixtures.filter((item) => !item.trashed_at);
    if (status === "test") return fixtures;
    return fixtures.filter((item) => !item.trashed_at && item.status === status && (!search || item.display_name?.toLowerCase().includes(search.toLowerCase())));
  }
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
  if (isStaffE2EAdapterEnabled()) {
    const fixture = e2eQueueFixtures().find((item) => item.id === id);
    if (!fixture) return null;
    const record = {
      id:fixture.id,status:fixture.status,display_name:fixture.display_name,submitted_at:fixture.submitted_at,guardian_number:fixture.guardian_number,
      rejection_comment:fixture.status === "rejection_pending_admin" ? "Please review this generated test image." : null,
      rejection_recommended_at:fixture.status === "rejection_pending_admin" ? "2026-08-06T11:00:00.000Z" : null,rejected_at:null,trashed_at:fixture.trashed_at,
      submission_consents:{publication_consent:true,terms_accepted:true,accepted_at:E2E_SUBMITTED_AT},
      submission_media:{status:fixture.status === "published" ? "published" : "uploaded",original_path:`${fixture.id}/original.webp`,original_mime_type:"image/webp",original_bytes:2048,original_width:900,original_height:900,focal_x:.5,focal_y:.5,published_card_path:null,published_full_path:null},
      certificates:{status:"not_started"},email_deliveries:[{kind:"approval_certificate",status:"not_started"}],
    };
    return { record, reviewImage:{bucket:"submission-originals",path:`${fixture.id}/original.webp`,signedUrl:"/campaign/guardian-preview.webp",expiresIn:300}, email:session.role === "admin" ? "participant@example.test" : null, audit:session.role === "admin" ? [{id:1,action:"submission.test_fixture",created_at:E2E_SUBMITTED_AT}] : [], session };
  }
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
