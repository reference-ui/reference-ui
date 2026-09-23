# NEO-CHAIN-04 — parallel direct extends: both upstreams adopt and declared order wins the shared leaf

Matrix source: `matrix/chain/T9/tests/e2e/T9-contract.spec.ts` (extends legs
plus the prelude-order extends half ONLY — the layers legs and cross-bucket
order stay held for D17). Topology is the untouched T4 parallel-extends from
`matrix/CHAIN.md`. Evidence: `[chain-t9]` `T9-contract.spec.ts` (both
extends paint; `extends...` declared order), Neo
`src/fragments/base/merge.ts` (later fragments win on scalars).

The world extends two direct upstreams with no transitive middle. Neo emits
no per-upstream `@layer` prelude — the build wraps in the single app package
layer — so declared extends order ports as its merge consequence: both
upstreams' leaves paint, and the one shared leaf paints the second entry's
value. The shared `orderMark` leaf is world-local by design; every other
leaf keeps its fixture value and RGB oracle. Node-side,
`evaluated-system.json` pins the union with the later entry winning, and
`jsx-elements.json` pins both hosts.

Out of scope: T9's layers legs and the extends-before-layers prelude order
stay homed at kept matrix `chain-t2`/`chain-t8` until D17 (H3); `layers:`
has no Neo author surface.

> Search terms: parallel extends, direct upstreams, declared order, later wins, shared leaf, prelude, T4, T9, NEO-SYNC-10
