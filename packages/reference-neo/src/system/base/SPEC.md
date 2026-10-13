# Extends composition

Neo's TS fragment path is now the only `extends` implementation. The Rust resolver (`BaseSystem::from_specs`, `packages/reference-rs/modules/base-system/src/extends/`) is retired: no Neo code calls it, and the native request carries upstream names, not fragments.

Each claim is proven by the cases listed, or marked `open` (no case yet) or `pending` (case being added, not yet in the tree). Layer rules live in `packages/reference-neo/tests/cases/layers/SPEC.md`.

## Claims

- **E1 Linearize.** Each `extends` entry gives its published named fragment list, upstream first and its own last. Concatenate them in declared order, keep each name at its first occurrence, then append the local fragments.
  - Proof: open.
- **E2 Evaluate once.** Each system's fragment is evaluated exactly once, and a shared base appears once in the republished list.
  - Proof: NEO-CHAIN-09, NEO-CHAIN-10 (pending; red until the fix lands).
  - NEO-CHAIN-02 pins the duplicate today. It contradicts E2 and will be updated.
- **E3 Later wins.** For `[B, C]`, C's own leaves beat B's on the same leaf path.
  - Proof: NEO-CHAIN-04 (direct entries only).
- **E4 Local wins.** Local beats every upstream on the same leaf path.
  - Proof: NEO-SYNC-10 (one upstream).
- **E5 Diamond.** A branch's override survives unless a later system writes that path itself.
  - Proof: NEO-CHAIN-09, NEO-CHAIN-10 (pending).
- **E6 Transitive stability.** If E extends `[D]`, E resolves exactly what D resolved, on every path E does not write.
  - Proof: NEO-CHAIN-09, NEO-CHAIN-10 (pending).
- **E7 No cycles.** A self-reference or cycle through any reachable name (fragments or streams) is rejected with a named error.
  - Proof: NEO-LAYERS-14 legs 2-3 (self-named entry; cycle through stream names). Cycles through fragment names: open.
- **E8 No repeats in one field.** A name repeated within one field is rejected. A transitive repeat is deduped, not rejected.
  - Proof: NEO-LAYERS-14 legs 4-5 (repeats in `layers` and in `extends`). Transitive dedupe: open.
- **E9 Not both.** A system in both `extends` and `layers` is rejected.
  - Proof: pending (being added to NEO-LAYERS-03 or NEO-LAYERS-14). NEO-LAYERS-03 variant 3 pins acceptance today; D6 is held in `packages/reference-neo/tests/cases/layers/SPEC.md`.
- **E10 Private stripped.** Upstream `_private` is stripped at any depth. The system's own `_private` is kept.
  - Proof: NEO-SYNC-17.
- **E11 No fragment globalCss.** Upstream globalCss is not collected from fragments. It ships through streams.
  - Proof: open.
- **E12 Font eviction.** Font dual-source eviction works across the boundary. Ported from Rust BAS-TOKEN-07 (`packages/reference-rs/modules/base-system/src/lower/tests.rs`).
  - Proof: open.
- **E13 Override warning.** When a local leaf replaces a different upstream value, sync emits one warning per path, naming the path, the upstream system and both values. Equal values and `extendSystem` overrides stay silent.
  - Proof: open.
- **E14 One merge.** `mergeTokenTree` serves fragments, the E13 diagnostic and `extendSystem`. Under extends, an `extendSystem` result contributes one named fragment node, `extend:<base>`, after the base's nodes.
  - Proof: open (no `mergeTokenTree` in `packages/reference-neo/src` yet).
- **E15 Legacy entries.** Legacy `{name, fragment}` entries are accepted as one opaque node.
  - Proof: open.
