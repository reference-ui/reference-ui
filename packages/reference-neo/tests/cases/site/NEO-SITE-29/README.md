# NEO-SITE-29 — a nested import spread paints red

The world keeps `export const base = { color: 'red' }` in `src/base.ts`
and folds it into `button` in `src/tokens.ts` beside a padding leaf,
while the entry styles one node with `css(button)`. The spec asserts the
sheet carries the red utility and the padding sibling, the live node
paints red while the unstyled control paints nothing, with zero
recompile diagnostics — so cross-file spreads fold end to end.

Evidence: `[atm]` ATM-SITE-78 (§1 three-file fold); `[overmatch]`
Forge §1 verdict B.
