# Backend Setup

## Local requirements

Install Node.js 20.9+, npm and Docker Desktop (or a Docker-compatible runtime). The pinned Supabase CLI is a development dependency.

```bash
npm ci
cp .env.example .env.local
npm run db:start
npm run db:reset
npm run db:buckets:seed
```

Use the local URL and publishable/secret keys printed by `supabase status` in `.env.local`. Never commit that file.

## Validation and type generation

```bash
npm run db:lint
npm run db:test
npm run db:types
npm run db:types:check
npm run typecheck
npm run db:stop
```

`db:reset` applies every versioned migration from an empty local database and then runs the intentionally empty production seed. Bucket seeding is separate and uses `config.toml`. `db:types:check` generates to an ignored temporary file and fails instead of overwriting the committed snapshot.

## Hosted setup (manual, not performed by this repository)

1. Create separate Supabase projects for staging and production in the Supabase dashboard.
2. Authenticate the CLI, run `npx supabase link --project-ref <verified-project-ref>` and verify the selected project before any push.
3. Preview reviewed migrations with `npx supabase db push --linked --dry-run`, apply them with `npx supabase db push --linked`, then create declared buckets with `npx supabase seed buckets --linked`.
4. Copy only the project URL/publishable key into public deployment variables and the secret key into server-only deployment variables.
5. Never connect CI or local tests to production.

No hosted project or credential is created by Section 2.

## First staff accounts

Create staff Auth users manually in the Supabase dashboard using controlled Mirchi email addresses. Public signup is disabled. After the Auth user exists, an authorized database administrator inserts the matching UUID, display name and role into `public.staff_profiles`. Create the first Admin this way, then add Reviewer profiles with role `reviewer`. Deactivate access by setting `active = false`; do not delete audit history merely to revoke access. Never place passwords, magic links or real UUIDs in source control.

The Auth user alone grants no portal access. An active database profile is mandatory.
