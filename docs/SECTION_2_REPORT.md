# Section 2 Report

## Starting state and Promise Reel

Work began on `main` at `69cdce2`. The complete Section 1.2 Promise Reel was first preserved in its own `242a58e` commit. The light homepage, hero, static tracker, reel, campaign assets and downstream sections were not redesigned or connected to backend code.

## Dependencies

Production dependencies: `@supabase/supabase-js@2.112.1`, `@supabase/ssr@0.12.4`, `zod@4.4.3` and `server-only@0.0.1`. Development dependency: `supabase@2.111.0`. No ORM, carousel, image-processing, email, PDF or queue package was added.

## Migrations, enums and tables

Three ordered migrations create the campaign schema, private security helpers/RLS and the derived count. They define seven enums and nine public tables: staff profiles, campaign settings, submissions, private contacts, consents, media, certificates, email deliveries and explicit audit logs. The required settings singleton is migrated; the seed contains no participant/staff data. `guardian_number_seq` exists but is unused.

## Workflow and count

The only submission states are Draft, Pending Review, Rejection Awaiting Admin, Published and Rejected. Recommendation requires a participant-facing comment and Reviewer actor/time. Final rejection requires Admin actor/time; direct Admin rejection is supported and no Return to Reviewer state exists. `private.current_published_count()` reads only active Published, production records marked to count and never mutates data.

## RLS and Storage

All nine tables enable RLS. Anonymous, non-staff and inactive staff have no internal access. Reviewer reads only the specified non-contact operational data; Admin additionally reads contacts, all profiles and audit logs. Neither role receives broad direct writes. Three declarative buckets cover private originals, public approved variants and private certificates. Pure builders create immutable paths; the unexposed service helpers reserve non-overwriting original uploads and five-minute private review URLs.

## Supabase clients, Proxy and DAL

Browser, request-scoped server and RLS-bypassing service clients are separate. Environment validation is lazy. Next.js 16 Proxy refreshes only `/admin` and `/auth`, verifies claims and does not read roles. The server-only DAL is the final application boundary: it verifies claims, loads an active profile and returns only `userId`, nullable email, display name and role. Pure permission helpers encode Reviewer/Admin authority.

## Tests and commands

Unit coverage validates environment parsing, service-client options, safe DAL outcomes, permissions, paths and signed helper boundaries without network calls. Five pgTAP files cover schema, constraints, workflow, count and RLS. Package scripts provide start/stop/reset/lint/test/type generation/type drift/bucket seeding. CI separates credential-free application checks from Docker-backed local database checks and always stops Supabase.

Executed successfully on this machine: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` and `npm run test:e2e`. The build retained a static `/` route and the 14 browser/axe/reel regressions passed.

## Local database limitation

The current Mac has neither Docker nor Podman. `npm run db:start` returned `LegacyDockerLifecycleInspectError`, and `npm run db:types:check` returned `LegacyContainerRuntimeNotFoundError`. Therefore migrations, local buckets, pgTAP and true CLI-generated database types were not executed here. The committed type snapshot keeps application code typed but must be replaced by `npm run db:types` against the migrated local stack before release; the CI drift check intentionally enforces that requirement.

## Safety confirmations

No secret or real credential is committed. No hosted Supabase project was created. The public source tree imports no backend module, so the homepage remains credential-free and visually intact. No form, upload endpoint, Auth UI, portal, moderation operation, live count, dynamic gallery, certificate, email sender or other Section 3+ feature was added.

Section 3 will expose a controlled submission transaction and private signed upload on top of these boundaries.
