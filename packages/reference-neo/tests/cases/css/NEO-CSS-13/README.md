# NEO-CSS-13 — `flex` keywords map to Panda triples and paint basis `0%` vs `auto`

The world mounts a flex row with one item per flex spelling: `'1'`, `'0 0
auto'`, `'auto'`, `'initial'`, `'none'`, and `'2 30px'`. The spec checks the
sheet carries the Panda triples (`flex: 1 1 0%`, `1 1 auto`, `0 1 auto`) with
raw passthrough for the rest and zero `flex-grow`/`shrink`/`basis` longhands,
then paints the computed auto-vs-`0%` basis split that the RS-39 mis-expansion
silently broke.

Evidence: `[audit]` b37-family-audit §2 #7; `[engine]` live Panda 1.11.1
`utility.transform` probe (`/tmp/flex-probe2.mts`); `[atm]` ATM-SHORT-11.
