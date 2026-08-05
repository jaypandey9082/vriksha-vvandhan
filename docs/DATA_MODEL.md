# Data Model

## Enums

- `staff_role`: `admin`, `reviewer`
- `submission_status`: `draft`, `pending_review`, `rejection_pending_admin`, `published`, `rejected`
- `submission_source`: `website`, `internal_test`
- `media_status`: `reserved`, `uploaded`, `published`, `removed`
- `certificate_status`: `not_started`, `queued`, `generated`, `failed`
- `email_delivery_status`: `not_started`, `queued`, `sent`, `failed`
- `email_delivery_kind`: `submission_received`, `approval_certificate`, `rejection`

## Tables and relationships

- `staff_profiles` extends selected Supabase Auth users with an active Reviewer/Admin role.
- `campaign_settings` is the `id = 1` singleton containing target, label and submission-open switch. No stored current count exists.
- `submissions` owns workflow, publication, rejection, test, Guardian and Trash state.
- `submission_contacts` is a one-to-one private email record.
- `submission_consents` is one-to-one versioned acceptance evidence.
- `submission_media` is one-to-one private-original metadata plus future approved derivative paths.
- `certificates` is one-to-one generation state.
- `email_deliveries` is one row per submission and delivery kind with a stable idempotency key.
- `audit_logs` records explicit future staff actions without copying participant email.

## Workflow rules

Draft may be incomplete. Pending Review requires submitted display data and accepted consent. Reviewer rejection requires comment, actor and time and moves only to Rejection Awaiting Admin. Final rejection requires an Admin confirmation actor/time and comment. Published requires approval actor/time, publication time and an assigned positive Guardian number. A Published record may preserve an earlier recommendation for history. There is no return-to-reviewer state.

## Count and Guardian numbers

`private.current_published_count()` counts only `published`, non-test, `counts_toward_goal = true`, non-trashed records. It never mutates data. `guardian_number_seq` is reserved but unused in Section 2. Allocated Guardian numbers are unique and are never reused.

## Privacy, test and Trash rules

Email is separated from publishable content. Signed URLs/tokens and image binaries are never stored. `internal_test` records use `is_test = true` and `counts_toward_goal = false`; test records cannot publish. Trash is represented by paired `trashed_at`/`trashed_by`, not a workflow status, so restoration preserves the prior state.
