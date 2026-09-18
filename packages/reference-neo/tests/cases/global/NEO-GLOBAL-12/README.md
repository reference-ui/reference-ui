# NEO-GLOBAL-12 — `color-mix()` with token refs inside `globalCss` hover rules paints

The world authors the lib button shape: a `.ref-button` base plus `_hover`
with an 80% `color-mix(in oklch, …)` of two brace-token colours and
`_active` with the 15.2% press ring over transparent. The spec checks the
sheet carries both mixes with `var()` refs inside the function on the twin
selectors in `@layer global`, then checks computed paint against reference
elements styled with the same mixes in hex: the hover twin and the active
press ring match their references exactly.

Evidence: `[lib]` `docs/evidence/lib-sheet-styles-css.md` L477–481 hover
mix and press ring; `[lib]` `docs/evidence/lib-sheet-global-css.md`
Trace C; `[atm]` ATM-TOKEN-06.
