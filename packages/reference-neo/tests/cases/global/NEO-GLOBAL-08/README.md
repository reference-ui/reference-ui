# NEO-GLOBAL-08 — `font()` emits `@font-face` with src lists, `size-adjust`, and `descent-override`

The world registers two lib-shaped fonts: a serif face with a two-URL src
list plus both metric overrides, and a mono face with `size-adjust` only.
The spec checks the sheet prints both `@font-face` blocks inside `@layer
global`, then checks the DOM exposes the faces with their descriptors and
the probes paint the families computed. Font loading itself is not asserted.

Evidence: `[lib]` `styles.css` L1771–1801 (3 faces); `[panda-v1]`
`core/__tests__/global-fontface.test.ts`; `[atm]` ATM-LAYER-06 (RS-2).

> Search terms: webfonts, typography, font-family, font descriptors, font registration, global/font-face, global/typography
