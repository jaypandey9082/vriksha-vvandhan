# Section 4 Report

## Outcome

Section 4 is complete on the company `main` branch and verified against staging. Starting commit: `f31c823e962131be5e594fb274648fad4ca213eb`. Migration: `20260806174500_staff_moderation_and_publication.sql`. No dependency was added for Section 4; the existing exact `sharp` dependency powers trusted WebP generation.

The migration adds public version, card/full dimensions and byte sizes to `submission_media`; tightens the Published media/count rule; and adds Guardian reservation, review-field, recommendation, final-rejection, publication, Trash, restore, delete, staff-management, settings, public-summary and public-Movement functions. Anonymous execution is limited to the two safe public projections. Guardian reservation is service-only. Purpose-specific staff functions are authenticated and enforce the active database role internally.

## Product delivered

- Invite-only `/auth/login`, callback and logout with active-profile enforcement and safe internal redirects.
- Dynamic noindex `/admin` Overview, bounded queue, signed-thumbnail detail, focal selector, role-specific navigation, Team and Settings.
- Reviewer approval/recommendation; Admin direct/final rejection, approval instead, Trash, regenerated restore and permanent delete.
- Server-only immutable WebP publication with metadata stripping, partial-upload cleanup, Guardian non-reuse and atomic database publication.
- Real cached homepage count, honest disconnected state, six-entry approved-preview threshold, `/movement`, keyset Load More and accessible full-image dialog.
- `not_started` certificate/email placeholders only. No generator or sender exists in Section 4.

## Verification on 2026-08-06

- Local lint and TypeScript: pass.
- Unit/component: 73 tests across 23 files, pass, including the production-disable gate for the staff E2E adapter.
- Production build: pass; `/` and `/movement` use 30-second revalidation and `/admin` remains dynamic.
- Playwright: 28/28 pass, including credential-free Reviewer/Admin moderation, direct-route denial, keyboard operation, portal axe, movement overflow and public axe coverage.
- GitHub CI #17: application and database jobs pass. Database result: 7 files, 201 pgTAP assertions, schema lint and generated-type parity pass.
- Staging migration: dry-run listed only Section 4; apply succeeded; local/remote migration histories match.
- Linked staging types: regenerated and byte-for-byte unchanged.
- Staging smoke: pass. Count increased on publish, returned on Trash, increased on restore, and returned to its original baseline after cleanup. Generated Auth users, profiles, records, originals and variants were removed.
- Security Advisor: zero errors; 12 documented warnings for intentionally callable, internally authorized `SECURITY DEFINER` functions.
- Performance Advisor: zero errors/warnings; 11 informational unused-index notices retained because staging is new and the indexes support workflow/lookups/foreign keys.

The first CI retry had a Supabase-container 502 after migrations applied; CI #17 then passed the complete database job. Local Docker remained unavailable, so Docker-backed database truth comes from the green GitHub runner rather than a claimed local database run.

## Safety confirmation

No `.env.local`, secret, production URL, password, real participant record or generated smoke identity was committed. No production resource was touched. No certificate was generated. No campaign email was sent. No Section 5+ feature was implemented.

## Next section

Section 5 turns the existing `not_started` certificate and email placeholders into idempotent certificate generation and transactional approval/rejection delivery, without changing the Section 4 moderation contract.

## Private review-thumbnail performance hardening

The queue previously selected each `original_path`, created one signed URL per row (parallel but still up to 25 Storage HTTP calls), waited for all signing before returning the page, and sent full originals to 56×70 display boxes. The retained staging originals measured 277,652 bytes average, 214,850 median and 515,294 largest. Fifteen individual sign calls took 647.2 ms versus 207.5 ms for one supported batch call; the database metadata query took 722.3 ms on that hosted run. Network variability applies, but the architectural waste was unambiguous.

The hardened path adds constrained private 240×300 quality-70 WebP review derivatives, automatic generation during trusted public finalisation, a staging-only dry-run-first backfill, 25-row keyset pagination, one authenticated batch-sign endpoint and fixed 96×120 native lazy images. Server-rendered text no longer waits for Storage signing or image bytes. Private paths do not cross the client boundary, normal queue links do not prefetch full originals, and signing/image failures retain a usable text queue with a neutral fallback.

The detail page now shows the review thumbnail first and uses it as the loading preview for the full original. Original signing is limited to the selected detail request. The queue still omits audit history, Reviewer email/contact data and certificate detail; these existing deliberate boundaries were retained. No speculative new database index or observability dependency was added because the page remains bounded and existing status/time indexes cover the current filters.

Actual post-backfill thumbnail sizes, migrated record count, final CI run and hosted Advisor results are recorded after the staging-only rollout. The architecture, failure contract and benchmark command are documented in `docs/PRIVATE_REVIEW_IMAGE_PIPELINE.md`.
