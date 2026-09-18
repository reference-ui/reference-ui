# NEO-GLOBAL-05 — `undefined` entries strip, `_placeholder` paints, rhythm sizes agree

The world spreads a flex field base into a `.ref-input` global rule, then
strips the flex keys with `undefined` the way the lib inputs do, and adds a
`_placeholder` token colour plus rhythm sizes. The spec checks the rule
carries no `display`, `align-items`, or `gap` declaration while keeping its
`width`, the placeholder paints the token colour computed, and the rhythm
sizes paint their calc values. The engine lowers every rhythm step to
`calc()` (Panda prints a token var for whole steps), cascade-equal; it
prints a single `::placeholder` without Panda's `[data-placeholder]`
twin, so the proof uses the real pseudo.

Evidence: `[lib]` `docs/evidence/lib-sheet-global-css.md` Trace E
(`inputs.ts` 19–31 → `global.css` 497–542); `[atm]` ATM-LAYER-03.
