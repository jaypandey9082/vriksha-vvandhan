# Moderation Workflow

## Access and queues

The Campaign Desk lives at `/admin`. Supabase password login is invite-only: there is no signup route, and every session must map to an active `staff_profiles` row. Reviewer sees Overview, Submissions and Published. Admin additionally sees Rejection Review, Trash, Team and Settings.

The bounded queue loads at most 25 records, supports status/test filters, display-name and Guardian-number search, and exact email search for Admin only. Every thumbnail and detail original uses a five-minute private signed URL. Email never appears for Reviewer or in image URLs.

## Decision path

Pending Review → Reviewer/Admin may correct safe display formatting and focal point → either publish or recommend/reject.

- Reviewer may publish only Pending Review.
- Reviewer may recommend rejection with a 10–1,200 character participant-facing comment. This moves the row to Rejection Awaiting Admin and sends nothing.
- Admin may reject Pending Review directly, confirm a recommendation, or approve instead.
- Reviewer cannot finalise rejection. There is no Return to Reviewer state.
- Every database transition locks and checks the current workflow state; stale or repeated decisions fail safely or use the documented idempotent result.

## Admin operations

Trash immediately removes a record from public queries/count and then removes public variants through the Storage API. A cleanup failure leaves the record safely hidden and surfaces an Admin retry notice. Nonpublished restore clears Trash. Published restore regenerates a new immutable card/full version before restoring visibility.

Permanent deletion is available only in Trash and requires a reason plus literal `DELETE` confirmation. Storage cleanup must succeed before the delete RPC. Admin may edit/deactivate existing staff profiles but cannot create Auth users, deactivate self, or demote/deactivate the last active Admin. Campaign target, label and submissions-open state are changed only through the audited settings RPC.

## Refresh and audit

Overview shows operational counts, latest Pending Review, oldest unreviewed age, manual refresh and last refreshed time. Its 25-second refresh stops doing work while the tab is hidden. Admin audit history excludes participant email and secrets. Section 4 creates delivery/certificate placeholders only; it sends/generates nothing.
