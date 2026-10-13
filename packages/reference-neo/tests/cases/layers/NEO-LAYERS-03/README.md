# NEO-LAYERS-03 — the order statement follows config order, and the cascade winner flips with it

Three real upstreams are synced for real: `a` (extended), and `b` and `c` (layered). The spec
rewrites the consumer `ui.config.ts` once per variant, re-syncs, and restores the canonical
spelling in a `finally`. Each variant checks the served `styled/styles.css` exactly, the
statement line and the order of the package blocks, then checks computed colours on probes in
`index.html`. Each probe sits inside the `data-layer` scope of every layer whose token it reads
(D3 in `layers/SPEC.md`): the race probe nests a wrapper per layer, because CSS variables
inherit down the tree. A colour only appears when its own layer's variable resolves.

1. `extends: [a], layers: [b, c]` → `@layer neo-layers3-a, neo-layers3-b, neo-layers3-c,
   neo-layers3;`, with blocks a, b, c, own. The `race` probe carries the b and c utilities on one
   element, and c wins (`rgb(21, 128, 61)`) because its layer comes later in config order.
2. `extends: [a], layers: [c, b]` → `@layer neo-layers3-a, neo-layers3-c, neo-layers3-b,
   neo-layers3;`, with blocks a, c, b, own. The same `race` element now paints b
   (`rgb(190, 24, 93)`). Only the config order changed, so the winner flips with it.

The statement lists each layer once, in config order, and the own block always prints last under
the own name, so own ranks above every upstream in each variant.

A system named in both `extends` and `layers` is not a variant here. It is rejected at config load
(the owner's ruling, D6 in `layers/SPEC.md`), and NEO-LAYERS-14 proves that rejection through a real
`ref sync`. The self-named and cyclic variants live there too.

Evidence: `src/system/base/streams.ts` (`collectEntryNames`: the statement names the printed entries,
self last; `mergeStreams`: the statement and the blocks read one first-occurrence list),
`src/sync/index.ts` (compile qualifiers already exclude the own name), `src/system/base/types.ts`
(`package` is the layer wrap name), `src/config/types.ts` (the `layers` contract). Siblings:
NEO-LAYERS-01 (a layer ranks between extends and own), NEO-LAYERS-02 (the visual-only boundary),
NEO-LAYERS-11 (a diamond's shared base prints once), NEO-LAYERS-14 (the relation rejections).

> Search terms: layer order, order statement, config order, cascade order, winner flips, first
> occurrence, both lists, self-named layer, own name, mergeStreams, collectEntryNames, NEO-LAYERS-01,
> NEO-LAYERS-02, NEO-LAYERS-11, NEO-LAYERS-14
