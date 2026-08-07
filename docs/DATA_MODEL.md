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
- `campaign_settings` is the `id = 1` singleton containing target, label, submission-open switch, Draft TTL, and rolling per-email limit. No stored current count exists.
- `submissions` owns workflow, publication, rejection, test, Guardian and Trash state.
- `submission_contacts` is a one-to-one private email record.
- `submission_consents` is one-to-one versioned acceptance evidence.
- `submission_media` is one-to-one private-original metadata plus immutable public version, card/full paths, dimensions, byte sizes, focal point and alt text.
- `certificates` is one-to-one generation state with template version/path, byte size, SHA-256, attempts, safe error, and ephemeral claim token.
- `email_deliveries` is one row per submission/kind with stable idempotency, provider/template metadata, attempts, safe error, and ephemeral claim token.
- `audit_logs` records explicit future staff actions without copying participant email.

## Workflow rules

Draft may be incomplete. Pending Review requires submitted display data and accepted consent. Reviewer rejection requires comment, actor and time and moves only to Rejection Awaiting Admin. Final rejection requires an Admin confirmation actor/time and comment. Published requires approval actor/time, publication time and an assigned positive Guardian number. A Published record may preserve an earlier recommendation for history. There is no return-to-reviewer state.

## Count and Guardian numbers

`private.current_published_count()` counts only `published`, non-test, `counts_toward_goal = true`, non-trashed records whose media is Published with both public paths. `guardian_number_seq` is reserved by the trusted publication orchestrator. Allocated values are unique, gaps are expected after failed processing, and numbers are never reused.

## Privacy, test and Trash rules

Email is separated from publishable content. Signed URLs/tokens and image binaries are never stored. `internal_test` records use `is_test = true` and `counts_toward_goal = false`; test records cannot publish. Trash is represented by paired `trashed_at`/`trashed_by`, not a workflow status, so restoration preserves the prior state.

## Section 3 public transaction

`submissions.public_request_token_hash` stores only the lowercase SHA-256 capability hash and is unique when present. The prepare RPC creates a Draft, private contact, versioned consent, and fixed reserved-media path atomically. The finalise RPC accepts only server-derived verified metadata, moves the Draft to Pending Review, and creates one unsent `submission_received` delivery placeholder. Pending Review has no Guardian number, certificate row, publication timestamp, or public-count effect.

## Section 4 moderation and publication

Purpose-specific RPCs normalize review fields, recommend/confirm rejection, publish, Trash, restore, permanently delete, manage existing staff profiles, and update campaign settings. Publication records card/full metadata atomically with the workflow transition and creates exactly one `not_started` certificate and approval-email placeholder. `get_public_campaign_summary` and `list_public_movement_entries` expose only derived public data; neither returns submission IDs, contacts, private paths, consent, staff identity, or rejection data.

## Section 5 delivery state

Service-only claim/complete/fail functions row-lock certificate and email work. Claim tokens prevent one worker completing another attempt. Generated certificates require the private bucket, PDF format, versioned UUID/Guardian path, bounded bytes, SHA-256, and generation time. Sent email requires provider ID and sent time. Sent rows cannot be reclaimed; failed rows reuse the same idempotency key. Delivery state never participates in public count or Guardian allocation.
