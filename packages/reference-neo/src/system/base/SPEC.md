# Extends composition

Neo's TS fragment path is now the only `extends` implementation. The Rust resolver (`BaseSystem::from_specs`, `packages/reference-rs/modules/base-system/src/extends/`) is retired: no Neo code calls it, and the native request carries upstream names, not fragments.

Each claim is proven by the cases listed, or marked `open` (no case yet) or `pending` (case being added, not yet in the tree). Layer rules live in `packages/reference-neo/tests/cases/layers/SPEC.md`.

## Claims

- **E1 Linearize.** Each `extends` entry gives its published named fragment list, upstream first and its own last. Concatenate them in declared order, keep each name at its first occurrence, then append the local fragments.
  - Proof: NEO-CHAIN-09 and NEO-CHAIN-10 (the diamond through real syncs); `fragments.test.ts` (linearization and the node list); `collect/lib/prepare.test.ts` (node order across extends).
- **E2 Evaluate once.** Each system's fragment is evaluated exactly once, and a shared base appears once in the republished list.
  - Proof: NEO-CHAIN-09 and NEO-CHAIN-10 (each order keeps both overrides; the shared base is one node). NEO-CHAIN-02 (the diamond publishes `meta-base` once).
- **E3 Later wins.** For `[B, C]`, C's own leaves beat B's on the same leaf path.
  - Proof: NEO-CHAIN-04 (direct entries only).
- **E4 Local wins.** Local beats every upstream on the same leaf path.
  - Proof: NEO-SYNC-10 (one upstream).
- **E5 Diamond.** A branch's override survives unless a later system writes that path itself.
  - Proof: NEO-CHAIN-09 (both orders keep both overrides).
- **E6 Transitive stability.** If E extends `[D]`, E resolves exactly what D resolved, on every path E does not write.
  - Proof: NEO-CHAIN-10 (E extends `[D]` resolves exactly what D resolves, and paints it).
- **E7 No cycles.** A self-reference or cycle through any reachable name (fragments or streams) is rejected with a named error.
  - Proof: NEO-LAYERS-14 legs 2-3 (self-named entry; cycle through stream names). NEO-CHAIN-11 (cycle through fragment names).
- **E8 No repeats in one field.** A name repeated within one field is rejected. A transitive repeat is deduped, not rejected.
  - Proof: NEO-LAYERS-14 legs 4-5 (repeats in `layers` and in `extends`). Transitive dedupe: NEO-CHAIN-10 (the shared base is one node in the list).
- **E9 Not both.** A system in both `extends` and `layers` is rejected.
  - Proof: pending (being added to NEO-LAYERS-03 or NEO-LAYERS-14). NEO-LAYERS-03 variant 3 pins acceptance today; D6 is held in `packages/reference-neo/tests/cases/layers/SPEC.md`.
- **E10 Private stripped.** Upstream `_private` is stripped at any depth. The system's own `_private` is kept.
  - Proof: NEO-SYNC-17.
- **E11 No fragment globalCss.** Upstream globalCss is not collected from fragments. It ships through streams.
  - Proof: open.
- **E12 Font eviction.** Font dual-source eviction works across the boundary. Ported from Rust BAS-TOKEN-07 (`packages/reference-rs/modules/base-system/src/lower/tests.rs`).
  - Proof: open.
- **E13 Override warning.** When a local leaf replaces a different upstream value, sync emits one warning per path, naming the path, the upstream system and both values. Equal values and `extendSystem` overrides stay silent.
  - Proof: NEO-CHAIN-12 (one warning per path, naming both values; the equal-value and upstream-over-upstream legs stay silent). `collect/lib/shadow.test.ts` covers the `extend:<base>` silence, which no case reaches yet.
- **E14 One merge.** `mergeTokenTree` serves fragments, the E13 diagnostic and `extendSystem`. Under extends, an `extendSystem` result contributes one named fragment node, `extend:<base>`, after the base's nodes.
  - Proof: `collect/lib/merge.test.ts` (leaf over leaf, leaf over group, group over leaf, untouched siblings); NEO-CHAIN-13 (a light-only leaf drops the dark value). `extendSystem` is not in the tree yet, so its `extend:<base>` node is unproven.
- **E15 Legacy entries.** Legacy `{name, fragment}` entries are accepted as one opaque node. Accepted limit: the bases a legacy bundle carries inside it cannot be deduped, so a legacy entry beside a named entry that shares its base evaluates that base twice, and the second run can undo the legacy branch's overrides (E2, E5 do not hold for that mix). Resyncing the legacy upstream removes it.
  - Proof: `fragments.test.ts` (a legacy entry reads as one opaque node); NEO-CHAIN-04 and NEO-CHAIN-05 (legacy stand-ins evaluate through the chain).
