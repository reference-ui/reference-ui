# CORE-CHAIN-03 — parallel chains: two disjoint transitive paths contribute at one boundary

Matrix source: `matrix/chain/T11/tests/e2e/T11-contract.spec.ts` (also homes
the T13 extends legs, an identical assertion set). Evidence: `[chain-t11]`
`T11-contract.spec.ts` (both endpoints plus both inner bases), Core
`src/collect/lib/merge.ts` (disjoint subtrees union).

The world extends two chain-endpoint stand-ins with fully disjoint leaves,
so the merge is a pure union with nothing to arbitrate: each endpoint
background paints alongside its own inner-base eyebrow, against the fixture
RGB oracles. Node-side, `evaluated-system.json` pins the four-leaf union and
`jsx-elements.json` pins both chains' republished hosts.

Out of scope: the layers legs are proven by `tests/cases/layers` (CORE-LAYERS-01
and -03, several layers paint and order); this case stays extends-only.

> Search terms: parallel, independent chains, union, multi-package, two paths, extends, T11, T13, CORE-CHAIN-01
