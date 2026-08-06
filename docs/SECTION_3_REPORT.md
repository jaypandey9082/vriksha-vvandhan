# Section 3 Report

## Product flow

`/join` implements the approved public journey: choose or take one photograph, enter display name and email, accept publication consent and campaign terms, prepare the image locally, create a private Draft, upload directly with a signed token, verify the stored bytes on the server, atomically finalise to Pending Review, and show the required on-screen confirmation.

The homepage remains static. Its Join actions now route to `/join`; the `417 / 983` tracker and all campaign sections remain unchanged.

## Main files

- `src/app/join`, `src/app/campaign-terms`, and `src/app/privacy` provide the public and legal routes.
- `src/components/submission` contains the focused form, photo, progress, error, availability, and success UI.
- `src/app/api/submissions/prepare` and `finalize` are explicit Node.js route handlers.
- `src/lib/submissions` owns shared schemas, same-origin checks, browser image preparation, request tokens, trusted verification, service orchestration, and stable public errors.
- `supabase/migrations/20260806080858_public_submission_flow.sql` adds the Section 3 transaction and advisor fixes.
- `scripts/cleanup-expired-drafts.mjs` and `scripts/test-staging-submission.mjs` provide guarded operations.

## Dependencies

- `browser-image-compression@2.0.2` for bounded client preparation.
- `sharp@0.35.3` as an explicit server dependency for untrusted-image inspection.

Both are exact versions. The installation audit found no known vulnerabilities.

## Database contract

`prepare_public_submission` is service-role-only, security-definer, and uses an empty search path. It validates normalized participant values and consent, takes an advisory lock on the hashed capability, returns the existing matching Draft or Pending Review record idempotently, enforces the campaign-open switch and the configured per-email rolling limit, and atomically creates the Draft, contact, consent, and reserved media rows. It returns only the submission ID, status, fixed path/extension, and expiry.

`finalize_public_submission` locks and validates the matching Draft and hashed capability, verifies expiry and accepted consent, records only trusted server-derived media metadata, changes status to Pending Review, and inserts one `submission_received` delivery row with `not_started` status and a stable idempotency key. A repeat call for the same Pending Review submission succeeds without duplicating work.

The public request token is 32 cryptographically random bytes represented as 64 lowercase hex characters. It remains in component memory only; only its server-side SHA-256 hash is stored. It is never placed in URLs, logs, DOM data attributes, or browser storage.

The default Draft lifetime is 1,440 minutes and the default rolling limit is three submissions per normalized email in 24 hours. These values live in `campaign_settings` for staging operation.

## Image and upload strategy

The browser accepts JPEG, PNG, WebP, HEIC, and HEIF up to 15 MiB, strips EXIF/GPS by disabling preservation, limits the longest side to 2,560 pixels, targets about 1.5 MiB, and rejects prepared output over 2 MiB. WebP is preferred with JPEG fallback. HEIC/HEIF decode failure has dedicated copy and never falls back to uploading the original.

Signed uploads use one server-generated private path and `upsert: false`. The finalise service downloads the object and uses strict Sharp limits to detect the real format, dimensions, page count, size, and SHA-256. Invalid objects and their Drafts are removed; transient verification failures preserve both for retry.

## Failure, retry, and confirmation

Field validation produces an error summary, inline associations, and first-invalid-field focus. Prepare, upload, and finalise retry paths preserve form details and the prepared image in memory. The same request token makes reservation and signed-token renewal idempotent. An expired Draft starts a new secure session on retry. Already-finalised submissions resolve to the success state.

The success heading receives focus and states that the submission was received, remains private pending review, has no Guardian number, and has no generated certificate. No email is sent in Section 3.

## Tests and CI

Application coverage includes validation/normalisation, consent, token generation and hashing, origin enforcement, error sanitisation, image inputs and limits, HEIC behavior, URL cleanup, signed descriptors, route handlers, trusted image verification, invalid/transient cleanup behavior, form controls, validation, preview/replace/remove, progress, retry, success focus, closed/unavailable states, mobile overflow, legal navigation, console errors, keyboard access, and axe checks.

Final local application results: lint passed, TypeScript passed, 60 unit/component tests passed across 16 files, the production build passed with `/join` dynamically rendered, and all 20 Playwright tests passed. `npm audit --audit-level=high` found zero vulnerabilities.

The database suite covers grants, schema/indexes, campaign close, invalid capability/consent, Draft creation, idempotency, normalization, rate limits, finalisation, verified metadata, one unsent delivery placeholder, and absence of Guardian/certificate/count side effects. The final Docker-backed GitHub run passed all 144 pgTAP assertions across six files. GitHub Actions keeps separate Node 24 application and database jobs and remains independent of staging credentials.

## Staging and launch status

GitHub Actions run `31086282375` passed before remote mutation. The linked dry-run listed only `20260806080858_public_submission_flow.sql`; that migration was then applied to staging and confirmed in both local and remote migration history. Linked TypeScript types were regenerated after the push.

The post-migration security advisor returned no notices. The three actionable performance findings named for Section 3 are resolved: `submissions.trashed_by` is indexed, the staff-profile Auth lookup uses an init plan, and the duplicate permissive staff-profile SELECT policies are consolidated. The remaining performance notices are informational unused-index results expected on an empty staging database; no future workflow index was removed merely to silence them. [Supabase explains this informational lint here.](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

The staging smoke command is implemented but has not run because ignored `.env.local` does not yet contain the real staging application values. No smoke result is claimed. Section 3 remains one live verification short of its full definition of done.

Known launch blockers remain: final legal consent wording, final campaign terms, privacy/retention period, minor-participant policy, email sender/domain, campaign dates, production project, production rate limiting, Turnstile, and final image/media rights.

## Next section

Section 4 adds the protected Reviewer/Admin moderation workflow, approval/publication processing, Guardian-number assignment, public Movement Wall, and live database-derived count—without implementing certificate or email delivery.
