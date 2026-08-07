# Email Delivery Pipeline

## Provider and kinds

Transactional delivery uses the Resend Node SDK and the existing `email_deliveries` table:

- `submission_received` after successful finalisation, with no attachment or approval claim.
- `approval_certificate` only after Published state and a generated private certificate, with the PDF attached.
- `rejection` only after Admin final rejection. Reviewer recommendation never sends email.

Templates are lightweight responsive HTML with text fallbacks. Participant values are HTML-escaped. No participant photograph, tracking image, workflow jargon, staff identity, or internal moderation payload is included.

## Immediate processing and durability

Next.js `after()` schedules a best-effort attempt only after the authoritative transaction succeeds. Database rows remain the durable truth and the Admin Delivery Center supplies manual retries. Scheduled catch-up is deferred to Section 6.

The service-only claim locks one eligible `not_started` or `failed` row, assigns a claim token, increments attempts, and moves it to `queued`. Resend receives the existing stable database `idempotency_key`. A `sent` row can never be reclaimed, so database idempotency outlives the provider window. Completion stores provider ID and template version. Failure stores only a safe code such as `resend_timeout`, `resend_rate_limited`, `resend_invalid_sender`, `resend_provider_error`, or `attachment_missing`.

Email failure never changes publication, rejection, count, certificate, Guardian number, or media.

## Environment safety

Required server-only names are `RESEND_API_KEY`, `EMAIL_FROM`, and `EMAIL_REPLY_TO`. `EMAIL_SENDING_ENABLED=false` is the safe default. Enabling staging also requires `EMAIL_TEST_RECIPIENT`; override happens only at send time and never changes the stored contact. Logs say only `staging recipient override active`.

The guarded smoke is dry-run by default:

```bash
npm run test:staging:certificate-email -- --recipient=approved-test@example.com
npm run test:staging:certificate-email -- --execute --recipient=approved-test@example.com
```

The argument must match the untracked environment value. Execute mode creates a synthetic non-counting Published fixture without consuming the real Guardian sequence, verifies the private PDF, sends one approval email, retries to prove no duplicate, cleans up, and verifies the baseline count.

## Company Resend setup before production

1. Create the Resend account/organization under company control.
2. Add a company-approved sending subdomain.
3. Add the exact SPF and DKIM records shown by Resend through the company DNS process.
4. Verify the domain.
5. Review DMARC only through the company-approved DNS process.
6. Create a sending-only API key and store it only in `.env.local` or protected Vercel environment.

Do not guess DNS records, impersonate an unverified Mirchi domain, print the key, or configure production from this task.
