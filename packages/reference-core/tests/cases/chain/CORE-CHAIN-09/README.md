# CORE-CHAIN-09 — a branch's override survives in either order: D→[B,C] and D→[C,B] each keep B's x and C's y

The diamond is built from real syncs, as CORE-CHAIN-06 does. The shared base A writes `colors.x = #aa0000` and
`colors.y = #aa0001`. Branch B extends A and overrides `x = #bb0000`, leaving y alone. Branch C extends A,
overrides `y = #cc0001`, and writes its own leaf, `cLeaf`, leaving x alone. The app D extends `[B, C]` and writes
nothing. The spec syncs A, then B and C on A, then D on `[B, C]` and again on `[C, B]`, and restores every
canonical config in a `finally`. Each order checks the synced spec's resolved `x` and `y`, and the computed paints
of three probes: `x`, `y`, and C's `cLeaf`. The served sheet is not an oracle here: it can declare one var more
than once (under `[C, B]` the first `--colors-x` it prints is `#aa0000` while the paint is `#bb0000`), so the
paint is the cascade's answer.

Before the fix each order lost one override. D on `[B, C]` evaluated A, B, A, C, D, so the second A run put
`#aa0000` back over B's x and x painted `rgb(170, 0, 0)`; D on `[C, B]` lost C's y the same way. The fix gives every
published system a named fragment list and linearizes the lists by first occurrence (E1): D on `[B, C]` now
evaluates A, B, C, D, and D on `[C, B]` evaluates A, C, B, D, so each override survives.

Cause (fixed): `createPortableFragmentBundle` concatenated upstream fragments without deduping, and
`getUpstreamFragments` (the collector evaluator) handed every copy to the one evaluator, so a base that two
branches republish ran twice. The linearization lives in fragment linearization.

Siblings: CORE-CHAIN-02 (the extends diamond through stand-ins), CORE-CHAIN-06 (the real-sync template), CORE-CHAIN-10
(the shared base evaluated once, and the app extending the diamond).

> Search terms: diamond, branch override, last writer wins, shared base, extends order, fragment concatenation, dedupe, real sync, CORE-CHAIN-02, CORE-CHAIN-06, CORE-CHAIN-10
