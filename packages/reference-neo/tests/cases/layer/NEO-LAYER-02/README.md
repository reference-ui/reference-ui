# NEO-LAYER-02 — two systems nest under one `@layer <name>` package, a downstream utility beats the upstream-fed recipe, and portable tokens scope by `[data-layer]`

The world extends an upstream system carrying a `brass` token, authors a
local `card` recipe over that adopted token, and paints three probes: one
with the recipe plus a downstream `ink` utility, one with the recipe alone,
and one with a `brass` utility. The app also fetches its own portable base
system and injects the chunk into a blank same-origin frame — a stand-in
for a downstream layers-mode consumer — with one probe stamped for this
system and one stranger. The spec checks the sheet nests everything under
`@layer neo-layer2` with the recipe in `recipes` and the utility in the
later `utilities`, then checks computed: the mixed node paints ink, the
recipe-only and adopted-token nodes paint brass, the stamped frame probe
resolves `--colors-brass` from the portable chunk alone, and the stranger
resolves nothing.

Two scoping notes. Extends adopts tokens, not recipe definitions (no
recipe collector — SYNC-10 precedent), so the "upstream recipe" leg is a
downstream recipe authored over the adopted upstream token, overridden by
a downstream utility through layer rank. And the two-system nesting is the
RS-4 extends merge into one downstream package, not two package blocks in
one sheet (the `layers` surface stays deferred per D17; BAS-LAYER unproven).

Evidence: `[atm]` P1 #16 (`docs/evidence/atomic-claims.md:317`); contracts
`portable-base-system.json` fixture; RS-4 `BAS-EXTEND-01..05` (14/14 green);
`[atm]` ATM-RECIPE-03 via NEO-LAYER-05/NEO-RECIPE-10 (recipes lose to
utilities by rank).

> Search terms: system merge, token adoption, downstream override, injected chunk, cross-frame, same-origin iframe, upstream downstream, nested package, layer/nesting, layer/extends, layer/portable-scoping
