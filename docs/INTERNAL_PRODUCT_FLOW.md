# Internal Product Flow

This reference explains the live Section 4 campaign operation for Mirchi teams. Participants enter through `/join`; authorized staff work only in the invite-only `/admin` Campaign Desk.

## What participants do

A participant provides only:

- Display name
- Email
- One photograph
- Publication consent
- Terms acceptance

They receive an on-screen submission confirmation but do not create an account. Their email and original photograph remain private. Section 3 creates an unsent delivery placeholder only; no participant email is sent yet.

## Main flow

Participant submits → **Pending Review** → Reviewer checks → **Approve** or **Recommend Rejection** → if recommended, **Rejection Awaiting Admin** → Admin **Confirms Rejection** or **Approves Instead**

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
- Final rejection creates an email placeholder only; Section 4 sends no message.
- The public count increases only after publication of an active, real campaign record that is marked to count.
- Test records never publish, count, receive a real Guardian number or send a real participant email.
- Publication creates `not_started` certificate and approval-email placeholders. Section 4 generates/sends neither.
- If future email delivery fails, the workflow record remains intact and the same delivery can be retried without creating a duplicate message.

## Trash and deletion

Trash hides a record while retaining its workflow state. Published restore regenerates both public variants before visibility returns; nonpublished restore is direct. Permanent deletion requires Trash, a reason and explicit confirmation, removes Storage objects through the API, then deletes the row while preserving only non-sensitive audit intent.

## Private versus public

Private: participant email, original photograph, staff identity, internal delivery state and audit history.

Public after approval: display name, approved image variants, Guardian number and certificate content intended for the participant. Publication consent and terms evidence remain private.
