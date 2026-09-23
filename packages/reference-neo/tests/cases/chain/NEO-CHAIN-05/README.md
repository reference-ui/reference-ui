# NEO-CHAIN-05 — depth-three chain: fragment flattening holds past depth two

New coverage (P-chain-3): no matrix source — suggested by
`matrix/CHAIN_REPORT.md` §4.3 ("deeper-than-2 chain ... to confirm fragment
flattening at depth ≥ 3"), never built as a matrix tier. Evidence:
`[chain-report]` §4.3, Neo `src/fragments/base/index.ts` (upstream bundles
evaluate in order, then local).

The world extends one apex stand-in whose fragment flattens two republished
depths beneath its own local leaf: innermost base first, middle republish
second, apex-local last. All three depths paint from the single extends
entry — the innermost and middle against their fixture RGB oracles, the apex
leaf world-local (`#4c1d95`). Node-side, `evaluated-system.json` pins the
three flattened leaves and `jsx-elements.json` pins all three hosts.

The sibling suggestion in the same report paragraph — T5 parallel layers —
is NOT authored here: layers legs are held for D17 (H3), and `layers:` has
no Neo author surface.

> Search terms: depth three, deep chain, flattening, transitive, republish, multi-package, CHAIN-REPORT-4.3, NEO-CHAIN-01
