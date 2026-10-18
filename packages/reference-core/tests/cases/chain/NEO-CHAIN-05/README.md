# NEO-CHAIN-05 — depth-three chain: fragment flattening holds past depth two

New coverage (P-chain-3): no matrix source. No matrix tier covers a depth-three
chain, so this case checks that fragment flattening holds at depth three. Evidence:
Neo `src/collect/lib/evaluate.ts` (upstream bundles evaluate in order, then local).

The world extends one apex stand-in whose fragment flattens two republished
depths beneath its own local leaf: innermost base first, middle republish
second, apex-local last. All three depths paint from the single extends
entry — the innermost and middle against their fixture RGB oracles, the apex
leaf world-local (`#4c1d95`). Node-side, `evaluated-system.json` pins the
three flattened leaves and `jsx-elements.json` pins all three hosts.

The T5 parallel-layers suggestion is NOT authored here: its layers legs are
proven by `tests/cases/layers` (NEO-LAYERS-03, several layers in config order);
this case stays extends-only.

> Search terms: depth three, deep chain, flattening, transitive, republish, multi-package, CHAIN-REPORT-4.3, NEO-CHAIN-01
