import Link from "next/link";
import Image from "next/image";

import { requireStaff } from "@/lib/auth/dal";
import { listSubmissions } from "@/lib/moderation/data.server";

const labels: Record<string, string> = { pending_review: "Pending Review", rejection_pending_admin: "Rejection Awaiting Admin", published: "Published", rejected: "Rejected", trashed: "Trash", test: "Test records", all: "All active" };

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const session = await requireStaff();
  const query = await searchParams;
  const requested = query.status ?? "pending_review";
  const status = requested === "trashed" && session.role !== "admin" ? "pending_review" : requested;
  const submissions = await listSubmissions(status, query.q ?? "");
  const filters = ["pending_review", ...(session.role === "admin" ? ["rejection_pending_admin"] : []), "published", "rejected", "test", ...(session.role === "admin" ? ["trashed"] : []), "all"];
  return <>
    <header className="admin-page-header"><div><p>Moderation queue</p><h1>{labels[status] ?? "Submissions"}</h1></div></header>
    <nav className="admin-filters" aria-label="Submission filters">{filters.map(filter => <Link aria-current={filter === status ? "page" : undefined} href={`/admin/submissions?status=${filter}`} key={filter}>{labels[filter]}</Link>)}</nav>
    <form className="admin-search"><label>Search by display name, Guardian number{session.role === "admin" ? ", or exact email" : ""}<input name="q" defaultValue={query.q} /></label><input type="hidden" name="status" value={status} /><button className="button button--light">Search</button></form>
    <section className="admin-panel admin-table-wrap" aria-label={`${labels[status] ?? "Submission"} queue`}>
      {submissions.length ? <table className="admin-table"><thead><tr><th>Photo</th><th>Name</th><th>Status</th><th>Submitted / age</th><th>Guardian</th><th>Source</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{submissions.map(item => <tr key={item.id}><td>{item.thumbnailUrl ? <Image className="admin-thumbnail" src={item.thumbnailUrl} alt="Private submission preview" width={56} height={70} unoptimized /> : <span className="admin-thumbnail admin-thumbnail--empty">—</span>}</td><td><strong>{item.display_name ?? "Draft"}</strong></td><td><span className={`status-badge status-badge--${item.status}`}>{labels[item.status] ?? item.status}</span></td><td>{item.submitted_at ? <>{new Date(item.submitted_at).toLocaleDateString("en-IN")}<small>{item.reviewAgeHours}h in queue</small></> : "—"}</td><td>{item.guardian_number ? `#${item.guardian_number}` : "—"}</td><td>{item.source}{item.is_test && <em> Test</em>}</td><td><Link href={`/admin/submissions/${item.id}`}>Open</Link></td></tr>)}</tbody></table> : <p className="admin-empty">No submissions match this queue.</p>}
    </section>
  </>;
}
