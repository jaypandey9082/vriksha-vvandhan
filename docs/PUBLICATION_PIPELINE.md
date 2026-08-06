# Publication Pipeline

## Trusted sequence

1. Re-verify an active Reviewer/Admin session and allowed workflow state.
2. Reserve a Guardian number through the service-only sequence function. Sequence gaps are accepted; numbers are never reused.
3. Download the private original from `submission-originals` on the server.
4. Auto-rotate, enforce a 25-megapixel input bound, strip metadata, and apply the saved normalized focal point.
5. Generate a 640×800 quality-80 WebP card and an at-most-1600×1600 quality-84 WebP full image.
6. Upload immutable `card/<guardian>-<version>.webp` and `full/<guardian>-<version>.webp` objects with one-year cache control and overwrite disabled.
7. Commit status, Guardian number, paths, version, dimensions, byte sizes, alt text, approval actor/time, and publication time in one authenticated RPC transaction.
8. Create one `not_started` certificate placeholder and one `not_started` approval-email placeholder.
9. Invalidate the `campaign-public` tag and affected Admin routes.

If either upload or the transaction fails, every successfully uploaded partial variant is removed. Private originals are never public and public APIs never return their path.

## Public delivery

`get_public_campaign_summary()` returns only the derived active count, target, label, and submissions-open switch. `list_public_movement_entries()` returns a bounded keyset page with Guardian number, display name, published date, approved public image metadata, alt text and focal point. It omits submission ID, email, original path, consent, rejection data and staff identity.

Homepage and `/movement` cache these projections for 30 seconds under `campaign-public`. Public mutations explicitly invalidate the tag. The homepage uses approved images only at six or more records; otherwise the existing curated campaign imagery remains clearly labelled. `/movement` loads 24 records at a time with a `(published_at, guardian_number)` cursor, de-duplicates additions, and uses an accessible native dialog for the full variant.

## Restore and removal

Trash removes active public visibility/count first and deletes old public objects through Storage. Published restore creates a new version; old URLs are never overwritten. Permanent deletion removes original, public variants and any certificate through Storage before deleting the row.
