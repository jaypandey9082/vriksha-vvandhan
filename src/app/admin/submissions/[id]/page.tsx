/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { approveSubmissionAction, confirmRejectionAction, deleteTrashedAction, recommendRejectionAction, restoreNonpublishedAction, restorePublishedAction, trashSubmissionAction } from "@/app/admin/actions";
import { FocalPointEditor } from "@/components/admin/focal-point-editor";
import { getSubmissionDetail } from "@/lib/moderation/data.server";

type DetailRecord = {
  id: string; status: string; display_name: string | null; submitted_at: string | null; guardian_number: number | null;
  rejection_comment: string | null; rejection_recommended_at: string | null; rejected_at: string | null; trashed_at: string | null;
  submission_consents: { publication_consent: boolean; terms_accepted: boolean; accepted_at: string } | { publication_consent: boolean; terms_accepted: boolean; accepted_at: string }[];
  submission_media: { status: string; original_mime_type: string | null; original_bytes: number | null; original_width: number | null; original_height: number | null; focal_x: number | null; focal_y: number | null } | { status: string; original_mime_type: string | null; original_bytes: number | null; original_width: number | null; original_height: number | null; focal_x: number | null; focal_y: number | null }[];
  certificates: { status: string } | { status: string }[]; email_deliveries: { kind: string; status: string }[];
};

function one<T>(value: T | T[]): T { return Array.isArray(value) ? value[0] : value; }

