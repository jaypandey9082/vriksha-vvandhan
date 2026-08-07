# Staging Demo Data

## Purpose and boundary

The staging demo dataset gives the Section 4 Campaign Desk realistic, removable content for queue, age, crop, status, rejection and responsive-layout testing. It is permitted only for the allowlisted hosted project `vriksha-vvandhan-staging` (`oroaheeamreebbohexoc`). Both scripts refuse every other project URL and every environment other than `SUPABASE_TARGET_ENVIRONMENT=staging`.

No production resource, real participant, real employee identity or deliverable is involved.

## Normal dataset

The normal seed converges staging to exactly 18 records:

| Status | Count |
|---|---:|
| Draft | 3 |
| Pending Review | 8 |
| Rejection Awaiting Admin | 4 |
| Rejected | 3 |
| Published | 0 |

Every normal submission has a deterministic, bounded seed ID, `source=internal_test`, `is_test=true`, `counts_toward_goal=false`, and an approved `Demo ` display-name prefix. Contacts use reserved `example.com` addresses. The two workflow identities are temporary staging-only Auth users marked in protected app metadata and paired with clearly named temporary staff profiles. Their random passwords exist only in process memory and are never logged.

The 15 non-Draft records use 15 distinct synthetic WebP originals and 15 generated 240×300 review thumbnails. They cover portrait, landscape and square dimensions, contain only abstract environmental artwork and `VRIKSHA TEST` labels, and are uploaded through the Supabase Storage API to normal `<submission-id>/original.webp` and `<submission-id>/review-thumb.webp` paths in the private `submission-originals` bucket. No generated image is committed to Git and `storage.objects` is never edited directly.

The seed uses consent version `staging-2026-08-v1`, matching `src/config/public-submission.ts`. Non-Draft records use the real finalisation RPC; rejection recommendations and confirmations use the real role-checked workflow functions so their audit events and `not_started` placeholders are realistic.

## Seed

Dry-run is the default:

```bash
npm run staging:seed-demo
```

Review the staging ref, baseline count, existing bounded-record count and proposed distribution. Then execute:

```bash
npm run staging:seed-demo -- --execute
```

Rerunning a complete seed is an idempotent no-op. A clearly bounded partial seed is removed in Storage-first order and recreated. An ambiguous identifier collision stops execution without changing the ambiguous record.

## Campaign count, email and certificate safety

Normal demo records cannot enter Published state and never count toward the campaign goal. The script reads `get_public_campaign_summary()` before and after seeding and fails if the count changes.

Email-delivery records may exist only as workflow-created `not_started` placeholders. The verification requires `attempt_count=0` with no provider ID or sent timestamp. No email API is called.

Normal demo records create no certificate row, PDF or Storage object. The verification fails if a certificate appears.

## Published demo mode

The normal seed follows safe Option A: Published-card UI is tested through the existing production-disabled application fixture adapter. `--include-published` is recognized as a sensitive explicit mode but this script deliberately refuses it; hosted Movement Wall publication requires a separate supervised run that records the baseline, uses the real Guardian/publication workflow and performs immediate verified cleanup. The script never weakens the `is_test=false` Published constraint and never resets or fabricates the Guardian sequence. Sequence gaps in staging are acceptable.

## Cleanup

Dry-run cleanup first:

```bash
npm run staging:cleanup-demo
```

It reports only counts: bounded submissions, status distribution, private/public files and temporary staff accounts. It never logs emails, credentials, tokens or keys.

Execute cleanup before campaign launch:

```bash
npm run staging:cleanup-demo -- --execute
```

Cleanup removes only records that match the deterministic ID, display-name, source and test/count markers. It removes public files (if separately authorized), private originals, private review thumbnails and certificate files through Storage APIs before audit rows, submissions and temporary Auth users. It then verifies no bounded records or objects remain and that the public count is unchanged. Repeated cleanup is a safe no-op.

If a separately supervised Published dataset ever exists, cleanup additionally requires:

```bash
npm run staging:cleanup-demo -- --execute --include-published
```

Never use either execution command against production.
