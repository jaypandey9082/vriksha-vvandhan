# Build Status

| Section | Scope | Status |
|---:|---|---|
| 1 | Premium public site and Promise Reel | Complete |
| 2 | Secure database, staff Auth and Storage foundation | Complete and staging-verified |
| 3 | Public submission, private upload and confirmation | Source, CI, migration, linked types and advisors verified; staging smoke pending local credentials |
| 4 | Staff portal, moderation, publication, Movement Wall and live count | Complete; CI, staging migration, linked types, smoke and Advisors verified |
| 5 | Certificate generation and transactional email | Not started |
| 6 | Retention, load, security and launch hardening | Not started |

Section 4 adds invite-only Reviewer/Admin access, private signed review, atomic moderation/publication RPCs, immutable public WebP variants, the real homepage count, approved preview, and `/movement`. Certificate and email records remain `not_started`; no certificate or campaign email is generated or sent.

Staging UI testing also has a guarded, dry-run-first 18-record synthetic dataset with Storage-backed private images and bounded cleanup. See [STAGING_DEMO_DATA.md](STAGING_DEMO_DATA.md); it cannot target production and does not create Published records, certificates or sent email.
