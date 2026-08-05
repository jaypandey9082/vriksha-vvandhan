# Light Premium Visual System

## Direction

Section 1.1 uses a light, editorial campaign system inspired by Mirchi's energy without reproducing another product or brand interface. The page keeps the existing campaign structure, copy, imagery, anchors and behaviour while replacing the earlier dark-green chapter treatment with a warm off-white canvas, white surfaces, dark ink and decisive Rakhi red.

## Colour tokens

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Page canvas | `--page-bg` | `#F8F7F3` | Body, hero and quiet editorial sections |
| Primary surface | `--surface` | `#FFFFFF` | Header, cards, story, channels and footer |
| Soft surface | `--surface-soft` | `#F1F0EC` | Alternating sections and final call to action |
| Ink | `--ink` | `#1B1D19` | Headings and primary copy |
| Muted ink | `--muted-ink` | `#62655E` | Supporting copy and metadata |
| Action red | `--action-red` | `#D62828` | Primary actions, tracker progress and emphasis |
| Action hover / small red text | `--action-red-hover` | `#B91F24` | Interactive hover state and AA-safe small labels on soft surfaces |
| Forest accent | `--forest-accent` | `#2D403C` | Supporting brand detail and the header top rule |
| Forest soft | `--forest-soft` | `#E9EEEB` | Contained Ped Ka Paigaam panel |
| Gold accent | `--gold-accent` | `#B48A45` | Ceremonial thread and small decorative detail |
| Divider | `--line` | `#DEDCD5` | Borders and section separation |

Red is the principal action colour. Forest and gold support the tree and Rakhi story; neither is used as a dominant full-page background.

## Surface rhythm

- The sticky header is white with a four-pixel forest top rule and a neutral bottom divider.
- The hero sits directly on the warm off-white canvas with dark type and no grain, dark gradient or inverse logo treatment.
- The Promise Tracker uses a white medallion, neutral remaining track, red progress arc, restrained gold and forest inner rings and dark count typography.
- Story, participation, channels, Ped Ka Paigaam and the footer use white primary surfaces.
- Movement pillars, Movement Wall preview and the final call to action use soft off-white alternates.
- The First Rakhi Moment returns to the warm canvas rather than a full-width dark chapter.
- Ped Ka Paigaam carries forest through a contained pale panel, not a dark or saturated full-width field.
- Image-local overlays remain only where a caption must sit on photography.

## Typography and hierarchy

Fraunces remains the emotional editorial display face and Manrope remains the interface and body face. Large headings, generous spacing and the Mirchi-led masthead provide the premium character. Rakhi red marks eyebrows, metrics and actions; forest is limited to supporting identity and secondary emphasis.

## Responsive behaviour

The existing mobile-first hierarchy is preserved. At narrow widths the masthead, copy, tracker, actions, photograph and internally scrolling ribbon form a single readable stack. Portrait tablet remains stacked through `959px`. At `960px` and above the photograph sits left of the message and tracker. The ribbon scrolls inside its own viewport and never widens the document.

## Accessibility and motion

Primary text uses dark ink on light surfaces. Red actions use white labels, keyboard focus remains visible, controls retain at least 44-pixel targets and tracker progress is repeated as text. The mobile menu is also light. Decorative entrances respect `prefers-reduced-motion`, while semantic order and all in-page destinations remain unchanged.

## Deliberate exclusions

This refinement does not add Section 2 behaviour, live data, submissions, authentication, certificates, audio, video or a backend. It does not copy Gaana or another Mirchi property; it translates the supplied campaign brief into an original light editorial system using the approved project structure and deck-derived assets.
