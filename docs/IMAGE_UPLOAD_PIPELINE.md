# Image Upload Pipeline

## Input and browser preparation

- Accepted input: JPEG, PNG, WebP, HEIC, or HEIF, up to 15 MiB.
- SVG, video, empty files, and other MIME types are rejected.
- Preferred output: WebP; JPEG is the compatibility fallback.
- Target output: approximately 1.5 MiB; hard maximum: 2 MiB.
- Maximum width or height: 2,560 pixels.
- EXIF/GPS preservation is disabled.
- Compression runs in a project-owned module Worker when supported, with a focused main-thread fallback. No CDN worker is used.

Some browsers cannot decode HEIC/HEIF. In that case the participant receives a specific explanation and is asked to take a new photo or choose JPEG, PNG, or WebP. The unprepared original is never uploaded automatically.

## Private signed upload

The prepare endpoint hashes the browser-only request token and atomically creates or resumes a Draft. The server generates `<submission-uuid>/original.webp` or `.jpg`, requests a short-lived signed upload token with overwrite disabled, and returns only the private bucket, fixed path, token, Draft status, and expiry. The browser uploads the prepared bytes directly to private Supabase Storage.

## Trusted verification and finalisation

The Node.js finalise endpoint downloads the exact private object using the service client. Sharp runs with warning failure, bounded pixels, at most four input channels, one page, and no unlimited mode. The server accepts only genuine WebP or JPEG, enforces the dimension and 2 MiB limits, and computes SHA-256, byte size, width, height, and detected MIME type from the downloaded bytes.

An atomic database function then records verified metadata, moves the Draft to Pending Review, and creates one unsent email-delivery placeholder. It never assigns a Guardian number, publishes an image, generates a certificate, or changes the public count.

## Expiry and cleanup

Drafts expire after the configured 1,440 minutes. `npm run cleanup:drafts:dry-run` reports expired Draft IDs and fixed Storage paths in bounded batches. `npm run cleanup:drafts` removes an existing object through the Storage API and then deletes only the still-expired Draft row. Both commands require `SUPABASE_TARGET_ENVIRONMENT=staging`; no production cleanup is configured. Run the cleanup manually every 24–48 hours until Section 6 introduces scheduling.

Section 4 will create approved, immutable public image variants; Section 3 never makes the private original public.
