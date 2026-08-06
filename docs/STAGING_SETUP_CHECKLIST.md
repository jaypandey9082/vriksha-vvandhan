# Hosted Staging Setup Checklist

## Project boundary

- [x] Staging project created manually.
- [x] Repository linked to staging.
- [x] No production project created, linked or modified.
- [x] No hosted credential added to Git.

## Database

- [x] All three local migration timestamps match the linked migration history.
- [x] Nine expected public tables verified.
- [x] RLS enabled on all nine public tables.
- [x] Ten expected read policies verified.
- [x] `anon` has no public-table grant.
- [x] `authenticated` has only RLS-governed `SELECT` grants.
- [x] Seven expected enums and five workflow states verified.
- [x] Expected private helpers and canonical count function verified.
- [ ] `db push --linked --dry-run` completes with `SUPABASE_DB_PASSWORD` supplied securely. The current attempt reached the linked project but stopped at password authentication; no migration was pushed.

## Storage

- [x] `submission-originals` is private, 15 MiB, JPEG/PNG/WebP/HEIC/HEIF.
- [x] `published-images` is public, 5 MiB, JPEG/PNG/WebP.
- [x] `certificates` is private, 10 MiB, PDF/PNG.
- [x] Bucket settings applied through `supabase seed buckets --linked`.
- [x] Final settings re-queried from linked `storage.buckets` metadata.
- [x] No participant file uploaded and no `storage.objects` row modified directly.

## Generated types and application

- [x] Linked `public,private` TypeScript types generated.
- [x] Nine tables, seven enums and expected functions confirmed in output.
- [x] Typecheck passed.
- [x] Lint passed.
- [x] 31 unit tests passed.
- [x] Production build passed.
- [x] Repository dev server stopped by verified PID before E2E.
- [x] 14 Playwright tests passed, including accessibility and Promise Reel checks.

## CI and release boundary

- [x] Workflow supports push, pull request and manual dispatch.
- [x] Application job installs, lints, typechecks, tests, builds and runs Playwright.
- [x] Database job uses an ephemeral local Supabase stack with reset, bucket seed, lint, pgTAP, type drift and typecheck.
- [x] Database cleanup runs even after failure.
- [x] No hosted staging secret is used by database CI.
- [ ] Final application and database jobs are green for the pushed Section 2.2 commit.
- [x] Local Docker limitation documented.
- [x] No Section 3 feature added.
