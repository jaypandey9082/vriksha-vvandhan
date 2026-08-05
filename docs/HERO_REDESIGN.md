# Section 1.1 Hero Redesign

## Original limitations

The Section 1 hero placed its message before the campaign identity, switched to two columns at portrait-tablet widths, overlaid the tracker on the photograph and surrounded it with circular Promise Halo crops. That composition made the Mirchi and Vriksha Vvandhan pairing too quiet, compressed the 768px layout and made the static metric feel secondary.

## Light Living Promise Hero

Section 1.1 interprets the supplied sketch as a “Living Promise Hero”: a large Mirchi-led campaign masthead, a direct “Protect the protector.” message, the approved tree-Rakhi photograph, a prominent promise medallion and a participant-photo ribbon. Its current treatment uses the light campaign canvas documented in `docs/LIGHT_VISUAL_SYSTEM.md`: warm off-white ground, dark ink, white raised surfaces and Rakhi red action. Every downstream homepage section and anchor remains in place.

## Content order

Mobile and portrait tablet use this semantic and visual order:

1. Mirchi / presents / temporary Vriksha Vvandhan lockup
2. “This Raksha Bandhan” eyebrow
3. Page H1 and supporting statement
4. Promise Tracker
5. Primary and secondary actions
6. Hero photograph
7. Promise Ribbon

At `960px` and wider, the masthead remains above a two-column stage. The tree-Rakhi photograph moves to the left; message, tracker and actions sit on the right. The Promise Ribbon spans the bottom.

## Brand treatment

`LogoLockup` now has explicit `default`, `compact` and `hero` variants plus `inline` and `stacked` layouts. The sticky header keeps its compact 78px Mirchi mark. The hero uses a 118–138px Mirchi mark and 34–42px campaign lettering on mobile, increasing to 160–190px and 58–76px respectively at desktop widths. The Vriksha Vvandhan lettering remains a documented temporary text lockup because no approved standalone wordmark was supplied. The abstract tree-ring/Rakhi browser icon prevents a missing-resource error but is explicitly not an approved campaign mark.

## Image decision and rights fallback

`/campaign/hero-tree-rakhi.webp` remains the hero image because it communicates the tree-protection ritual directly and comes from the supplied deck media. It uses a tall `4:5` editorial crop, organic upper curve and restrained lower corners. No celebrity imagery or internet asset was introduced. If deck-derived imagery is not cleared for public web use, this photograph and the ribbon must be replaced with approved campaign photography while preserving the typed image contracts and component layout.

## Tracker treatment

The tracker is a reusable server-rendered SVG medallion with a white centre, neutral remaining track, Rakhi-red progress arc, two subtle gold and forest inner tree rings, four orientation marks and one red knot. It shows `417`, `of 983`, `Vriksha promises`, the visible rounded percentage and the generated support line. The percentage is calculated with `Math.round((current / target) * 100)`, clamped to the first circle and guarded against a zero target. Progress remains understandable in text without relying on colour.

## Promise Ribbon

`heroPromiseImages` is a typed collection of eight existing tree, tree-care and community campaign images. The labelled ribbon uses a horizontally overflowing, keyboard-focusable inner viewport, controlled mixed-width rectangular crops, touch/trackpad/keyboard scrolling, partial next-card visibility and CSS scroll snap. Images are decorative, not focusable and lazy-loaded. There is no autoplay, marquee, pagination, duplicated loop or carousel dependency; page-level width remains fixed.

## Rakhi thread and motion

One `aria-hidden` SVG thread uses muted gold and Rakhi red to connect the stage visually, while the ribbon heading carries the same thread motif into the lower strip. Motion is limited to one image clip reveal and one ribbon-card entrance. The existing reduced-motion media query shortens all non-essential animation so the complete layout remains visible.

## Performance and accessibility

The hero stays a Server Component and adds no client state or dependency. Following the installed Next.js 16.3 Image documentation, `CampaignImage` now exposes `preload`; only the true hero/LCP image enables it. All images retain explicit intrinsic dimensions and accurate responsive `sizes`; ribbon images keep native lazy loading. The design preserves one H1, semantic regions, a named brand lockup, visible percentage text, valid hash actions, 44px-or-larger controls, visible focus, reduced motion and no keyboard trap.

## Breakpoints and tested viewports

- Below `640px`: narrow-mobile stack with a full-width 52px primary action and 188–200px tracker.
- `640px–959px`: roomy stacked tablet composition; actions share a row where space allows.
- `960px` and wider: image-left/message-right stage with a 250–280px tracker.
- `1280px` and wider: wider shell and balanced editorial proportions.

Required visual review targets: `360 × 800`, `390 × 844`, `768 × 1024`, `1024 × 768` and `1440 × 1000`.
