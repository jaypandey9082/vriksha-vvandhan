# Storage Lifecycle

## Buckets

- `submission-originals`: private, 15 MiB, JPEG/PNG/WebP/HEIC/HEIF.
- `published-images`: public read, trusted server write, 5 MiB, WebP/JPEG/PNG.
- `certificates`: private, trusted server write, 10 MiB, PDF/PNG.

Buckets are declared in `supabase/config.toml` and created with the current bucket-seeding command. The Storage schema is not altered by application SQL.

## Paths

- Original: `<submission-uuid>/original.<allowlisted-extension>`
- Public card: `card/<guardian-number>-<immutable-version>.webp`
- Public full: `full/<guardian-number>-<immutable-version>.webp`
- Certificate: `<submission-uuid>/vriksha-guardian-<guardian-number>-<immutable-version>.pdf`

Paths contain no names, emails, locations, free-form input or original filenames. Public paths are immutable/versioned and never overwritten.

## Lifecycle

Section 3 requests a non-overwriting signed upload for the generated private path, then downloads and verifies the stored bytes before Pending Review. Expired Draft cleanup removes any matching private object through the Storage API before deleting the Draft; a 24–48-hour manual cadence is recommended until Section 6 scheduling. Invalid prepared objects are also removed with their Draft, while transient verification failures preserve both for retry.

Section 4 uses five-minute signed URLs for authorized review. Publication downloads the private original server-side, auto-rotates it, strips metadata, creates a 640×800 WebP card and an at-most-1600×1600 WebP full image, uploads immutable versioned paths, then commits their dimensions/bytes atomically with Published state. Partial uploads are removed on failure.

Trash immediately hides the row and removes public variants through the Storage API while retaining the original for recovery. Published restore generates a new immutable version before restoring public visibility. Permanent deletion removes original, public variants and any certificate through the API before deleting the database record. Section 5 will create the private certificate object.
