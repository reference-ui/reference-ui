# NEO-LAYERS-03 — the order statement follows config order, a system listed twice keeps one name but prints twice, and the own name is never listed as an upstream

Four real upstreams are synced for real: `a` (extended), `b` and `c` (layered), and `twin`, whose
name equals the consumer's own name. The spec rewrites the consumer `ui.config.ts` once per
variant, re-syncs, and restores the canonical spelling in a `finally`. Each variant checks the
served `styled/styles.css` exactly, the statement line and the order of the package blocks, then
checks computed colours on probes in `index.html`. Each probe sits inside the `data-layer` scope of
every layer whose token it reads (D3 in `layers/SPEC.md`): the two race probes nest a wrapper per
layer, because CSS variables inherit down the tree. A colour only appears when its own layer's
variable resolves.

1. `extends: [a], layers: [b, c]` → `@layer neo-layers3-a, neo-layers3-b, neo-layers3-c,
   neo-layers3;`, with blocks a, b, c, own. The `race` probe carries the b and c utilities on one
   element, and c wins (`rgb(21, 128, 61)`) because its layer comes later in config order.
2. `extends: [a], layers: [c, b]` → `@layer neo-layers3-a, neo-layers3-c, neo-layers3-b,
   neo-layers3;`, with blocks a, c, b, own. The same `race` element now paints b
   (`rgb(190, 24, 93)`). Only the config order changed, so the winner flips with it.
3. `extends: [a], layers: [a, b]` → `@layer neo-layers3-a, neo-layers3-b, neo-layers3;`. The
   statement lists a once, at its first occurrence. **Current behaviour, pinned and not
   endorsed:** the blocks come from the expansion without a dedupe (`streams.ts:190,204-208`), so
   a's block prints twice, once at its extends position and again before b. The `a-only` probe
   still paints a's colour.
4. `extends: [a], layers: [twin, b]`, where `twin` is named `neo-layers3`. The statement is
   `@layer neo-layers3-a, neo-layers3-b, neo-layers3;`: the own name appears once, last, and is
   never listed as an upstream. **Current behaviour, pinned and not endorsed:** the self name is
   filtered out of the statement (`collectEntryNames`, `streams.ts:135-147`), but the twin's
   expansion block still prints, wrapped in `@layer neo-layers3 {`, between a and b. Its utility
   paints (`twin-only`, `rgb(124, 58, 237)`), and because that block sits in the own layer it ranks
   above b: the `self-race` probe, which carries a b class and a twin class, paints the twin's
   colour. A change to either behaviour should be deliberate, and this case makes it loud.

The statement dedupes by name, while blocks are never deduped. The own block always prints last
under the own name, so own ranks above every upstream in each variant.

Evidence: `src/system/base/streams.ts:135-147` (`collectEntryNames`: dedupe by raw name, self
filtered, self appended last), `streams.ts:185-214` (`mergeStreams`: the statement from the deduped
names, the blocks from the undeduped expansion), `streams.ts:106-115` (`printUpstreamBlock`, which
wraps each block in its `package` layer), `src/sync/index.ts:161-169` (compile qualifiers already
exclude the own name), `src/system/base/types.ts:11-22` (`package` is the layer wrap name),
`src/config/types.ts:44-49` (the `layers` contract). Siblings: NEO-LAYERS-01 (a layer ranks
between extends and own), NEO-LAYERS-02 (the visual-only boundary).

> Search terms: layer order, order statement, config order, cascade order, dedupe, first
> occurrence, duplicate block, repeated system, self-exclusion, self-named layer, own name,
> mergeStreams, collectEntryNames, NEO-LAYERS-01, NEO-LAYERS-02
