# Company Ownership Transfer Verification

Verified on 2026-08-06 against the local `main` checkout, the canonical company GitHub repository, and the linked Supabase staging project. This was a verification-only pass. It did not rotate credentials, change product behavior, create production resources, inspect participant records, or upload/delete Storage objects. Section 3 was already present at the starting commit; this verification did not add or change Section 3 functionality.

## Repository and GitHub

- Starting branch and commit: `main` at `0f4ef490be9701a98469cff019a32c63fb2d533c`.
- Canonical origin: `https://github.com/mirchi-vriksha/vriksha-vvandhan.git`.
- Local `HEAD` and `origin/main` matched after fetching the company repository.
- GitHub reports `mirchi-vriksha` as an Organization, `mirchi-vriksha/vriksha-vvandhan` as public, and `main` as the default branch.
- GitHub CLI authenticated as `jaypandey9082`; the account has the repository's `write` role. The account's company-control status must be confirmed administratively.
- The original personal remote redirected to the transferred repository. `origin` was updated to the canonical company URL supplied by the repository owner.
- The required historical work remains present: public foundation `1b98487`, mobile-first hero `a7c8d17`, light visual system `69cdce2`, Promise Reel `242a58e`, backend foundation `07a938a`, hosted staging verification `432ef24`, and final Section 2.2 report `f1134f2`.
- The expected workflow, Supabase configuration/migrations/tests, generated database types, and Section 2 documentation remain present.

### GitHub Actions

`.github/workflows/ci.yml` still supports `push`, `pull_request`, and `workflow_dispatch`. Its application job installs dependencies, lints, typechecks, runs unit tests, builds, installs Chromium, and runs Playwright. Its database job starts/reset local Supabase, seeds bucket definitions, lints the database, runs pgTAP, checks type drift, typechecks, and always stops Supabase.