export default async function SubmissionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; cleanup?: string }> }) {
  const { id } = await params;
  const result = await getSubmissionDetail(id);
  if (!result) notFound();
  const record = result.record as unknown as DetailRecord;
  const media = one(record.submission_media);
  const consent = one(record.submission_consents);
  const certificate = one(record.certificates);
  const query = await searchParams;
  const success = query.success;
  const reviewable = ["pending_review", "rejection_pending_admin"].includes(record.status) && !record.trashed_at;
  const canApprove = reviewable && (record.status === "pending_review" || result.session.role === "admin");
  return <>
    <header className="admin-page-header"><div><p>Submission detail</p><h1>{record.display_name ?? "Participant submission"}</h1></div><span className={`status-badge status-badge--${record.status}`}>{record.status.replaceAll("_", " ")}</span></header>
    {success === "published" && <div className="admin-success" role="status">Published successfully. Guardian #{record.guardian_number} is now on the Movement Wall.</div>}
    {query.cleanup === "required" && <div className="admin-notice" role="alert">The record is safely hidden, but its public image cleanup needs an Admin retry before permanent deletion.</div>}
    <div className="admin-detail-grid">
      <section className="admin-panel admin-review-image"><h2>Private original</h2>{result.reviewImage ? <><img src={result.reviewImage.signedUrl} alt="Private submitted photograph for staff review" /><small>Private signed preview · expires in 5 minutes</small></> : <p>Private preview is temporarily unavailable.</p>}</section>
      <section className="admin-panel"><h2>Submission facts</h2><dl className="admin-facts"><div><dt>Status</dt><dd>{record.status.replaceAll("_", " ")}</dd></div><div><dt>Submitted</dt><dd>{record.submitted_at ? new Date(record.submitted_at).toLocaleString("en-IN") : "—"}</dd></div><div><dt>Guardian number</dt><dd>{record.guardian_number ? `#${record.guardian_number}` : "Not assigned"}</dd></div><div><dt>Publication consent</dt><dd>{consent?.publication_consent ? "Confirmed" : "Missing"}</dd></div><div><dt>Terms accepted</dt><dd>{consent?.terms_accepted ? "Confirmed" : "Missing"}</dd></div><div><dt>Image</dt><dd>{media?.original_width ?? "—"} × {media?.original_height ?? "—"} · {media?.original_mime_type ?? "unknown"} · {media?.original_bytes ? `${Math.round(media.original_bytes / 1024)} KB` : "—"}</dd></div>{result.session.role === "admin" && <div><dt>Participant email</dt><dd>{result.email ?? "Unavailable"}</dd></div>}<div><dt>Certificate</dt><dd>{certificate?.status?.replaceAll("_", " ") ?? "Not started"}</dd></div></dl>
        {record.email_deliveries?.length > 0 && <div className="admin-deliveries"><h3>Notifications (Section 5)</h3>{record.email_deliveries.map(item => <p key={item.kind}>{item.kind.replaceAll("_", " ")}: <strong>{item.status.replaceAll("_", " ")}</strong></p>)}</div>}
      </section>
    </div>
    {reviewable && result.reviewImage && <section className="admin-panel"><h2>Review fields</h2><FocalPointEditor submissionId={record.id} displayName={record.display_name ?? ""} imageUrl={result.reviewImage.signedUrl} initialX={media?.focal_x ?? .5} initialY={media?.focal_y ?? .5} /></section>}
    {reviewable && <section className="admin-panel admin-actions"><h2>Moderation decision</h2>{canApprove && <form action={approveSubmissionAction}><input type="hidden" name="submissionId" value={record.id} /><button className="button button--primary" type="submit">Approve and publish</button></form>}
      {result.session.role === "reviewer" && record.status === "pending_review" && <form action={recommendRejectionAction}><input type="hidden" name="submissionId" value={record.id} /><label>Participant-facing recommendation comment<textarea name="comment" minLength={10} maxLength={1200} required /></label><button className="button button--light" type="submit">Recommend Rejection</button><small>Admin makes the final decision. No email is sent in Section 4.</small></form>}
      {result.session.role === "admin" && <form action={confirmRejectionAction}><input type="hidden" name="submissionId" value={record.id} /><label>Participant-facing rejection comment<textarea name="comment" defaultValue={record.rejection_comment ?? ""} minLength={10} maxLength={1200} required /></label><button className="button button--light" type="submit">{record.status === "rejection_pending_admin" ? "Confirm Rejection" : "Reject submission"}</button><small>Notification remains not started until Section 5.</small></form>}
    </section>}
    {record.status === "rejected" && <p className="admin-notice">Rejected — notification pending Section 5.</p>}
    {result.session.role === "admin" && <section className="admin-panel admin-danger"><h2>Admin controls</h2>{!record.trashed_at ? <form action={trashSubmissionAction}><input type="hidden" name="submissionId" value={record.id} /><p>Trash hides this record from public results immediately. Published Guardian numbers remain reserved.</p><label className="team-card__active"><input type="checkbox" required /> I understand the public visibility and count may change.</label><button className="button button--light" type="submit">Move to Trash</button></form> : <>{record.status === "published" ? <form action={restorePublishedAction}><input type="hidden" name="submissionId" value={record.id} /><p>New immutable public variants will be generated before visibility returns.</p><button className="button button--light" type="submit">Regenerate and restore publication</button></form> : <form action={restoreNonpublishedAction}><input type="hidden" name="submissionId" value={record.id} /><button className="button button--light" type="submit">Restore record</button></form>}<form action={deleteTrashedAction}><input type="hidden" name="submissionId" value={record.id} /><label>Permanent deletion reason<textarea name="reason" minLength={10} maxLength={1200} required /></label><label>Type DELETE to confirm<input name="confirmation" pattern="DELETE" required /></label><button className="button button--primary" type="submit">Permanently delete</button><small>This is irreversible. Storage objects are removed first.</small></form></>}</section>}
    {result.session.role === "admin" && result.audit.length > 0 && <section className="admin-panel"><h2>Audit history</h2><ol className="audit-list">{result.audit.map((event) => { const row = event as { id: number; action: string; created_at: string }; return <li key={row.id}><strong>{row.action}</strong><time>{new Date(row.created_at).toLocaleString("en-IN")}</time></li>; })}</ol></section>}
  </>;
}
