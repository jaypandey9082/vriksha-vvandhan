# Section 2 Report

## Starting state

Section 2.2 started on `main` at `07a938ad78fcf7d5402b9869abaa964b94750812`. The hosted staging project had already been created manually and linked to this repository. No production project was created or accessed.

The Section 1 homepage, static `417 / 983` tracker, Promise Reel, campaign assets and public routes remain unchanged. Section 2 still adds no public form, upload endpoint, Auth UI, staff portal, moderation operation, live count, certificate generation or email delivery.

## Hosted migration and schema verification

Supabase CLI `2.111.0` reported the following local and linked migration timestamps as exact matches:

- `20260805114319_create_campaign_schema.sql`
- `20260805114321_security_helpers_and_rls.sql`
- `20260805114323_campaign_count_function.sql`

`supabase db push --linked --dry-run` was attempted but the direct Postgres connection could not authenticate because `SUPABASE_DB_PASSWORD` is not present in this environment. No migration was pushed again. The matching migration history plus linked Management API queries confirmed the migrated schema is present remotely.

The linked staging database contains exactly the nine expected public tables: `audit_logs`, `campaign_settings`, `certificates`, `email_deliveries`, `staff_profiles`, `submission_consents`, `submission_contacts`, `submission_media` and `submissions`. RLS is enabled on all nine. The ten expected read policies are present, `anon` has no table grants, and `authenticated` has only `SELECT` grants governed by RLS. No public function was exposed.

The private schema contains only the expected seven functions. The four security-definer authorization helpers have an empty search path and are executable only by `authenticated`; the count and trigger helpers are not granted to public roles.

## Locked workflow

The hosted enum contains only `draft`, `pending_review`, `rejection_pending_admin`, `published` and `rejected`. There is no Return to Reviewer status. The verified constraints preserve reviewer recommendation, Admin confirmation, Admin approval after a recommendation, and Admin-controlled trash metadata without granting broad direct writes or deletes.

Participant data remains split across display name, private email, photograph metadata, publication consent and terms acceptance. `private.current_published_count()` counts only Published, non-test, `counts_toward_goal = true`, non-trashed submissions.

## Storage verification

The three linked staging buckets were queried through the supported CLI Management API. `published-images` was initially private even though its size and MIME restrictions were already correct. The declarative bucket configuration was corrected and `supabase seed buckets --linked` updated all three bucket definitions. A second linked query verified:

| Bucket | Visibility | Maximum size | Allowed MIME types |
| --- | --- | ---: | --- |
| `submission-originals` | Private | 15 MiB | JPEG, PNG, WebP, HEIC, HEIF |
| `published-images` | Public | 5 MiB | JPEG, PNG, WebP |
| `certificates` | Private | 10 MiB | PDF, PNG |

No file was uploaded, no broad public write policy was created, and `storage.objects` was not modified directly.

## Linked database types

Real TypeScript types were generated from the linked `public` and `private` schemas. The fresh 679-line output was byte-for-byte identical to the existing uncommitted generated file. It contains the nine expected tables, seven enums and five callable private helper/count functions, with no unexpected table or function.

## Local application verification

The application was verified with Node `24.15.0`:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test`: 11 files and 31 tests passed, including Promise Reel coverage.
- `npm run build`: passed; `/` remains statically prerendered.
- `npm run test:e2e`: 14 Chromium tests passed, including mobile overflow, Promise Reel behavior and axe accessibility checks.

The repository-owned server on port 3010 was identified as PID 2707 through its parent command, stopped through its own terminal session, and the port was confirmed free. Playwright then started its configured isolated server on port 3000. An initial sandbox-only bind denial was resolved by rerunning with local-network permission; it was not an application failure.

## CI baseline and fixes

The pre-Section-2.2 run `31003569033` reached both jobs but failed for two concrete reasons:

- The application job used Node 20 while the locked `jsdom@30.0.1` requires Node 22.22.2 or 24.15.0 and newer supported releases.
- The database job started and reset Supabase, seeded buckets and passed database lint, but pgTAP schema assertions used ambiguous overloads and the Guardian uniqueness fixture violated workflow state before reaching the unique index.

The workflow now supports `push`, `pull_request` and `workflow_dispatch`, uses Node 24, retains all five pgTAP suites, checks generated-type drift, and always stops its local ephemeral Supabase stack. Final run [`31080762156`](https://github.com/jaypandey9082/vriksha-vvandhan/actions/runs/31080762156) passed both jobs: the application job completed lint, typecheck, 31 unit tests, production build and 14 Playwright tests; the database job completed start, reset, bucket seed, lint, all 98 pgTAP assertions, linked/local structural type-drift comparison, typecheck and cleanup.

## Local database limitation

Docker-backed verification remains unavailable on this Mac because the Data volume was nearly full and Docker image extraction failed. No Docker image, volume or unrelated user file was deleted. Local database execution is therefore delegated to the Docker-capable GitHub Actions database job.

## Safety confirmations

`.env.example` contains variable names only, `.env.local` is ignored and absent, and no project password, connection string, access token, publishable key or secret key is tracked. The hosted resource touched was the linked staging project only. No production resource and no Section 3 feature was created or modified.

## Ownership-transfer verification

On 2026-08-06, the repository remote, GitHub access and CI, linked company Supabase staging project, migrations, hosted database/RLS metadata, Storage buckets, generated types, environment safety, and application suite were reverified after ownership transfer. See `docs/COMPANY_OWNERSHIP_TRANSFER.md` for the evidence and remaining company-admin actions.
