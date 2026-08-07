# Internal Product Flow

This reference explains the live Section 4 campaign operation for Mirchi teams. Participants enter through `/join`; authorized staff work only in the invite-only `/admin` Campaign Desk.

## What participants do

A participant provides only:

- Display name
- Email
- One photograph
- Publication consent
- Terms acceptance

They receive an on-screen confirmation but do not create an account. Their email and original remain private. When sending is enabled, a receipt email is attempted after finalisation; failure never changes Pending Review.

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
| Delivery Center, retry, certificate download/regeneration | No | Yes |
| Sensitive campaign XLSX export | No | Yes |

## Messages, count and certificate

- Recommendation alone never sends a rejection email.
- Final rejection creates and attempts the respectful participant notification; recommendation alone still sends nothing.
- The public count increases only after publication of an active, real campaign record that is marked to count.
- Test records never publish, count, receive a real Guardian number or send a real participant email.
- Publication creates certificate and approval-email placeholders, then a best-effort post-response task generates the private PDF before attempting the attached approval email.
- If certificate or email delivery fails, the workflow record remains intact. Admin retries the same stable delivery without changing approval, Guardian number, or count.

## Trash and deletion

Trash hides a record while retaining its workflow state. Published restore regenerates both public variants before visibility returns; nonpublished restore is direct. Permanent deletion requires Trash, a reason and explicit confirmation, removes Storage objects through the API, then deletes the row while preserving only non-sensitive audit intent.

## Private versus public

Private: participant email, original photograph, staff identity, internal delivery state and audit history.

Public after approval: display name, approved image variants, Guardian number and certificate content intended for the participant. Publication consent and terms evidence remain private.
