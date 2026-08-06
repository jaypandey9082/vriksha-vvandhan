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

Section 3 will request a non-overwriting signed upload for the generated private path. Section 4 will use a short-lived signed URL for authorized review, create approved public card/full variants through the Storage API and record their paths. Trash retains objects so a record can be restored. Permanent deletion removes private original, public variants and certificate through the API before deleting the database record. Section 5 will create the private certificate object; Section 2 creates no file.
