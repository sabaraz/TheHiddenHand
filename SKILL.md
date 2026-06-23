---
name: the-hidden-hand-design
description: Use this skill to generate well-branded interfaces and assets for The Hidden Hand (an occult cult-management card game), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — full design guide: content fundamentals, visual foundations, iconography, index.
- `styles.css` — link this one file to get every token + webfont.
- `tokens/` — colors, typography, spacing, effects, fonts, base layer.
- `components/core/` + `components/game/` — React component library; mount via `window.TheHiddenHandDesignSystem_9a3a95`.
- `cards/` — foundation specimen cards.
- `ui_kits/the-hidden-hand/` — a playable recreation of the full game.

## Essence (don't lose this)
Warm candlelit near-black table, parchment text, gilt/cream headings, blood-red threat. Drawn-card motif: tarot-proportioned event cards, small sigil resource cards. One font (Inter) + mono for stats. Chrome in pt-BR, card flavor in terse, euphemistic English — horror by understatement. Minimal motion; the only loop is Suspicion's red alarm pulse. No illustration, no gradients-as-decoration, no icon font — just a few functional Unicode glyphs.
