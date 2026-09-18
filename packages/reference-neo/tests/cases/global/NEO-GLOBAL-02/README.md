# NEO-GLOBAL-02 — rhythm aliases plus `containerType` on `body` plus `:root` var merge paint

The world authors the lib `bodyStyles` shape across two `globalCss` calls:
`:root` spacing vars, then `body` with rhythm `fontSize: '4r'` and
`containerType: 'inline-size'`. The spec checks the body paints the
rhythm size and the container type, and the `:root` var lands computed.
The engine prints one rule per entry (no comma-merge with a second
selector) and always lowers rhythm to `calc()`, both cascade-equal to
the lib sheet; Panda's `--made-with-panda` signature is GLOBAL-09's
claim, not asserted here.

Evidence: `[lib]` `docs/evidence/lib-sheet-global-css.md` Trace B
(`global.ts` 3–20 → `global.css` 2–15); `[atm]` ATM-LAYER-03,
ATM-COND-16.
