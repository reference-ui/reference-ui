# NEO-CHAIN-09 — a branch's override survives in either order: D→[B,C] and D→[C,B] each keep B's x and C's y

The diamond is built from real syncs, as NEO-CHAIN-06 does. The shared base A writes `colors.x = #aa0000` and
`colors.y = #aa0001`. Branch B extends A and overrides `x = #bb0000`, leaving y alone. Branch C extends A,
overrides `y = #cc0001`, and writes its own leaf, `cLeaf`, leaving x alone. The app D extends `[B, C]` and writes
nothing. The spec syncs A, then B and C on A, then D on `[B, C]` and again on `[C, B]`, and restores every
canonical config in a `finally`. Each order checks the synced spec's resolved `x` and `y`, and the computed paints
of three probes: `x`, `y`, and C's `cLeaf`. The served sheet is not an oracle here: it can declare one var more
than once (under `[C, B]` the first `--colors-x` it prints is `#aa0000` while the paint is `#bb0000`), so the
paint is the cascade's answer.

This case is red until the fix slice lands, and each order loses one override today. D on `[B, C]` evaluates A,
B, A, C, D: the second A run puts `#aa0000` back over B's x, so x resolves `#aa0000` and paints `rgb(170, 0, 0)`,
while y resolves C's `#cc0001` because C runs last. D on `[C, B]` evaluates A, C, A, B, D: the second A run puts
`#aa0001` back over C's y, so y resolves `#aa0001` and paints `rgb(170, 0, 1)`, while x resolves B's `#bb0000`
because B runs last.

Cause: `createPortableFragmentBundle` (`src/system/base/fragments.ts`) concatenates upstream fragments without
deduping, and `getUpstreamFragments` (`src/collect/lib/evaluate.ts`) hands every copy to the one evaluator, so a
base that two branches republish runs twice.

Siblings: NEO-CHAIN-02 (the extends diamond through stand-ins), NEO-CHAIN-06 (the real-sync template), NEO-CHAIN-10
(the shared base evaluated once, and the app extending the diamond).

> Search terms: diamond, branch override, last writer wins, shared base, extends order, fragment concatenation, dedupe, real sync, NEO-CHAIN-02, NEO-CHAIN-06, NEO-CHAIN-10
