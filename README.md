# Vriksha Vvandhan

Vriksha Vvandhan is Mirchi's Raksha Bandhan campaign inviting people to protect a tree. The repository now contains the premium, static public experience from Section 1 and the secure data, staff-auth and media foundation from Section 2.

## Six-section roadmap

1. **Premium public experience** — responsive campaign homepage, static `417 / 983` tracker and progressively enhanced Promise Reel. Complete.
2. **Backend foundation** — Supabase schema, RLS, staff roles, Storage rules, server clients, authorization DAL, tests and CI. Complete in source; local database execution requires Docker.
3. **Public submission flow** — display name, email, one photograph, publication consent, terms acceptance and confirmation.
4. **Internal operations and publication** — staff portal, moderation workflow, Guardian assignment, public Movement Wall and live derived count.
5. **Certificates and email** — certificate generation plus submission, approval and final-rejection delivery.
6. **Hardening and launch** — retention, load, accessibility, security and operational launch checks.

Section 2 does not add a public form, upload endpoint, portal UI, moderation operation, live counter, certificate or email sender. The homepage remains static and buildable without Supabase credentials.

## Local application setup

Requirements: Node.js 22.22.2, 24.15.0, or a later supported even-numbered release, plus npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Supabase values may remain empty when working only on the public homepage. Backend modules validate them lazily when called.

## Local backend setup

Docker Desktop or another Docker-compatible runtime is required by the Supabase CLI.

```bash
npm run db:start
npm run db:reset
npm run db:buckets:seed
npm run db:lint
npm run db:test
npm run db:types
npm run db:types:check
npm run db:stop
```

See [BACKEND_SETUP.md](docs/BACKEND_SETUP.md) for environment, staff provisioning and hosted-project guidance.

## Application commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

## Environment variables

```dotenv
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

Only the publishable key is browser-safe. `SUPABASE_SECRET_KEY` bypasses RLS and must remain in server-only environments.

## Current limitations

- The visible `417 / 983` tracker is still explicit Section 1 seed content.
- Docker is required to apply and execute the local migrations, bucket seed and pgTAP suites.
- Staff Auth users are provisioned manually; public participants never receive accounts.
- Legal consent text, retention, email templates/domain, geography, dates, media rights, final wordmark and post-983 behaviour remain unresolved.
- Local Docker-backed database verification remains blocked until sufficient Mac disk space is available.

The hosted staging project has been linked and its Section 2 migrations, RLS,
policies and Storage bucket restrictions have been verified. No hosted
credential is committed; production remains untouched.

Section 3 is the controlled public submission workflow built on this private foundation.
