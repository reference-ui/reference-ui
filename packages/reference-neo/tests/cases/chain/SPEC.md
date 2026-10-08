# CHAIN — multi-package extends topologies

This group proves the extends side of the chain contract in Neo's fast loop:
transitive adoption, diamonds, parallel chains, parallel direct upstreams
with declared-order arbitration, and depth-three flattening. Every case is a
small multi-system world whose app holds no local tokens, so each painted
probe proves adoption through the `extends` entries alone. Computed style is
the oracle everywhere; sheet text and merged artifacts pin alongside, never
alone.

## Dialect

Authors write `extends: [systems]` in `ui.config.ts`, where each entry is a
`BaseSystem` — the shape a published package's `baseSystem.mjs` carries
(`name`, bundled `fragment` IIFEs, `jsxElements`). Upstream fragments
evaluate in extends order, then local bundles; later fragments win scalar
conflicts (`src/collect/lib/merge.ts`), and upstream `_private` subtrees
strip at the boundary. Worlds stand in for installed packages with
import-free `theme/*.ts` objects in exactly that shape — the config data,
not fragments to scan. Transitive middles republish: the outer fragment
carries the inner base first and outer-local leaves second, the flattened
bundle order a real publish produces. The one exception is NEO-CHAIN-06:
it syncs a genuine upstream package mid-run and extends the artifact on
disk, so the publish/consume shape agreement is proven, not assumed —
stand-ins alone once let the publisher drift silently.

## Decisions

Republish-via-fragment-string is the port's core move: matrix tiers consume
built fixture packages over `workspace:*`, while Neo cases inline the
equivalent published fragment text. The behaviors ported are adoption,
resolution, and order — not the install graph, which stays matrix's job in
the kept chain gate. Declared extends order ports as its merge consequence
(later entry wins the shared leaf) because Neo emits no per-upstream
`@layer` prelude; the build wraps in the single app package layer. The T9
prelude-order extends half is that consequence, nothing more.

## Out of scope

`layers:` has no Neo author surface (D17 defers it), so every layers leg of
the hybrid matrix tiers stays homed at kept matrix `chain-t2`/`chain-t8`
until D17 — T2/T8 are the layers proof meanwhile (H3). That holds the T5
parallel-layers suggestion too: suggested in the same CHAIN_REPORT paragraph
as depth-three, refused here for the same reason. T8's same-library-both-
buckets policy is not this group's (H4; T8 stays KEEP). Hybrid
both-buckets-at-once coexistence has no Neo home yet — a D17 follow-up. The
single-hop adopt stays homed at NEO-SYNC-10, which this group builds on.
