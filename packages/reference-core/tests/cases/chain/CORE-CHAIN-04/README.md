# CORE-CHAIN-04 — parallel direct extends: both upstreams adopt and declared order wins the shared leaf

Matrix source: the chain T9 contract spec (extends legs
plus the prelude-order extends half ONLY — the layers legs and cross-bucket
order stay out of this case (H3). Topology is the untouched T4 parallel-extends from
the chain doc. Evidence: `[chain-t9]` the T9 contract spec (both
extends paint; `extends...` declared order), Core
the fragment merge (later fragments win on scalars).

The world extends two direct upstreams with no transitive middle. Core emits
no per-upstream `@layer` prelude — the build wraps in the single app package
layer — so declared extends order ports as its merge consequence: both
upstreams' leaves paint, and the one shared leaf paints the second entry's
value. The shared `orderMark` leaf is world-local by design; every other
leaf keeps its fixture value and RGB oracle. Node-side,
the evaluated-system snapshot pins the union with the later entry winning, and
the JSX-elements snapshot pins both hosts.

Out of scope: T9's layers legs and the extends-before-layers prelude order are
proven by the layers cases (CORE-LAYERS-01 for the order statement, -03 for
config order); this case stays extends-only.

> Search terms: parallel extends, direct upstreams, declared order, later wins, shared leaf, prelude, T4, T9, CORE-SYNC-10
