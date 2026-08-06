# Permissions

| Actor | Reads | Purpose-specific Section 4 operations |
|---|---|---|
| Visitor | Public summary and approved Movement projection; no base-table/private-original access | None |
| Reviewer | Own active profile, settings, active submissions, consent/media and placeholder status | Correct review fields, approve Pending Review, recommend rejection |
| Admin | Reviewer reads plus contacts, audit, Trash, staff and settings | Reviewer operations; final rejection; approval instead; Trash/restore/delete; manage existing staff profiles/settings |
| Service client | Trusted server operations with RLS bypass | Only from server-only code after explicit authorization/validation |

Inactive staff and authenticated users without an active `staff_profiles` row receive no internal access. Roles come from the protected staff profile, never browser input or editable Auth metadata.

Reviewer cannot read participant email, finalise rejection, or access Trash, Team, Settings, restore, or permanent deletion. Admin cannot create Auth users in the portal, deactivate self, or remove/demote the last active Admin.
