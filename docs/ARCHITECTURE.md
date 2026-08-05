# Architecture

## Current structure

- `src/app` — App Router layout, homepage, global CSS, metadata image and 404 experience.
- `src/components/home` — focused Server Components for each homepage section, including the Section 1.1 hero masthead, media and Promise Ribbon composition.
- `src/components/layout` — header, focus-managed mobile navigation, footer and mobile join bar.
- `src/components/shared` — campaign image wrapper, brand lockup, section heading and SVG Promise Tracker.
- `src/content/campaign.ts` — single source of truth for public campaign copy, seed metrics, navigation, images and mock/seed stories.
- `src/types/campaign.ts` — campaign-domain TypeScript types.
- `public/brand` and `public/campaign` — supplied brand assets and documented web derivatives.
- `e2e` — browser, navigation, overflow, console and axe checks.

## Visual-system boundary

The light campaign system is implemented as semantic CSS custom properties in `src/app/globals.css`. Components consume role-based tokens for the page canvas, white and soft surfaces, ink, Rakhi-red action, forest support, gold detail, dividers and shadows. This keeps visual changes independent from content records and component behaviour. `docs/LIGHT_VISUAL_SYSTEM.md` records the palette, surface rhythm, accessibility intent and exclusions.

## Content-driven design

Campaign wording and typed data live in `src/content/campaign.ts`, rather than being scattered through JSX. Components decide composition and semantics; content decides labels, copy, metrics and selected assets. This keeps later campaign approvals and translations localised.

The tracker receives `current`, `target` and `label` as typed data, calculates a rounded percentage and renders an accessible SVG medallion. `heroPromiseImages` drives the decorative, internally scrolling Promise Ribbon without presenting those images as approved public submissions. The Movement Wall uses explicit `seedMovementStories`; neutral labels prevent seed content from looking like genuine participant data.

## Server and Client Components

All homepage content and image sections—including the Living Promise Hero—are Server Components. The only Client Component is `MobileNavigation`, because it requires open state, body scroll locking, focus management, an Escape shortcut and a keyboard focus loop. No campaign content is fetched client-side.

## Future integration points

- Replace `promiseMetric` with approved server-side campaign data without changing `PromiseTracker`.
- Replace `seedMovementStories` with moderated public records after the submission and moderation system exists.
- Add the upload journey behind the current `#how-it-works` section while preserving current anchor destinations.
- Replace the certificate concept with an approved generation/download workflow.
- Add approved Ped Ka Paigaam audio sources and transcripts to the existing preview model.
- Replace the temporary campaign text lockup with the approved wordmark asset.

## Why there is no database or media service

Section 1 is intentionally static. Adding a database, authentication, media hosting or placeholder APIs would create unapproved product behaviour, security surface and false implementation signals before consent, moderation, legal and operational decisions exist.
