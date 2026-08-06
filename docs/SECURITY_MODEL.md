# Security Model

## Boundaries

- Anonymous visitors have no direct table writes. Section 3 mutations pass through same-origin, server-validated Route Handlers and service-role-only RPCs.
- Staff identity is verified by Supabase Auth. Portal access additionally requires an active `staff_profiles` row.
- Reviewer/Admin roles are read from the database, not request fields or editable user metadata.
- Row Level Security provides the database read boundary; no broad direct mutation policy is granted even to Admin.
- The server-only Data Access Layer verifies claims again, loads the active profile and returns only a minimal `StaffSession` DTO.
- Next.js Proxy only refreshes `/admin` and `/auth` sessions and performs an optimistic verified-identity check. It never queries roles and is not the final authorization boundary.

## Secrets and private data

The publishable key may reach the browser. `SUPABASE_SECRET_KEY` is validated lazily inside server-only code, bypasses RLS and must never be logged or returned. Participant email is readable only to Admin. Original photographs stay in the private `submission-originals` bucket and are viewed using short-lived signed URLs. The public bucket is only for trusted approved derivatives.

## Security-definer helpers

Private RLS helpers use an empty fixed `search_path`, schema-qualified references and minimum execute grants. Default table/function exposure is revoked. Section 4 grants only the anonymous-safe public summary/list functions and purpose-specific authenticated staff functions; each staff function re-checks active role and workflow state inside the transaction.

The two Section 3 public-schema RPCs are also security-definer with empty search paths, fully qualified objects, explicit validation, transaction-local advisory locking, and execute granted only to `service_role`. The browser capability is cryptographically random; only its SHA-256 hash reaches the database. Public errors never include raw database/Storage messages, participant values, secrets, or request tokens.

Signed upload creation fixes the UUID-based private path and disables overwrite. No anonymous Storage policy is added. Finalisation trusts neither filename, declared MIME, size, dimensions, nor checksum from the browser: the Node.js server downloads and inspects the stored bytes with bounded Sharp settings.

## Advisor review

The post-migration staging Security Advisor reports zero errors. Its 12 warnings are the expected generic warning class for intentionally callable `SECURITY DEFINER` RPCs: two anonymous-safe projections and ten authenticated, role-checking staff/publication functions. Every function uses an empty fixed search path, explicit grants, validated arguments, and internal authorization; base-table RLS remains closed. The Performance Advisor reports zero errors/warnings and 11 informational unused-index notices on the newly exercised staging dataset. Those workflow, lookup, and foreign-key indexes are retained until representative production traffic exists. See the [Supabase Database Linter guidance](https://supabase.com/docs/guides/database/database-linter).

## Permanent deletion order

Hard deletion verifies Admin, requires the record already be in Trash, a reason, and literal `DELETE` confirmation in the UI. Server orchestration removes original, public variants and any certificate through the Storage API and stops if cleanup fails, then invokes the database delete transaction with a non-sensitive audit event. Storage objects are never deleted with raw SQL.