CI run [`31087289554`](https://github.com/mirchi-vriksha/vriksha-vvandhan/actions/runs/31087289554) completed successfully for starting commit `0f4ef49`: both `application` and `database` jobs were green. Successful run discovery and inspection confirm that Actions remained operational after transfer. The authenticated collaborator cannot read the repository-level Actions permission setting through the API.

### GitHub ownership controls

- One organization admin, `digitalaienil-commits`, was visible through the organization-members API.
- A second company-controlled owner was not independently verified. Private owner membership may not be visible to the current collaborator.
- No `main` branch-protection configuration was returned. Required CI checks are therefore not confirmed as enforced.
- `jaypandey9082` has push-capable `write` access but is not shown as the organization owner.

GitHub ownership is transferred at the repository level, but organizational redundancy is not fully verified until a company owner confirms at least two company-controlled owners and protects `main` with the application and database CI checks.

## Supabase staging

- Supabase CLI version: `2.111.0`.
- Company organization shown by the authenticated CLI: `digitalaienil-commits's Org` (`mvdurfgwuliydgcdintu`).
- Linked project: `vriksha-vvandhan-staging` (`oroaheeamreebbohexoc`), region `ap-southeast-2`, status `ACTIVE_HEALTHY`.
- The project name, linked state, and absence of a production link confirm that only staging was queried.
- The CLI profile can access the company organization/project, but the CLI does not expose the profile's human account identity, organization role, owner count, or billing role. Those controls require dashboard verification.

### Migrations and database state

All four migrations matched locally and remotely:

- `20260805114319_create_campaign_schema.sql`
- `20260805114321_security_helpers_and_rls.sql`
- `20260805114323_campaign_count_function.sql`
- `20260806080858_public_submission_flow.sql`

`supabase db push --linked --dry-run` connected successfully and reported that the remote database is up to date, with no migrations, seeds, or roles pending.

Read-only hosted metadata queries confirmed:

- Exactly nine expected public application tables exist.
- RLS is enabled on all nine tables.
- The current nine-policy read set is present, scoped to `authenticated`; no Storage policy or broad public write policy exists.
- Seven expected public enums exist with the expected values.
- `public.guardian_number_seq` exists.
- All seven expected private helper/trigger/count functions exist; the four authorization helpers remain security-definer functions.
- `campaign_settings.target_count` is `983` and `submissions_open` is `false`.
- `campaign_settings` has no `current_count` column.

No participant rows, contact records, private email data, or object contents were queried.

### Storage

| Bucket | Visibility | Maximum size | Allowed MIME types |
| --- | --- | ---: | --- |
| `submission-originals` | Private | 15 MiB | JPEG, PNG, WebP, HEIC, HEIF |
| `published-images` | Public | 5 MiB | JPEG, PNG, WebP |
| `certificates` | Private | 10 MiB | PDF, PNG |

All three bucket definitions match the required hosted configuration. No Storage object was uploaded, changed, or deleted, and `storage.objects` was not modified directly.

### Generated database types

Linked `public,private` TypeScript types were generated into `/tmp/vriksha-linked-types.ts`. The 720-line output was byte-for-byte identical to `src/lib/supabase/database.types.ts`; the repository normalization also reported a match. The temporary file is not part of the repository.

`npm run db:types:check` was also invoked, but its local type-generation path could not inspect Supabase because Docker was not running. That invocation is not counted as a local database pass. The linked comparison above passed, and CI run `31087289554` independently passed the Docker-backed local type-drift job.

## Environment and credential safety

- `.env.local` and other `.env*` files are ignored; no real environment file is tracked.
- `.env.example` contains only the four required variable names with empty values.
- Signature scans of tracked content and Git history found no Supabase secret key, GitHub personal token, credential-bearing Postgres URL, or database password.
- No secret or connection string is included in this report.
- This checkout has no `.vercel` project link and no available authenticated Vercel CLI, so Vercel Preview/Production variable ownership and values were not queried.

Ownership transfer can leave previously issued credentials valid. If personal credentials previously had access or were stored outside company control, company administrators should manually rotate the Supabase secret/service-role key, database password, GitHub tokens, and any Vercel-held values. After rotation, update the ignored local `.env.local`, Vercel Preview variables, Vercel Production variables when production is authorized, the company password manager, and approved CI secrets. Do not send credentials through chat.

## Application verification

- `npm install`: passed; dependencies were already current and the audit reported zero vulnerabilities.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 16 files and 60 tests.
- `npm run build`: passed. The homepage and legal routes remain statically prerendered; submission API routes and `/join` remain dynamic as expected.
- `npm run test:e2e`: passed, 20 Chromium tests. Coverage includes console errors, Promise Reel behavior, reduced motion, no-JavaScript fallback, mobile overflow, legal navigation, and axe accessibility checks.

The premium public website and Promise Reel remained unchanged by this documentation-only verification.

## Manual actions remaining

1. From a company-owner GitHub account, confirm there are at least two company-controlled organization owners. Add a second owner if necessary.
2. Protect `main` and require the green `application` and `database` CI checks before merge/push according to company policy.
3. Confirm `jaypandey9082` is an approved company collaborator; remove or downgrade personal access only after backup company ownership and push access are proven.
4. In the Supabase dashboard, confirm at least two company-controlled organization owners, company-controlled billing, project-settings access, and key-rotation authority.
5. Confirm which account owns the current Supabase CLI session. If it is personal, run `npx supabase logout` followed by `npx supabase login` and authenticate with a company-controlled account; never paste an access token into chat.
6. Rotate prior personal Supabase/GitHub/database credentials if they remain valid, then update the approved secret stores listed above.
7. In the company Vercel project, verify Preview variables now and Production variables only when production setup is authorized; this repository is not locally linked to Vercel.
8. Keep personal access until company push access, CI, Supabase administration, rotation authority, billing, and a second owner are all confirmed.

## Completion assessment

The GitHub repository transfer, canonical remote, collaborator push permission, CI, linked Supabase staging project, migration history, database/RLS state, Storage configuration, and generated types are verified intact. The transfer is **not yet fully complete** because second-owner redundancy, Supabase owner/billing roles, the CLI account's company identity, Vercel environment ownership, credential rotation, and `main` protection still require company-admin confirmation or action.
