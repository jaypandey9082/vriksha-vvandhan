# Vriksha Vvandhan

Vriksha Vvandhan is a Mirchi campaign experience for Raksha Bandhan: a public invitation to return the promise of protection by caring for a tree. This repository contains Section 1—the production foundation and a premium, static, mobile-first campaign homepage—plus the Section 1.1 light editorial visual system and Living Promise Hero refinement.

## Section 1 scope

Section 1 includes the complete static homepage, the `417 / 983` seed Promise Tracker, campaign storytelling, participation journey, First Rakhi Moment, digital and on-ground campaign panels, a seed Movement Wall preview, Ped Ka Paigaam preview, responsive navigation, accessibility foundations, tests, and campaign documentation.

It deliberately does not include uploads, databases, authentication, a real counter, certificates, moderation, event operations, analytics, or audio playback.

## Local setup

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # local development server
npm run build        # production build
npm run start        # run the production build
npm run lint         # ESLint
npm run typecheck    # strict TypeScript check
npm run test         # Vitest component/unit tests
npm run test:watch   # Vitest watch mode
npm run test:e2e     # Playwright + axe homepage tests
```

## Asset handling

- The source deck remains external and unchanged at `/Users/jaypandey/Downloads/Mirchi X Vriksha Vvandhan.pptx`.
- Production imagery in `public/campaign` consists of web-friendly crops made from supplied deck media; no internet or stock imagery was used.
- `public/brand/mirchi-logo.png` is the authentic standalone Mirchi logo extracted from the deck.
- The deck does not contain a clean standalone Vriksha Vvandhan logo. The site therefore uses a documented temporary text lockup next to the authentic Mirchi logo. It must be replaced when the approved campaign wordmark is supplied.
- Temporary extraction and visual-QA files live under ignored `.tmp/` paths.

See [docs/ASSET_INVENTORY.md](docs/ASSET_INVENTORY.md) for provenance and dimensions.

## Current limitations

- The promise count is static seed data (`417 / 983`).
- Photo submission and certificate delivery are communicated as later campaign phases, not simulated.
- Ped Ka Paigaam has no playable control because no approved audio file was supplied.
- No approved video file or URL was supplied for the First Rakhi Moment.
- Campaign dates, geography, eligibility rules, legal language, and celebrity web-use approval remain unresolved.

## Next planned section

Section 2 should establish the approved data, authentication, and media foundation needed for real submissions, while preserving the Section 1 public experience and content model.
