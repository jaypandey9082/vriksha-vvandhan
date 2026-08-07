# Build Status

| Section | Scope | Status |
|---:|---|---|
| 1 | Premium public site and Promise Reel | Complete |
| 2 | Secure database, staff Auth and Storage foundation | Complete and staging-verified |
| 3 | Public submission, private upload and confirmation | Source, CI, migration, linked types and advisors verified; staging smoke pending local credentials |
| 4 | Staff portal, moderation, publication, Movement Wall and live count | Complete; CI, staging migration, linked types, smoke and Advisors verified |
| 5 | Certificates, transactional email, Delivery Center and Admin XLSX export | CI, migration, linked types, certificate smoke, authenticated staging export and Advisors verified; email gate pending |
| 6 | Retention, load, security and launch hardening | Not started |

Section 5 adds the approved-master PDF renderer, private versioned certificate Storage, Resend processor, permanent database idempotency, Admin Delivery Center, private downloads, manual retry/regeneration, and audited seven-sheet export. Application/database CI is green; the staging migration, linked types, guarded certificate-only smoke, authenticated staging export, and live Advisors are verified. Email remains disabled by default. Completion is withheld until the explicit-recipient email and duplicate-retry smoke pass.

Staging UI testing also has a guarded, dry-run-first 18-record synthetic dataset with Storage-backed private images and bounded cleanup. See [STAGING_DEMO_DATA.md](STAGING_DEMO_DATA.md); it cannot target production and does not create Published records, certificates or sent email.
