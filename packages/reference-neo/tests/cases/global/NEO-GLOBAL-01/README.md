# NEO-GLOBAL-01 — token ref plus a literal `:focus-visible` selector in `globalCss` paints

The world authors one `globalCss` rule with a literal `:focus-visible`
selector (no `_focusVisible` named condition, so no `:is()` twin) and a
`{colors.ui.focus.ring}` token ref. The spec checks the sheet carries the
literal selector with the token var inside `@layer global`, then focuses
the probe with visible focus and checks the computed outline colour and
offset. Unfocused, the probe must not carry the token colour.

Evidence: `[lib]` `docs/evidence/lib-sheet-global-css.md` Trace A
(`primitives/base.ts` 9–13 → `global.css` 21–24); `[atm]` ATM-LAYER-03.

> Search terms: keyboard focus, a11y, outline-color, outline-offset, tab focus, focus ring, global/focus-visible, global/token-ref
