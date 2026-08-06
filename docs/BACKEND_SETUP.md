# Backend Setup

## Requirements

Use Node.js `22.22.2`, `24.15.0`, or a later supported even-numbered release, npm, the pinned Supabase CLI, and Docker Desktop (or a Docker-compatible runtime) for local database work.

```bash
npm ci
cp .env.example .env.local
```

Keep real values only in `.env.local` and later in Vercel Preview environment variables. Never commit the file or print the server secret.

## Local backend

```bash
npm run db:start
npm run db:reset
npm run db:buckets:seed
npm run db:lint
npm run db:test
npm run db:types
npm run db:types:check
npm run typecheck
npm run db:stop
```

`db:reset` applies every migration to a fresh local database and runs the intentionally participant-free seed. Bucket seeding reads the three definitions from `supabase/config.toml`. `db:types:check` generates an ignored temporary file and fails on structural drift instead of overwriting the committed linked snapshot. The comparison ignores only the generated `__InternalSupabase.PostgrestVersion` block because linked generation includes the hosted service version while local generation omits it, and canonicalizes final line terminators because the two generation modes emit different trailing newline counts. Tables, relationships, functions and enums remain strict.

The current Mac cannot run this sequence until sufficient disk space is available for Docker. GitHub Actions runs the same database checks against a local ephemeral stack and always stops it.

## Linked staging verification

The staging project was created manually and linked outside source control. Confirm the link without printing the project reference or credentials:

```bash
npx supabase migration list --linked
npx supabase db push --linked --dry-run
```

`db push --dry-run` requires the database password through the process environment or secure CLI credential storage. Do not put it in `.env.example`, documentation, a command transcript or Git. In the Section 2.2 verification environment the password was unavailable, so the dry-run stopped at authentication; migration history and linked read-only schema queries were used to verify the remote state, and no push was repeated.

Read-only linked schema checks use the Management API:

```bash
npx supabase db query --linked "select table_name from information_schema.tables where table_schema = 'public' order by table_name;"
npx supabase db query --linked "select schemaname, tablename, policyname from pg_policies where schemaname = 'public' order by tablename, policyname;"
npx supabase db query --linked "select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;"
```

Treat `storage` metadata as read-only. Apply bucket visibility, size and MIME changes through the declarative configuration:

```bash
npx supabase seed buckets --linked
```

Generate authoritative staging types without hand-editing them:

```bash
npx supabase gen types --lang typescript --linked --schema public,private > src/lib/supabase/database.types.ts
```

After generation, run the complete application suite and inspect the diff before committing.

## Section 3 staging operations

Keep the four real staging application values in ignored `.env.local`. Guarded smoke and cleanup commands also require `SUPABASE_TARGET_ENVIRONMENT=staging`.

After database CI is green:

```bash
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase gen types --lang typescript --linked --schema public,private > src/lib/supabase/database.types.ts
npm run test:staging:submission
```

The smoke command temporarily opens staging submissions, creates a generated non-personal image, exercises prepare → signed upload → finalise, verifies Pending Review/private Storage/no Guardian/no count change, then deletes the object/row and restores the original campaign-open state. It refuses to run unless staging is explicitly marked. Never run it against production.

Expired Drafts can be inspected and removed in bounded batches:

```bash
npm run cleanup:drafts:dry-run
npm run cleanup:drafts
```

The first command is read-only. The second removes a private object through the Storage API before deleting the still-expired Draft. Run manually every 24–48 hours; scheduling remains Section 6.

## Verified staging buckets

- `submission-originals`: private, 15 MiB, JPEG/PNG/WebP/HEIC/HEIF.
- `published-images`: public, 5 MiB, JPEG/PNG/WebP.
- `certificates`: private, 10 MiB, PDF/PNG.

Only trusted server code may write. Do not add broad public write policies, upload participant files during verification, or modify `storage.objects` directly.

## First staff accounts

Create staff Auth users manually with controlled Mirchi email addresses. Public signup remains disabled. An authorized database administrator then inserts the matching UUID, display name and role into `public.staff_profiles`. Create the first Admin this way, then Reviewer profiles. Deactivate access with `active = false`; do not delete audit history merely to revoke access.

An Auth user alone grants no portal access. An active database profile is mandatory.

## Section 4 staging operations

After database CI is green, preview and apply the linked migration, regenerate linked types, then run the guarded moderation smoke:

```bash
npx supabase db push --linked --dry-run
npx supabase db push --linked
npx supabase gen types typescript --linked --schema public,private > src/lib/supabase/database.types.ts
npm run test:staging:moderation -- --execute
```

The smoke requires `SUPABASE_TARGET_ENVIRONMENT=staging` and creates generated temporary Admin/Reviewer users, profiles, submissions, originals, and public variants. It verifies recommendation, approval instead, publication, count, Movement, Trash, regenerated restore, permanent deletion, direct Admin rejection, and untouched email/certificate placeholders. Its cleanup restores the original count and removes every temporary resource. Never run it against production.

For a real staff member, first create the Auth user manually in the company dashboard, then dry-run and execute the profile bootstrap:

```bash
npm run staff:bootstrap -- --email=staff@example.com --display-name="Staff name" --role=admin
npm run staff:bootstrap -- --email=staff@example.com --display-name="Staff name" --role=admin --execute
```
