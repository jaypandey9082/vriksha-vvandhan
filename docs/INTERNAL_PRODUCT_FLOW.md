# Internal Product Flow

This reference explains the planned campaign operation for Mirchi teams. Section 2 establishes the protected foundation; the public form and staff screens arrive later.

## What participants do

A participant provides only:

- Display name
- Email
- One photograph
- Publication consent
- Terms acceptance

They receive a submission confirmation but do not create an account. Their email and original photograph remain private.

## Main flow

Participant submits → Reviewer checks → **Approve** or **Recommend Rejection** → if recommended, **Rejection Awaiting Admin** → Admin **Confirms Rejection** or **Approves Instead**

An Admin may also reject directly. Every recommendation or direct rejection requires a clear comment intended for the participant. There is no Return to Reviewer option.

## Roles

| Capability | Reviewer | Admin |
|---|:---:|:---:|
| Review submissions and approve | Yes | Yes |
| Recommend rejection with comment | Yes | Yes |
| Confirm final rejection | No | Yes |
| Approve after a recommendation | No | Yes |
| Read participant email | No | Yes |
| Change settings or staff roles | No | Yes |
| Trash, restore or permanently delete | No | Yes |

## Messages, count and certificate

- Recommendation alone never sends a rejection email.
- The rejection email is sent only after Admin confirms rejection or rejects directly.
- The public count increases only after publication of an active, real campaign record that is marked to count.
- Test records never publish, count, receive a real Guardian number or send a real participant email.
- A certificate is generated only after approval/publication in Section 5, not by this foundation.
- If future email delivery fails, the workflow record remains intact and the same delivery can be retried without creating a duplicate message.

## Trash and deletion

Trash hides a record while retaining its workflow state. Admin can restore it. Permanent deletion is a later, deliberate action requiring a reason and removal of private original, public variants and certificate before the database record. A non-sensitive audit record is preserved.

## Private versus public

Private: participant email, original photograph, staff identity, internal delivery state and audit history.

Public after approval: display name, approved image variants, Guardian number and certificate content intended for the participant. Publication consent and terms evidence remain private.
