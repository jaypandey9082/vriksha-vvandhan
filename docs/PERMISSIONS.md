# Permissions

| Actor | Reads | Writes in Section 2 |
|---|---|---|
| Visitor | Static public website only; no direct campaign-table access | None |
| Reviewer | Own active profile, settings, submissions, consent evidence, media metadata, certificate status and email-delivery status | None; future purpose-specific server operations only |
| Admin | All staff profiles and Reviewer reads, plus participant contacts and audit logs | No broad table writes; future audited server operations only |
| Service client | Trusted server operations with RLS bypass | Only from server-only code after explicit authorization/validation |

Inactive staff and authenticated users without an active `staff_profiles` row receive no internal access. Roles come from the protected staff profile, never browser input or editable Auth metadata.
