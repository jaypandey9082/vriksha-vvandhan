# Private Review Image Pipeline

## Asset roles

`submission-originals/<submission-id>/original.<ext>` is the permanent private source. It is used for full detail review and trusted publication processing; the moderation queue never requests it.

`submission-originals/<submission-id>/review-thumb.webp` is a staff-only queue derivative. It is always a 240 × 300 WebP generated with Sharp at quality 70, auto-rotated, centre-cropped to 4:5, stripped of metadata and rejected above 120 KiB. The normal target is 30–80 KiB, while simple synthetic images may be smaller.

Public publication assets remain conceptually and physically separate in `published-images/card/` and `published-images/full/`. Review thumbnails never enter the public bucket.

## New-submission flow

The trusted finalisation service downloads and verifies the prepared private original once. Those verified bytes are passed directly to the thumbnail generator, avoiding a second download. It uploads the private derivative through the Storage API and atomically finalises the submission with the derivative metadata.

Thumbnail generation or upload is a non-critical derivative step. A transient failure does not duplicate or block the participant submission: it still enters Pending Review with nullable thumbnail metadata and the bounded staging backfill can retry it. Invalid original content remains rejected by the existing verifier.

The database stores only the opaque path, dimensions, byte size and generation timestamp. Constraints require an all-null record or the exact `<submission-id>/review-thumb.webp`, 240 × 300 dimensions and 1–122,880 bytes. No signed URL is persisted.

## Queue loading and signing

The Server Component queries at most 26 minimal rows to render a 25-row keyset page and determine whether a next page exists. It strips the private path before passing data across the client boundary. Row text and fixed 96 × 120 skeletons are server-rendered immediately.

After hydration, one focused Client Component sends at most 25 opaque submission IDs to the authenticated, no-store `/api/admin/review-thumbnails` endpoint. The endpoint rechecks active staff access, performs one bounded media query, deduplicates private paths and uses Supabase Storage `createSignedUrls` once. It returns only 10-minute signed URLs mapped to submission IDs. A failed batch or individual image yields a neutral fallback without failing the list.

Queue images use native `<img>` with explicit width/height, `loading="lazy"` and `decoding="async"`. The source is already a tiny final-size WebP, so routing it through Next Image would add an unnecessary server optimisation hop and cache churn for ephemeral query-string URLs. Queue detail links use normal document navigation so Next does not prefetch and sign full originals from the list.

## Detail page

The detail page signs and shows the private review thumbnail first. Only that specific detail request also signs the private original. The full original is lazy-decoded inside the focal-point editor with the thumbnail retained as the loading preview. Signed URLs remain in page memory only and use the same 600-second internal TTL.

## Backfill and recovery

Dry-run is the default:

```bash
npm run staging:backfill-review-thumbnails
```

Execute only after reviewing the allowlisted staging plan:

```bash
npm run staging:backfill-review-thumbnails -- --execute
```

The script refuses non-staging and unapproved project URLs, processes at most 25 missing rows by default (maximum 50), uses Storage APIs only, skips complete metadata, recovers a valid object left by an interrupted metadata update, continues after safe per-ID failures and is idempotent. It snapshots and verifies submission statuses, public count, email placeholders and certificates before/after.

## Performance budget and measurement

Before this change, the 15 retained staging images averaged 277,652 bytes (median 214,850; largest 515,294), for 4,164,784 bytes total and an estimated 6,941,307 bytes for 25 similar rows. The current list made 15 parallel single-object signing calls, measured at 647.2 ms; the installed batch API signed the same paths in one 207.5 ms request. These hosted measurements include network variability.

Use the read-only post-backfill benchmark to record the actual derivative distribution and batch latency without logging any URL or participant data:

```bash
npm run staging:benchmark-review-thumbnails
```

CI deliberately does not enforce brittle wall-clock thresholds. It enforces the 120 KiB output maximum, one batch request for 25 synthetic rows, no original/path value in the browser request, fixed dimensions, lazy decoding and queue-text independence.
